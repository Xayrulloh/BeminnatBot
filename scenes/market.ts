import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import { IOrder, IProduct } from '#types/database'
import Model from '#config/database'
import { messageDeleter } from '#helper/messageDeleter'
import { exitScene } from '#helper/exitScene'
import customKFunction from '#keyboard/custom'
import inlineKFunction from '#keyboard/inline'
import { PER_PAGE } from '#utils/constants'

const scene = new Scene<BotContext>('Market')

// initial
scene.step(async (ctx) => {
  ctx.session.chatId = ctx.chat?.id
  ctx.session.messageIds = []

  const message = await ctx.reply("Barcha maxsulotlarni ko'rishni xohlaysizmi yoki qidirishni?", {
    reply_markup: {
      keyboard: customKFunction(2, '🔍 Qidirish', "👁️ Ko'rish", '🚪Chiqish').build(),
      resize_keyboard: true,
    },
  })

  ctx.session.messageIds.push(message.message_id)
})

// command
scene.wait('search').on('message:text', async (ctx) => {
  await messageDeleter(ctx)

  const textData = ctx.message?.text

  // check
  if (!['🚪Chiqish', '🔍 Qidirish', "👁️ Ko'rish"].includes(textData)) {
    const message = await ctx.reply("Barcha maxsulotlarni ko'rishni xohlaysizmi yoki qidirishni?", {
      reply_markup: {
        keyboard: customKFunction(2, '🔍 Qidirish', "👁️ Ko'rish", '🚪Chiqish').build(),
        resize_keyboard: true,
      },
    })

    return ctx.session.messageIds.push(message.message_id)
  }

  if (textData === '🚪Chiqish') {
    return exitScene(ctx, "Asosiy menuga o'tildi")
  } else if (textData === '🔍 Qidirish') {
    ctx.session.show = 'search'

    const message = await ctx.reply('Qidirish uchun maxsulot nomini kiriting', {
      reply_markup: {
        resize_keyboard: true,
        keyboard: customKFunction(1, '🚪Chiqish').build(),
      },
    })

    ctx.session.messageIds.push(message.message_id)

    ctx.scene.resume()
  } else if (textData === "👁️ Ko'rish") {
    ctx.session.show = 'show'

    const products = await Model.Product.find<IProduct>()

    if (products.length === 0) {
      return exitScene(ctx, "Maxsulotlar ro'yxati bo'sh\n\n Asosiy menuga o'tildi")
    }

    const buttons = inlineKFunction(
      2,
      products.map((product) => {
        return { view: product.name, text: product.id.toString() }
      }),
    )

    const message = await ctx.reply("Barcha maxsulotlar ro'yxati", { reply_markup: buttons })

    ctx.session.messageIds.push(message.message_id)

    ctx.scene.resume()
  }
})

// action part 1
scene.wait('show').on(['callback_query:data', 'message:text'], async (ctx) => {
  await messageDeleter(ctx)

  const inlineData = ctx.update?.callback_query?.data ? +ctx.update?.callback_query?.data : null

  const textData = ctx.message?.text

  if (inlineData) {
    ctx.answerCallbackQuery()
  }

  const product = await Model.Product.findOne<IProduct>({
    $or: [
      { id: inlineData },
      { name: { $regex: '.*' + textData + '.*' } },
      { description: { $regex: '.*' + textData + '.*', $options: 'i' } },
    ],
  }).limit(PER_PAGE)

  if (!product) {
    return exitScene(ctx, "Bunday maxsulot mavjud emas\n\n Asosiy menuga o'tildi")
  } else {
    const message = await ctx.replyWithPhoto(`https://pub-077f05899f294e24b391111fce1ebf0b.r2.dev/${product.image}`, {
      caption: `Nomi: ${product.name}\nMa'lumoti: ${product.description}\nNarxi: ${product.price}\nTuri: ${product.type}`,
      reply_markup: {
        keyboard: customKFunction(1, "➕ Savatga qo'shish", '🚪Chiqish').build(),
        resize_keyboard: true,
      },
    })

    ctx.session.messageIds.push(message.message_id)
    ctx.session.product = product
  }

  ctx.scene.resume()
})

