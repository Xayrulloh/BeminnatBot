import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import Model from '#config/database'
import customKFunction from '#keyboard/custom'
import inlineKFunction from '#keyboard/inline'
import { IOrders, IProducts } from '#types/database'

const scene = new Scene<BotContext>('Bucket')

// initial increment, decrement or delete
scene.step(async (ctx) => {
  const orders = await Model.Orders.find<IOrders>({
    userId: ctx.user.id,
    status: false,
  })

  if (!orders.length) {
    await ctx.reply('Productlar topilmadi')

    return ctx.scene.exit()
  }

  const productIds = orders.map((order) => order.productId)

  const products = await Model.Products.find<IProducts>({
    id: { $in: productIds },
  })

  const amount = products.reduce((acc, curr) => acc + curr.price, 0)

  for (const product of products) {
    const button = inlineKFunction(3, [
      { view: '➕', text: 'increment' + product.id },
      { view: '🗑', text: 'delete' + product.id },
      { view: '➖', text: 'decrement' + product.id },
    ])

    await ctx.reply(product.name, {
      reply_markup: {
        ...button,
        keyboard: customKFunction(1, `Umumiy narxi ${amount}\n\n Buyurtma berish ✅`).build(),
      },
    })
  }
})

//

// Initial
// scene.step(async (ctx) => {
//   const buttons = inlineKFunction(2, [
//     { view: "Buyurtmalarni ko'rish", text: 'get orders' },
//     { view: "➕ Buyurtmani  qo'shish", text: 'add orders'},
//     {view:"➖ Buyurtmani o'chirish",text:"delete orders"}
//   ])

//   await ctx.reply('Quyidagilardan birini tanlang', { reply_markup: buttons }) // TODO: Clear buttons
// })

// // Create, Get and Delete
// scene.wait('crud').on('callback_query:data', async (ctx) => {
//   await ctx.answerCallbackQuery()

//   const inputData = ctx.update.callback_query.data

//   if (!['get orders', 'add orders', 'delete orders'].includes(inputData)) {
//     await ctx.answerCallbackQuery('Iltimos quyidagilardan birini tanlang')
//   }

//   ctx.session.command = inputData

//   await ctx.deleteMessage()

//   const addresses = await Model.Address.find<IAddress>({
//     userId: ctx.user.userId,
//   })

//   // checking
//   if (!addresses.length && ['get address', 'delete address'].includes(inputData)) {
//     ctx.reply('Sizda hali xech qanday joylashuv mavjud emas', {
//       reply_markup: {
//         keyboard: customKFunction(2, ...MAIN_KEYBOARD).build(),
//         resize_keyboard: true,
//       },
//       parse_mode: 'HTML',
//     })

//     return ctx.scene.exit()
//   }

//   // create
//   if (inputData === 'add address') {
//     if (addresses.length > 3) {
//       ctx.reply(
//         "Siz maksimal joylashuv miqdoriga yetdingiz\n\nJoyshlashuv kiritish uchun boshqa joylashuvingizni o'chirishingizni so'raymiz",
//         {
//           reply_markup: {
//             keyboard: customKFunction(2, ...MAIN_KEYBOARD).build(),
//             resize_keyboard: true,
//           },
//           parse_mode: 'HTML',
//         },
//       )

//       return ctx.scene.exit()
//     } else {
//       ctx.session.locationNames = addresses.map((address) => address.name)
//       ctx.reply('Joylashuv nomini kiriting')
//     }
//   } else if (inputData === 'get address') {
//     // get
//     for (const address of addresses) {
//       await ctx.reply(address.name, {
//         reply_markup: {
//           keyboard: customKFunction(2, ...MAIN_KEYBOARD).build(),
//           resize_keyboard: true,
//         },
//         parse_mode: 'HTML',
//       })
//       await ctx.replyWithLocation(address.latitude, address.longitude)
//     } // TODO: put indexes 1) smth, 2) smth, 3) smth

//     ctx.scene.exit()
//   } else {
//     // delete
//     const buttons = inlineKFunction(
//       2,
//       addresses.map((address) => {
//         return { text: address.name, view: address.name }
//       }),
//     )

//     ctx.session.deleteButtons = buttons

//     await ctx.reply("Qaysi birini o'chirishni xohlaysiz?", { reply_markup: buttons })
//   }

//   ctx.scene.resume()
// })

// scene.wait('create_delete').on(['callback_query:data', 'message:text'], async (ctx) => {
//   const inlineData = ctx.update?.callback_query?.data
//   const textData = ctx.message?.text

//   // checking
//   if (
//     (ctx.session.command === 'add address' && !textData && inlineData) ||
//     (ctx.session.command === 'add address' && textData && ctx.session.locationNames.includes(textData))
//   ) {
//     return ctx.reply('Joylashuv nomini kiriting')
//   } else if (ctx.session.command === 'delete address' && textData && !inlineData) {
//     await ctx.answerCallbackQuery()

//     await ctx.reply("Qaysi birini o'chirishni xohlaysiz?", { reply_markup: ctx.session.deleteButtons })
//   }

//   // delete
//   if (ctx.session.command === 'delete address') {
//     await ctx.answerCallbackQuery()

//     await Model.Address.deleteOne({
//       userId: ctx.user.userId,
//       name: inlineData,
//     })

//     ctx.reply("Joylashuv o'chirildi", {
//       reply_markup: {
//         keyboard: customKFunction(2, ...MAIN_KEYBOARD).build(),
//         resize_keyboard: true,
//       },
//       parse_mode: 'HTML',
//     })

//     return ctx.scene.exit()
//   } else {
//     ctx.session.newLocationName = textData

//     const keyboard = new Keyboard().requestLocation('📍 Yangi joylashuv').resized().oneTime()

//     ctx.reply("Joylashuvingizni jo'nating", {
//       reply_markup: keyboard,
//     })
//   }

//   ctx.scene.resume()
// })

// scene.wait('create').on('message:location', async (ctx) => {
//   const location = ctx.message.location

//   await Model.Address.create<IAddress>({
//     latitude: location.latitude,
//     longitude: location.longitude,
//     userId: ctx.user.userId,
//     name: ctx.session.newLocationName,
//   })

//   await ctx.reply("Yangi joylashuv muvaffaqiyatli qo'shildi", {
//     reply_markup: {
//       keyboard: customKFunction(2, ...MAIN_KEYBOARD).build(),
//       resize_keyboard: true,
//     },
//     parse_mode: 'HTML',
//   })

//   ctx.scene.exit()
// })

export default scene
