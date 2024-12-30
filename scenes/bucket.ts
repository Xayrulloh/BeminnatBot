// import { Scene } from 'grammy-scenes'
// import { BotContext } from '#types/context'
// import Model from '#config/database'
// import inlineKFunction from '#keyboard/inline'
// import { IOrder, IProduct } from '#types/database'
// import { exitScene } from '#helper/exitScene'
// import { env } from '#utils/env'
// import customKFunction from '#keyboard/custom'

// const scene = new Scene<BotContext>('Bucket')

// scene.step(async (ctx) => {
//   const orders = await Model.Order.find<IOrder>({
//     userId: ctx.user.userId,
//     status: false,
//   })

//   if (!orders.length) {
//     return exitScene(ctx, "Savatchangiz bo'sh")
//   }

//   const productIds = orders.map((order) => order.productId)

//   const products = await Model.Product.find<IProduct>({
//     id: { $in: productIds },
//   })

//   const productObj: Record<number, IProduct> = {}

//   products.forEach((product) => {
//     productObj[product.id] = product
//   })

//   ctx.session.messageIds = []
//   ctx.session.chatId = ctx.chat?.id
//   ctx.session.orderObj = {}
//   ctx.session.amount = 0

//   for (const order of orders) {
//     ctx.session.orderObj[order.id] = order

//     const buttons = inlineKFunction(3, [
//       { view: '➕', text: `increment_${order.id}` },
//       { view: '🗑', text: `delete_${order.id}` },
//       { view: '➖', text: `decrement_${order.id}` },
//     ])

//     const message = await ctx.replyWithPhoto(`${env.CLOUDFLARE_URL}${productObj[order.productId].image}`, {
//       reply_markup: buttons,
//       caption: `Nomi: ${productObj[order.productId].name}\nMa\'lumoti: ${
//         productObj[order.productId].description
//       }\nNarxi: ${productObj[order.productId].price}\nSoni: ${order.quantity}`,
//     })

//     ctx.session.messageIds.push(message.message_id)
//     ctx.session.productObj = productObj
//     ctx.session.amount += productObj[order.productId].price * order.quantity
//   }

//   const message = await ctx.reply(`Umumiy narxi: ${ctx.session.amount} sum`, {
//     reply_markup: {
//       resize_keyboard: true,
//       keyboard: customKFunction(2, `Buyurtma berish ✅`, '🚪Chiqish').build(),
//     },
//   })

//   ctx.session.amountMessageId = message.message_id

//   ctx.session.messageIds.push(message.message_id)
// })

// scene.wait('main').on(['callback_query:data', 'message:text'], async (ctx) => {
//   const inlineData = ctx.update?.callback_query?.data

//   const command = inlineData?.split('_')[0]
//   const orderId = inlineData?.split('_')[1]

//   const textData = ctx.message?.text

//   // check text
//   if (textData && !['Buyurtma berish ✅', '🚪Chiqish'].includes(textData)) {
//     const message = await ctx.reply('Iltimos tugmalardan foydalaning')

//     return ctx.session.messageIds.push(message.message_id)
//   }

//   // check inline
//   if (command && !['increment', 'decrement', 'delete'].includes(command)) {
//     return await ctx.answerCallbackQuery({ text: 'Iltimos quyidagilardan birini tanlang', show_alert: true })
//   }

//   if (textData) {
//     if (textData === 'Buyurtma berish ✅') {
//       // notify admin
//       // ----------------
//       // users
//       // products
//       // ----------------

//       await Model.Order.updateMany({ userId: ctx.user.userId, status: false }, { status: true })
//       return exitScene(ctx, 'Buyurtma muvaffaqiyatli berildi.\n Tez orada xaydovchi sizga aloqaga chiqadi')
//     } else {
//       return exitScene(ctx, "Asosiy menyuga o'tildi")
//     }
//   } else if (command && orderId) {
//     if (command === 'delete') {
//       await ctx.answerCallbackQuery("Mahsulot savatchadan o'chirildi")

//       await Model.Order.deleteOne({ userId: ctx.user.userId, id: orderId })

//       ctx.session.amount = 0

//       for (let key in ctx.session.orderObj) {
//         if (key !== orderId) {
//           ctx.session.amount +=
//             ctx.session.productObj[ctx.session.orderObj[key].productId].price * ctx.session.orderObj[key].quantity
//         }
//       }
//     } else {
//       const buttons = inlineKFunction(3, [
//         { view: '➕', text: `increment_${orderId}` },
//         { view: '🗑', text: `delete_${orderId}` },
//         { view: '➖', text: `decrement_${orderId}` },
//       ])

//       if (command === 'decrement' && ctx.session.orderObj[orderId].quantity === 1) {
//         return await ctx.answerCallbackQuery("Mahsulot soni 1 dan kam bo'lmasligi kerak")
//       }

//       if (command === 'increment') {
//         await Model.Order.updateOne({ userId: ctx.user.userId, id: orderId }, { $inc: { quantity: 1 } })

//         await ctx.answerCallbackQuery('Mahsulot soni oshirildi')

//         await ctx.editMessageCaption({
//           caption: `Nomi: ${ctx.session.productObj[ctx.session.orderObj[orderId].productId].name}\nMa\'lumoti: ${
//             ctx.session.productObj[ctx.session.orderObj[orderId].productId].description
//           }\nNarxi: ${ctx.session.productObj[ctx.session.orderObj[orderId].productId].price}\nSoni: ${
//             ctx.session.orderObj[orderId].quantity + 1
//           }`,
//           reply_markup: buttons,
//         })

//         ctx.session.orderObj[orderId].quantity = ctx.session.orderObj[orderId].quantity + 1

//         ctx.session.amount = ctx.session.amount + ctx.session.productObj[ctx.session.orderObj[orderId].productId].price
//       } else {
//         await Model.Order.updateOne({ userId: ctx.user.userId, id: orderId }, { $inc: { quantity: -1 } })

//         await ctx.answerCallbackQuery('Mahsulot soni kamaytirildi')

//         await ctx.editMessageCaption({
//           caption: `Nomi: ${ctx.session.productObj[ctx.session.orderObj[orderId].productId].name}\nMa\'lumoti: ${
//             ctx.session.productObj[ctx.session.orderObj[orderId].productId].description
//           }\nNarxi: ${ctx.session.productObj[ctx.session.orderObj[orderId].productId].price}\nSoni: ${
//             ctx.session.orderObj[orderId].quantity - 1
//           }`,
//           reply_markup: buttons,
//         })

//         ctx.session.orderObj[orderId].quantity = ctx.session.orderObj[orderId].quantity - 1

//         ctx.session.amount = ctx.session.amount - ctx.session.productObj[ctx.session.orderObj[orderId].productId].price
//       }
//     }

//     await ctx.api.deleteMessage(ctx.session.chatId, ctx.session.amountMessageId)

//     const message = await ctx.reply(`Umumiy narxi: ${ctx.session.amount} sum`, {
//       reply_markup: {
//         resize_keyboard: true,
//         keyboard: customKFunction(2, `Buyurtma berish ✅`, '🚪Chiqish').build(),
//       },
//     })

//     ctx.session.messageIds.push(message.message_id)
//     ctx.session.amountMessageId = message.message_id
//   }
// })

// export default scene