// action part 2
scene.wait('bucket').on('message:text', async (ctx) => {
  const textData = ctx.message?.text

  // check
  if (!["➕ Savatga qo'shish", '🚪Chiqish'].includes(textData)) {
    const message = await ctx.reply('Quyidagi amallardan birini tanlang', {
      reply_markup: {
        keyboard: customKFunction(2, "➕ Savatga qo'shish", '🚪Chiqish').build(),
        resize_keyboard: true,
      },
    })

    return ctx.session.messageIds.push(message.message_id)
  }

  if (textData === '🚪Chiqish') {
    return exitScene(ctx, "Asosiy menuga o'tildi")
  } else {
    if (ctx.session.product.type === 'miqdor') {
      const message = await ctx.reply("Ushbu mahsulotdan nechta qo'shishni xohlaysiz?\n\n Masalan: 1 ta, 2 ta, 3 ta", {
        reply_markup: {
          keyboard: customKFunction(1, '🚪Chiqish').build(),
          resize_keyboard: true,
        },
      })

      ctx.session.messageIds.push(message.message_id)

      ctx.scene.resume()
    } else {
      const message = await ctx.reply(
        'Ushbu mahsulotdan necha kg yoki g olishni xohlaysiz?\n\n Masalan: 1 kg, 400 g, 5 kg',
        {
          reply_markup: {
            keyboard: customKFunction(1, '🚪Chiqish').build(),
            resize_keyboard: true,
          },
        },
      )

      ctx.session.messageIds.push(message.message_id)

      ctx.scene.resume()
    }
  }
})

// finish
scene.wait('quantity_weight').on('message:text', async (ctx) => {
  const textData = ctx.message?.text

  if (textData === '🚪Chiqish') {
    return exitScene(ctx, "Asosiy menuga o'tildi")
  }

  if (ctx.session.product.type === 'miqdor') {
    if (!/^(\d+)\s*ta$/.test(textData)) {
      const message = await ctx.reply("Ushbu mahsulotdan nechta qo'shishni xohlaysiz?\n\n Masalan: 1 ta, 2 ta, 3 ta", {
        reply_markup: {
          keyboard: customKFunction(1, '🚪Chiqish').build(),
          resize_keyboard: true,
        },
      })

      ctx.session.messageIds.push(message.message_id)
    } else {
      const userOrder = await Model.Order.findOne<IOrder>({
        userId: ctx.user.userId,
        productId: ctx.session.product.id,
        status: false,
        isDelivered: false,
      })

      const result = textData.match(/^(\d+)\s*ta$/)!

      if (userOrder) {
        userOrder.quantity! += parseInt(result![1])

        await userOrder.save()
      } else {
        await Model.Order.create<IOrder>({
          id: Date.now(),
          userId: ctx.user.userId,
          productId: ctx.session.product.id,
          quantity: parseInt(result![1]),
          status: false,
          isDelivered: false,
        })
      }

      return exitScene(ctx, "Savatga muvaffaqiyatli qo'shildi\n\n Asosiy menuga o'tildi")
    }
  } else {
    if (!/^([\d.]+)\s*(kg|g)$/.test(textData)) {
      const message = await ctx.reply(
        'Ushbu mahsulotdan necha kg yoki g olishni xohlaysiz?\n\n Masalan: 1 kg, 400 g, 5 kg',
        {
          reply_markup: {
            keyboard: customKFunction(1, '🚪Chiqish').build(),
            resize_keyboard: true,
          },
        },
      )

      ctx.session.messageIds.push(message.message_id)
    } else {
      const result = textData.match(/^([\d.]+)\s*(kg|g)$/)!
      const weight = parseFloat(result![1])
      const kgOrg = result![2]

      const userOrder = await Model.Order.findOne<IOrder>({
        userId: ctx.user.userId,
        productId: ctx.session.product.id,
        status: false,
        isDelivered: false,
      })

      if (userOrder) {
        if (kgOrg === 'kg') {
          userOrder.weight! += weight
        } else {
          userOrder.weight! += weight / 1000
        }

        await userOrder.save()
      } else {
        await Model.Order.create<IOrder>({
          id: Date.now(),
          userId: ctx.user.userId,
          productId: ctx.session.product.id,
          weight: kgOrg === 'kg' ? weight : weight / 1000,
          status: false,
          isDelivered: false,
        })
      }

      return exitScene(ctx, "Savatga muvaffaqiyatli qo'shildi\n\n Asosiy menuga o'tildi")
    }
  }
})

export default scene
