import { Scene } from 'grammy-scenes'
import { randomBytes } from 'crypto'
import { BotContext } from '#types/context'
import { IProduct } from '#types/database'
import Model from '#config/database'
import { messageDeleter } from '#helper/messageDeleter'
import { exitScene } from '#helper/exitScene'
import customKFunction from '#keyboard/custom'
import inlineKFunction from '#keyboard/inline'
import { env } from '#utils/env'
import { deleteImage, uploadImage } from '#helper/cloudflare'
import { ADMIN_USER_ID, PER_PAGE } from '#utils/constants'

const scene = new Scene<BotContext>('AdminProduct')

// initial
scene.step(async (ctx) => {
  if (ctx.user.userId != ADMIN_USER_ID) {
    return ctx.scene.exit()
  }

  const message = await ctx.reply('Quyidagi amallardan birini tanlang', {
    reply_markup: {
      keyboard: customKFunction(
        2,
        "🛍️ Maxsulotlar ro'yxati",
        "➕ Yangi maxsulot qo'shish",
        "✏️ Maxsulotni o'zgartirish",
        "❌ Maxsulotni o'chirish",
        '🚪Chiqish',
      ).build(),
      resize_keyboard: true,
    },
  })

  ctx.session.chatId = ctx.chat?.id
  ctx.session.messageIds = []

  ctx.session.messageIds.push(message.message_id)
})

// decide action
scene.wait('action').on('message:text', async (ctx) => {
  await messageDeleter(ctx)

  const action = ctx.message.text

  // check
  if (
    ![
      "🛍️ Maxsulotlar ro'yxati",
      "➕ Yangi maxsulot qo'shish",
      "✏️ Maxsulotni o'zgartirish",
      "❌ Maxsulotni o'chirish",
      '🚪Chiqish',
    ].includes(action)
  ) {
    const message = await ctx.reply('Quyidagi amallardan birini tanlang', {
      reply_markup: {
        keyboard: customKFunction(
          2,
          "🛍️ Maxsulotlar ro'yxati",
          "➕ Yangi maxsulot qo'shish yoki ✏️ Maxsulotni o'zgartirish",
          "❌ Maxsulotni o'chirish",
          '🚪Chiqish',
        ).build(),
        resize_keyboard: true,
      },
    })

    return ctx.session.messageIds.push(message.message_id)
  }

  if (action === '🚪Chiqish') {
    return exitScene(ctx, "Asosiy menuga o'tildi")
  } else if (action === "🛍️ Maxsulotlar ro'yxati") {
    ctx.session.command = 'show'

    const message = await ctx.reply("Barcha maxsulotlarni ko'rishni xohlaysizmi yoki qidirishni?", {
      reply_markup: {
        keyboard: customKFunction(2, '🔍 Qidirish', "👁️ Ko'rish", '🚪Chiqish').build(),
        resize_keyboard: true,
      },
    })

    ctx.session.messageIds.push(message.message_id)
  } else if (action === "❌ Maxsulotni o'chirish") {
    ctx.session.command = 'delete'

    const message = await ctx.reply("O'chirish uchun maxsulot nomini kiriting", {
      reply_markup: {
        resize_keyboard: true,
        keyboard: customKFunction(1, '🚪Chiqish').build(),
      },
    })

    ctx.session.messageIds.push(message.message_id)
  } else {
    ctx.session.command = "✏️ Maxsulotni o'zgartirish" === action ? 'update' : 'create'

    const message = await ctx.replyWithPhoto('https://pub-077f05899f294e24b391111fce1ebf0b.r2.dev/browser.jpg', {
      caption:
        "Iltimos ma'lumotlarni quyidagi tartibda kiriting!\n\nNomi:\nMa'lumoti:\nNarxi:\nTuri: (miqdor yoki og'irlik)",
      reply_markup: {
        resize_keyboard: true,
        keyboard: customKFunction(1, '🚪Chiqish').build(),
      },
    })

    ctx.session.messageIds.push(message.message_id)
  }

  ctx.scene.resume()
})

