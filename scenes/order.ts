import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import { IOrder, IProduct } from '#types/database'
import Model from '#config/database'
import { exitScene } from '#helper/exitScene'
import customKFunction from '#keyboard/custom'
import inlineKFunction from '#keyboard/inline'

const scene = new Scene<BotContext>('Order')

// initial
scene.step(async (ctx) => {
  ctx.session.messageIds = []

  const orders = await Model.Order.find<IOrder>({ userId: ctx.user.userId, status: true, isDelivered: true })

  if (!orders.length) {
    return exitScene(ctx, "Buyurtmalar ro'yxati bo'sh\n\n Asosiy menuga o'tildi")
  }

  const productIds = orders.map((order) => order.productId)
  const products = await Model.Product.find<IProduct>({ id: { $in: productIds } })

  const productObj: Record<number, IProduct> = {}
  const orderObj: Record<number, IOrder> = {}

  products.forEach((product) => {
    productObj[product.id] = product
  })

  orders.forEach((order) => {
    orderObj[order.productId] = order
  })

  ctx.session.productObj = productObj
  ctx.session.orderObj = orderObj

  const overallCost = products.reduce((acc, product) => {
    return acc + product.price * (orderObj[product.id].quantity || orderObj[product.id].weight)!
  }, 0)

  const buttons = inlineKFunction(
    2,
    orders.map((order) => {
      return { view: productObj[order.productId].name, text: order.productId.toString() }
    }),
  )

  const inlineMessage = await ctx.reply("Barcha buyurtmalar ro'yxati", { reply_markup: buttons })

  ctx.session.messageIds.push(inlineMessage.message_id)

  const message = await ctx.reply(`Barcha buyurtma qilingan maxsulotlar narxi: ${overallCost} sum`, {
    reply_markup: {
      resize_keyboard: true,
      keyboard: customKFunction(1, '🚪Chiqish').build(),
    },
  })

  ctx.session.messageIds.push(message.message_id)
})

// final
scene.wait('product').on(['callback_query:data', 'message:text'], async (ctx) => {
  const textData = ctx.message?.text

  if (textData && textData === '🚪Chiqish') {
    return exitScene(ctx, "Asosiy menuga o'tildi")
  }

  await ctx.answerCallbackQuery()

  const productId = ctx.update?.callback_query?.data!

  const message = await ctx.replyWithPhoto(
    `https://pub-077f05899f294e24b391111fce1ebf0b.r2.dev/${ctx.session.productObj[productId].image}`,
    {
      caption: `Maxsulot nomi: ${ctx.session.productObj[productId].name}\nMaxsulot ma'lumoti: ${
        ctx.session.productObj[productId].description
      }\nMaxsulot umumiy narxi: ${
        ctx.session.productObj[productId].price *
        (ctx.session.orderObj[productId].quantity || ctx.session.orderObj[productId].weight)!
      }\nMaxsulot turi: ${ctx.session.productObj[productId].type}\n${
        ctx.session.productObj[productId].type === 'miqdor'
          ? `Maxsulot miqdori: ${ctx.session.orderObj[productId].quantity} ta`
          : `Maxsulot og'irligi: ${ctx.session.orderObj[productId].weight} kg`
      }`,
    },
  )

  ctx.session.messageIds.push(message.message_id)
})

export default scene
