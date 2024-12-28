import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import Model from '#config/database'
import customKFunction from '#keyboard/custom'
import inlineKFunction from '#keyboard/inline'
import { IOrder, IProduct } from '#types/database'

const scene = new Scene<BotContext>('Bucket')

// initial increment, decrement or delete
scene.step(async (ctx) => {
  const orders = await Model.Orders.find<IOrder>({
    userId: ctx.user.id,
    status: false,
  })

  if (!orders.length) {
    await ctx.reply('Productlar topilmadi')

    return ctx.scene.exit()
  }

  const productIds = orders.map((order) => order.productId)

  const products = await Model.Products.find<IProduct>({
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
  await ctx.reply('Iltimos, mahsulot tugmalaridan birini tanlang.');
  
})



// Wait for user actions
scene.wait('handleactions').on('callback_query', async (ctx) => {
  if (!ctx.callbackQuery || !ctx.callbackQuery.data) {
    await ctx.reply('Tugmani tanlang yoki /exit buyrug‘ini bering.');
    return;
  }

  const [action, productId] = ctx.callbackQuery.data.split(':');

  switch (action) {
    case 'increment':
      await handleIncrement(ctx , +productId);
      break;
    case 'decrement':
      await handleDecrement(ctx, +productId);
      break;
    case 'delete':
      await handleDelete(ctx, +productId);
      break;
    default:
      await ctx.reply('Noma’lum amal');
  }

  // Stay in the same step to allow further actions
  return ctx.scene.resume();
});

// Increment function
async function handleIncrement(ctx:any, productId:number) {
  const order = await Model.Orders.findOne<IOrder>({
    userId: ctx.user.id,
    productId,
    status: false,
  });

  if (order) {
    order.count += 1;
    await order.save();
    await ctx.reply('Mahsulot miqdori oshirildi.');
  } else {
    await ctx.reply('Buyurtma topilmadi.');
  }
}

// Decrement function
async function handleDecrement(ctx:any, productId:number) {
  const order = await Model.Orders.findOne<IOrder>({
    userId: ctx.user.id,
    productId,
    status: false,
  });

  if (order) {
    if (order.count > 1) {
      order.count -= 1;
      await order.save();
      await ctx.reply('Mahsulot miqdori kamaytirildi.');
    } else {
      await ctx.reply('Mahsulot miqdori minimum darajada.');
    }
  } else {
    await ctx.reply('Buyurtma topilmadi.');
  }
}

// Delete function
async function handleDelete(ctx:any, productId:number) {
  const result = await Model.Orders.deleteOne({
    userId: ctx.user.id,
    productId,
    status: false,
  });

  if (result.deletedCount > 0) {
    await ctx.reply('Mahsulot o‘chirildi.');
  } else {
    await ctx.reply('Buyurtma topilmadi.');
  }
}

export default scene;