import { Scene } from 'grammy-scenes'
import { randomBytes } from 'crypto'
import { BotContext } from '#types/context'
import { ICategory, IProduct } from '#types/database'
import Model from '#config/database'
import { messageDeleter } from '#helper/messageDeleter'
import { exitScene } from '#helper/exitScene'
import customKFunction from '#keyboard/custom'
import inlineKFunction from '#keyboard/inline'
import { env } from '#utils/env'
import { deleteImage, uploadImage } from '#helper/cloudflare'
import { PER_PAGE } from '#utils/constants'

const scene = new Scene<BotContext>('AdminProduct')

// show categories
scene.step(async (ctx) => {
  if (ctx.user.userId != 1151533771) {
    return ctx.scene.exit()
  }

  ctx.session.messageIds = [ctx.update.message?.message_id]
  ctx.session.chatId = ctx.chat?.id

  const categories = await Model.Category.find<ICategory>()

  ctx.session.categories = categories

  if (!categories.length) {
    return exitScene(ctx, 'Kategoriyalar mavjud emas')
  }

  const message = await ctx.reply('Quyidagi kategoriyalardan birini tanlang', {
    reply_markup: {
      keyboard: customKFunction(3, ...categories.map((c) => c.name)).build(),
      resize_keyboard: true,
    },
  })

  ctx.session.messageIds.push(message.message_id)

  ctx.session.currPage = 1
})

// take which category and show products
scene.wait('category_name').on('message:text', async (ctx) => {
  const categoryName = ctx.message?.text

  ctx.session.messageIds.push(ctx.message?.message_id)

  // check if category exists
  if (!ctx.session.categories.find((c: ICategory) => c.name === categoryName)) {
    return ctx.reply('Bunday kategoriya mavjud emas\n\nQuyidagi kategoriyalardan birini tanlang')
  }

  ctx.session.categoryId = ctx.session.categories.find((c: ICategory) => c.name === categoryName)?.id

  await messageDeleter(ctx)

  const products = await Model.Product.find<IProduct>({
    categoryId: ctx.session.categoryId,
  })
    .sort({ id: -1 })
    .skip((ctx.session.currPage - 1) * PER_PAGE)
    .limit(PER_PAGE)

  ctx.session.productIds = products.map((p: IProduct) => p.id)

  ctx.session.messageIds = []

  // [product, with buttons [delete, update]] || pagination later
  for (const product of products) {
    const buttons = inlineKFunction(2, [
      { view: "🗑 O'chirish", text: `delete_${product.id}` },
      { view: '✏️ Yangilash', text: `update_${product.id}` },
    ])

    const message = await ctx.replyWithPhoto(`${env.CLOUDFLARE_URL}${product.image}`, {
      reply_markup: buttons,
      caption: `Nomi: ${product.name}\nMa\'lumoti: ${product.description}\nNarxi: ${product.price}`,
    })

    ctx.session.messageIds.push(message.message_id)
  }

  const properties = [
    { view: "➕ Yangi maxsulot qo'shish", text: 'create' },
    { view: '◀️ Chiqish', text: 'exit' },
  ]

  if (products.length === PER_PAGE) {
    properties.push({ view: '➡️ Keyingisi', text: 'next' })
  }

  const message = await ctx.reply("Yangi mahsulot qo'shishni xohlaysizmi?", {
    reply_markup: {
      ...inlineKFunction(2, properties),
    },
  })

  ctx.session.messageIds.push(message.message_id)

  ctx.scene.resume()
})

