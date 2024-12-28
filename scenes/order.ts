import { Scene } from 'grammy-scenes';
import { BotContext } from '#types/context';
import Model from '#config/database';
import { IOrder, IProduct } from '#types/database';
import { PER_PAGE } from '#utils/constants';
import { exitScene } from '#helper/exitScene';
import inlineKFunction from '#keyboard/inline';
import { env } from 'process';

const scene = new Scene<BotContext>('Order');

scene.step(async (ctx) => {
    ctx.session.currPage = 1;

    const orders = await Model.Order.find<IOrder>({
        userId: ctx.user.userId,status: true,}).sort({ id: -1 }).skip((ctx.session.currPage - 1) * PER_PAGE).limit(PER_PAGE);

    if (orders.length) {
        const productIds = orders.map(order => order.productId);
        const products = await Model.Product.find<IProduct>({ id: { $in: productIds } });
        const productObj: {[key: number]: IProduct} = {}

        products.forEach((product) => {
            productObj[product.id] = product
        })

        for (const order of orders) {    
            const message = await ctx.replyWithPhoto(`${env.CLOUDFLARE_URL}${productObj[order.productId].image}`, {
                caption: `Nomi: ${productObj[order.productId].name}\nMa\'lumoti: ${productObj[order.productId].description}\nNarxi: ${productObj[order.productId].price * order.count}\nSoni: ${order.count}`,
            })
        
            ctx.session.messageIds.push(message.message_id)
        }
    
    //     const properties = [
    //     { view: "➕ Yangi maxsulot qo'shish", text: 'create' },
    //     { view: '◀️ Chiqish', text: 'exit' },
    //     ]
    // //  console.log(properties)
    //     if (products.length === PER_PAGE) {
    //     properties.push({ view: '➡️ Keyingisi', text: 'next' })
    //     }
    
    //     const message = await ctx.reply("Yangi mahsulot qo'shishni xohlaysizmi?", {
    //     reply_markup: {
    //         ...inlineKFunction(2, properties),
    //     },
    //     })
    
    //     ctx.session.messageIds.push(message.message_id)
    
        ctx.scene.resume()
    } else {
        exitScene(ctx, "Sizda hechqanday buyurtma mavjud emas")
    }
});

// Middleware for pagination
// scene.wait(async (ctx, next) => {
//     const callbackData = ctx.update?.callback_query?.data;

//     if (callbackData === 'next_page') {
//         ctx.session.currPage = (ctx.session.currPage || 1) + 1; // Increment page
//         await ctx.answerCallbackQuery(); // Acknowledge callback
//         return await ctx.scenes.enter('Orders'); // Restart scene
//     } else if (callbackData === 'prev_page') {
//         ctx.session.currPage = Math.max((ctx.session.currPage || 1) - 1, 1); // Decrement page
//         await ctx.answerCallbackQuery(); // Acknowledge callback
//         return await ctx.scenes.enter('Orders'); // Restart scene
//     }

//     await next(); // Proceed to the next handler
// });

export default scene;
