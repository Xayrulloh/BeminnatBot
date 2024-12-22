import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import Model from '#config/database'
import customKFunction from '#keyboard/custom'
import inlineKFunction from '#keyboard/inline'
import { IOrders, IProducts } from '#types/database'

const scene = new Scene<BotContext>('Orders')

// initial increment, decrement or delete
scene.step(async (ctx) => {
    // Step 1: Fetch all active orders for the user
    const orders = await Model.Orders.find<IOrders>({
        userId: ctx.user.id,
        status: true,
    });

    // Step 2: Check if the user has any orders
    if (orders.length) {
        // Step 3: Fetch the product details for the products in the orders
        const productIds = orders.map(order => order.productId);
        const products = await Model.Products.find<IProducts>({ id: { $in: productIds } });

        // Step 4: Map orders and fetch product details
        const orderList = orders.map((order, index) => {
            // // Find the corresponding product for each order
            const product = products.find(p => p.id === order.productId);
            
            // // If the product is found, return the formatted order info
            return `${index + 1}. ${product?.name || 'Unknown Product'} - ${order.count}`;
        }).join('\n');

        // Step 5: Send the list of orders to the user
        await ctx.reply(`Here are your orders:\n${orderList}`);

        return; // Exit after showing the orders
    }

    // Step 6: If no orders are found, send the message at the end
    await ctx.reply("Productlar topilmadi");

    return ctx.scene.exit();
});













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