// action part 1
scene.wait('command').on(['message:text', 'message:file'], async (ctx) => {
  await messageDeleter(ctx)

  const textData = ctx.message.text

  if (textData === '🚪Chiqish') {
    return exitScene(ctx, "Asosiy menuga o'tildi")
  } else if (ctx.session.command === 'delete') {
    const product = await Model.Product.findOne<IProduct>({ name: { $regex: '.*' + textData + '.*', $options: 'i' } })

    if (!product) {
      return exitScene(ctx, "Bunday maxsulot mavjud emas\n\n Asosiy menuga o'tildi")
    }

    await Model.Product.deleteOne({ id: product.id })

    return exitScene(ctx, "Maxsulot o'chirildi\n\n Asosiy menuga o'tildi")
  } else if (ctx.session.command === 'create' || ctx.session.command === 'update') {
    const caption = ctx.message?.caption
    const splitData = caption?.split('\n')

    const name = splitData?.[0]?.split('Nomi:')?.[1]?.trim()
    const description = splitData?.[1]?.split("Ma'lumoti:")?.[1]?.trim()
    const price = splitData?.[2]?.split('Narxi:')?.[1]?.trim()
    const type = splitData?.[3]?.split('Turi:')?.[1]?.trim()

    if (!name || !description || !price || !type) {
      const message = await ctx.replyWithPhoto('https://pub-077f05899f294e24b391111fce1ebf0b.r2.dev/browser.jpg', {
        caption:
          "Iltimos ma'lumotlarni quyidagi tartibda kiriting!\n\nNomi:\nMa'lumoti:\nNarxi:\nTuri: (miqdor yoki og'irlik)",
        reply_markup: {
          resize_keyboard: true,
          keyboard: customKFunction(1, '🚪Chiqish').build(),
        },
      })

      ctx.session.messageIds.push(message.message_id)
    }

    const file = await ctx.getFile()
    const filePath = file.file_path
    const telegramFileUrl = `https://api.telegram.org/file/bot${env.TOKEN}/${filePath}`
    const imageName = randomBytes(16).toString('hex') + '.png'
    const product = await Model.Product.findOne<IProduct>({ name })

    if (!product && ctx.session.command === 'create') {
      await uploadImage(telegramFileUrl, imageName)

      await Model.Product.create<IProduct>({
        id: Date.now(),
        name,
        description,
        price: +price!,
        image: imageName,
        type,
      })

      return exitScene(ctx, "Mahsulot muvaffaqiyatli qo'shildi")
    } else if (ctx.session.command === 'update' && product) {
      deleteImage(product?.image)

      await uploadImage(telegramFileUrl, imageName)

      await Model.Product.updateOne(
        { id: product.id },
        {
          name,
          description,
          price: +price!,
          image: imageName,
          type,
        },
      )

      return exitScene(ctx, "Mahsulot muvaffaqiyatli o'zgartirildi")
    } else {
      return exitScene(ctx, "Bunday maxsulot mavjud emas\n\n Asosiy menuga o'tildi")
    }
  } else if (ctx.session.command === 'show') {
    if (textData === '🔍 Qidirish') {
      ctx.session.show = 'search'

      const message = await ctx.reply('Qidirish uchun maxsulot nomini kiriting', {
        reply_markup: {
          resize_keyboard: true,
          keyboard: customKFunction(1, '🚪Chiqish').build(),
        },
      })

      ctx.session.messageIds.push(message.message_id)
    } else if (textData === "👁️ Ko'rish") {
      ctx.session.show = 'show'

      const products = await Model.Product.find<IProduct>()

      if (products.length === 0) {
        return exitScene(ctx, "Maxsulotlar ro'yxati bo'sh\n\n Asosiy menuga o'tildi")
      }

      ctx.session.inlineKeyboard = products.map((product) => {
        return { view: product.name, text: product.id.toString() }
      })

      ctx.session.currPage = 1

      const buttons = inlineKFunction(2, ctx.session.inlineKeyboard)

      const message = await ctx.reply("Barcha maxsulotlar ro'yxati", { reply_markup: buttons })

      ctx.session.messageIds.push(message.message_id)
    }

    ctx.scene.resume()
  }
})

// finish
scene.wait('show').on(['callback_query:data', 'message:text'], async (ctx) => {
  const inputData = ctx.update?.callback_query?.data

  if (inputData) {
    if (inputData == '<') {
      if (ctx.session.currPage != 1) {
        await ctx.editMessageText("Barcha maxsulotlar ro'yxati", {
          reply_markup: inlineKFunction(3, ctx.session.inlineKeyboard, --ctx.session.currPage),
          parse_mode: 'HTML',
        })
      } else {
        await ctx.answerCallbackQuery('Quyidagilardan birini bosing')
      }

      return
    } else if (inputData == '>') {
      if (ctx.session.currPage * PER_PAGE <= ctx.session.inlineKeyboard.length) {
        await ctx.editMessageText("Barcha maxsulotlar ro'yxati", {
          reply_markup: inlineKFunction(3, ctx.session.inlineKeyboard, ++ctx.session.currPage),
          parse_mode: 'HTML',
        })
      } else {
        await ctx.answerCallbackQuery('Quyidagilardan birini bosing')
      }

      return
    } else if (inputData == 'pageNumber') {
      await ctx.answerCallbackQuery('Quyidagilardan birini bosing')

      return
    }

    await ctx.answerCallbackQuery()
  }

  await messageDeleter(ctx)

  const inlineData = ctx.update?.callback_query?.data ? +ctx.update?.callback_query?.data : null
  const textData = ctx.message?.text

  const product = await Model.Product.findOne<IProduct>({
    $or: [
      { id: inlineData },
      { name: { $regex: '.*' + textData + '.*', $options: 'i' } },
      { description: { $regex: '.*' + textData + '.*', $options: 'i' } },
    ],
  }).limit(PER_PAGE)

  if (!product) {
    return exitScene(ctx, "Bunday maxsulot mavjud emas\n\n Asosiy menuga o'tildi")
  } else {
    await ctx.replyWithPhoto(`https://pub-077f05899f294e24b391111fce1ebf0b.r2.dev/${product.image}`, {
      caption: `Nomi: ${product.name}\nMa'lumoti: ${product.description}\nNarxi: ${product.price}\nTuri: ${product.type}`,
    })
  }

  return exitScene(ctx, "Asosiy menuga o'tildi")
})

export default scene