// decide what to do (create, delete, update)
scene.wait('create_delete_update').on('callback_query:data', async (ctx) => {
  const inlineData = ctx.update?.callback_query?.data

  const command = inlineData?.split('_')[0]
  const productId = inlineData?.split('_')[1]

  // check
  if (!['update', 'delete', 'create', 'exit', 'next', 'previous'].includes(command)) {
    return await ctx.answerCallbackQuery()
  }

  if (['next', 'previous'].includes(command)) {
    if (command === 'next') {
      ctx.session.currPage += 1

      await messageDeleter(ctx)

      const products = await Model.Product.find<IProduct>({
        categoryId: ctx.session.categoryId,
      })
        .sort({ id: -1 })
        .skip((ctx.session.currPage - 1) * PER_PAGE)
        .limit(PER_PAGE)

      ctx.session.productIds = products.map((p: IProduct) => p.id)

      ctx.session.messageIds = []

      // [product, with buttons [delete, update]] || pagination later
      for (const product of products) {
        const buttons = inlineKFunction(2, [
          { view: "🗑 O'chirish", text: `delete_${product.id}` },
          { view: '✏️ Yangilash', text: `update_${product.id}` },
        ])

        const message = await ctx.replyWithPhoto(`${env.CLOUDFLARE_URL}${product.image}`, {
          reply_markup: buttons,
          caption: `Nomi: ${product.name}\nMa\'lumoti: ${product.description}\nNarxi: ${product.price}`,
        })

        ctx.session.messageIds.push(message.message_id)
      }

      const properties = [
        { view: "➕ Yangi maxsulot qo'shish", text: 'create' },
        { view: '◀️ Chiqish', text: 'exit' },
      ]

      if (products.length === PER_PAGE * ctx.session.currPage) {
        properties.push({ view: '➡️ Keyingisi', text: 'next' })
      }

      if (ctx.session.currPage > 1) {
        properties.unshift({ view: '⬅️ Oldingisi', text: 'previous' })
      }

      const message = await ctx.reply("Yangi mahsulot qo'shishni xohlaysizmi?", {
        reply_markup: {
          ...inlineKFunction(2, properties),
        },
      })

      ctx.session.messageIds.push(message.message_id)
    } else if (command === 'previous') {
      ctx.session.currPage -= 1

      await messageDeleter(ctx)

      const products = await Model.Product.find<IProduct>({
        categoryId: ctx.session.categoryId,
      })
        .sort({ id: -1 })
        .skip((ctx.session.currPage - 1) * PER_PAGE)
        .limit(PER_PAGE)

      ctx.session.productIds = products.map((p: IProduct) => p.id)

      ctx.session.messageIds = []

      // [product, with buttons [delete, update]] || pagination later
      for (const product of products) {
        const buttons = inlineKFunction(2, [
          { view: "🗑 O'chirish", text: `delete_${product.id}` },
          { view: '✏️ Yangilash', text: `update_${product.id}` },
        ])

        const message = await ctx.replyWithPhoto(`${env.CLOUDFLARE_URL}${product.image}`, {
          reply_markup: buttons,
          caption: `Nomi: ${product.name}\nMa\'lumoti: ${product.description}\nNarxi: ${product.price}`,
        })

        ctx.session.messageIds.push(message.message_id)
      }

      const properties = [
        { view: "➕ Yangi maxsulot qo'shish", text: 'create' },
        { view: '◀️ Chiqish', text: 'exit' },
      ]

      if (products.length === PER_PAGE * ctx.session.currPage) {
        properties.push({ view: '➡️ Keyingisi', text: 'next' })
      }

      if (ctx.session.currPage > 1) {
        properties.unshift({ view: '⬅️ Oldingisi', text: 'previous' })
      }

      const message = await ctx.reply("Yangi mahsulot qo'shishni xohlaysizmi?", {
        reply_markup: {
          ...inlineKFunction(2, properties),
        },
      })

      ctx.session.messageIds.push(message.message_id)
    }
  } else {
    // check is product exists
    if (!ctx.session.productIds.includes(parseInt(productId)) && ['update', 'delete'].includes(command)) {
      return await ctx.answerCallbackQuery('Bunday mahsulot mavjud emas')
    }

    // create, update, delete
    if (command === 'create' || command === 'update') {
      // image, categoryId
      await messageDeleter(ctx)

      ctx.session.productId = productId

      const message = await ctx.replyWithPhoto('https://pub-077f05899f294e24b391111fce1ebf0b.r2.dev/browser.jpg', {
        caption: "Iltimos ma'lumotlarni quyidagi tartibda kiriting!\n\nNomi:\nMa'lumoti:\nNarxi:",
        reply_markup: {
          resize_keyboard: true,
          keyboard: customKFunction(1, '◀️ Chiqish').build(),
        },
      })

      ctx.session.messageIds = [message.message_id]

      ctx.session.command = command

      ctx.scene.resume()
    } else if (command === 'delete') {
      await Model.Product.deleteOne({ id: productId })

      return exitScene(ctx, "Mahsulotni muvaffaqiyatli o'chirildi")
    } else if (command === 'exit') {
      ctx.session.messageIds.push(ctx.message?.message_id)

      return exitScene(ctx, "Asosiy menuga o'tildi")
    }
  }
})

// create or update [text part]
scene.wait('create_update_text').on(['message:text', 'message:file'], async (ctx) => {
  const caption = ctx.message?.caption
  const splitData = caption?.split('\n')
  const name = splitData?.[0]?.split('Nomi:')?.[1]?.trim()
  const description = splitData?.[1]?.split("Ma'lumoti:")?.[1]?.trim()
  const price = splitData?.[2]?.split('Narxi:')?.[1]?.trim()

  const text = ctx.message?.text

  ctx.session.messageIds.push(ctx.message?.message_id)

  // check
  if ('◀️ Chiqish' !== text && (splitData?.length !== 3 || !name || !description || !price || isNaN(parseInt(price)))) {
    const message = await ctx.replyWithPhoto('https://pub-077f05899f294e24b391111fce1ebf0b.r2.dev/browser.jpg', {
      caption: "Iltimos ma'lumotlarni quyidagi tartibda kiriting!\n\nNomi:\nMa'lumoti:\nNarxi:",
      reply_markup: {
        resize_keyboard: true,
        keyboard: customKFunction(1, '◀️ Chiqish').build(),
      },
    })

    return ctx.session.messageIds.push(message.message_id)
  }

  // create or update
  if (text === '◀️ Chiqish') {
    return exitScene(ctx, "Asosiy menuga o'tildi")
  } else {
    const file = await ctx.getFile()
    const filePath = file.file_path
    const telegramFileUrl = `https://api.telegram.org/file/bot${env.TOKEN}/${filePath}`
    const imageName = randomBytes(16).toString('hex') + '.png'

    if (ctx.session.command === 'create') {
      await uploadImage(telegramFileUrl, imageName)

      await Model.Product.create({
        id: Date.now(),
        name,
        description,
        price: +price!,
        image: imageName,
        categoryId: ctx.session.categoryId,
      })

      return exitScene(ctx, "Mahsulot muvaffaqiyatli qo'shildi")
    } else if (ctx.session.command === 'update') {
      const product = await Model.Product.findOne({ id: ctx.session.productId })

      deleteImage(product?.image)

      await uploadImage(telegramFileUrl, imageName)

      await Model.Product.updateOne(
        { id: ctx.session.productId },
        {
          name,
          description,
          price: +price!,
          image: imageName,
          categoryId: ctx.session.categoryId,
        },
      )

      return exitScene(ctx, "Mahsulot muvaffaqiyatli o'zgartirildi")
    }
  }
})

export default scene
