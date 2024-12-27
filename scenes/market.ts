import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import { ICategory, IOrder, IProduct } from '#types/database'
import Model from '#config/database'
import { messageDeleter } from '#helper/messageDeleter'
import { exitScene } from '#helper/exitScene'
import customKFunction from '#keyboard/custom'
import inlineKFunction from '#keyboard/inline'
import { env } from '#utils/env'
import { PER_PAGE } from '#utils/constants'

const scene = new Scene<BotContext>('Market')

// show categories
scene.step(async (ctx) => {
  ctx.session.messageIds = [ctx.update.message?.message_id]
  ctx.session.chatId = ctx.chat?.id

  const categories = await Model.Category.find<ICategory>()

  ctx.session.categories = categories

  if (!categories.length) {
    return exitScene(ctx, 'Afsuski xech qanday kategoriya mavjud emas 😔')
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

  // [product, with buttons [add]]
  for (const product of products) {
    const buttons = inlineKFunction(1, [{ view: "➕ Savatga qo'shish", text: `add_${product.id}` }])

    const message = await ctx.replyWithPhoto(`${env.CLOUDFLARE_URL}${product.image}`, {
      reply_markup: buttons,
      caption: `Nomi: ${product.name}\nMa\'lumoti: ${product.description}\nNarxi: ${product.price}`,
    })

    ctx.session.messageIds.push(message.message_id)
  }

  const properties = [{ view: '🚪Chiqish', text: 'exit' }]

  if (products.length === PER_PAGE) {
    properties.push({ view: '➡️ Keyingisi', text: 'next' })
  }

  const message = await ctx.reply('Mahsulot', {
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
  if (!['add', 'exit', 'next', 'previous'].includes(command)) {
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

      // [product, with buttons [add]]
      for (const product of products) {
        const buttons = inlineKFunction(1, [{ view: "➕ Savatga qo'shish", text: `add_${product.id}` }])

        const message = await ctx.replyWithPhoto(`${env.CLOUDFLARE_URL}${product.image}`, {
          reply_markup: buttons,
          caption: `Nomi: ${product.name}\nMa\'lumoti: ${product.description}\nNarxi: ${product.price}`,
        })

        ctx.session.messageIds.push(message.message_id)
      }

      const properties = [{ view: '🚪Chiqish', text: 'exit' }]

      if (products.length === PER_PAGE * ctx.session.currPage) {
        properties.push({ view: '➡️ Keyingisi', text: 'next' })
      }

      if (ctx.session.currPage > 1) {
        properties.unshift({ view: '⬅️ Oldingisi', text: 'previous' })
      }

      const message = await ctx.reply('Mahsulot', {
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

      // [product, with buttons [add]]
      for (const product of products) {
        const buttons = inlineKFunction(1, [{ view: "➕ Savatga qo'shish", text: `add_${product.id}` }])

        const message = await ctx.replyWithPhoto(`${env.CLOUDFLARE_URL}${product.image}`, {
          reply_markup: buttons,
          caption: `Nomi: ${product.name}\nMa\'lumoti: ${product.description}\nNarxi: ${product.price}`,
        })

        ctx.session.messageIds.push(message.message_id)
      }

      const properties = [{ view: '🚪Chiqish', text: 'exit' }]

      if (products.length === PER_PAGE * ctx.session.currPage) {
        properties.push({ view: '➡️ Keyingisi', text: 'next' })
      }

      if (ctx.session.currPage > 1) {
        properties.unshift({ view: '⬅️ Oldingisi', text: 'previous' })
      }

      const message = await ctx.reply('Mahsulot', {
        reply_markup: {
          ...inlineKFunction(2, properties),
        },
      })

      ctx.session.messageIds.push(message.message_id)
    }
  } else {
    // check is product exists
    if (!ctx.session.productIds.includes(parseInt(productId)) && 'add' === command) {
      return await ctx.answerCallbackQuery('Bunday mahsulot mavjud emas')
    }

    // add
    if (command === 'add') {
      await ctx.answerCallbackQuery("Mahsulot savatga muvaffaqiyatli qo'shildi")

      // add to bucket (if exists just increase quantity)
      const order = await Model.Order.findOne<IOrder>({
        userId: ctx.user.userId,
        status: false,
        productId: parseInt(productId),
      })

      if (order) {
        order.quantity += 1

        await order.save()
      } else {
        await Model.Order.create<IOrder>({
          userId: ctx.user.userId,
          productId: parseInt(productId),
          quantity: 1,
          status: false,
          id: Date.now(),
        })
      }
    } else {
      ctx.session.messageIds.push(ctx.message?.message_id)

      return exitScene(ctx, "Asosiy menuga o'tildi")
    }
  }
})

export default scene
