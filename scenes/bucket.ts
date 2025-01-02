import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import { IAddress, IOrder, IProduct, IWaybill } from '#types/database'
import { exitScene } from '#helper/exitScene'
import { env } from '#utils/env'
import customKFunction from '#keyboard/custom'
import { ADMIN_USER_ID } from '#utils/constants'
import { Keyboard } from 'grammy'
import { messageDeleter } from '#helper/messageDeleter'
import axios from 'axios'

const scene = new Scene<BotContext>('Bucket')

// initial
scene.step(async (ctx) => {
  ctx.session.chatId = ctx.chat?.id
  ctx.session.messageIds = []

  const orders = await Model.Order.find<IOrder>({
    userId: ctx.user.userId,
    status: false,
    isDelivered: false,
  })

  if (!orders.length) {
    return exitScene(ctx, "Savatchangiz bo'sh")
  }

  const productIds = orders.map((order) => order.productId)

  const products = await Model.Product.find<IProduct>({
    id: { $in: productIds },
  })

  const productObj: Record<number, IProduct> = {}

  products.forEach((product) => {
    productObj[product.id] = product
  })

  ctx.session.orderObj = {}
  ctx.session.amount = 0

  for (const order of orders) {
    ctx.session.orderObj[order.id] = order

    const buttons = inlineKFunction(1, [{ view: '🗑', text: `delete_${order.id}` }])

    const message = await ctx.replyWithPhoto(`${env.CLOUDFLARE_URL}${productObj[order.productId].image}`, {
      reply_markup: buttons,
      caption: `Nomi: ${productObj[order.productId].name}\nMa\'lumoti: ${
        productObj[order.productId].description
      }\nNarxi: ${productObj[order.productId].price}\n${
        productObj[order.productId].type == 'miqdor' ? `Soni: ${order.quantity}` : `Og'irligi: ${order.weight} kg`
      }`,
    })

    ctx.session.messageIds.push(message.message_id)
    ctx.session.productObj = productObj
    ctx.session.amount += productObj[order.productId].price * (order.quantity || order.weight)!
  }

  const message = await ctx.reply(`Umumiy narxi: ${ctx.session.amount} sum`, {
    reply_markup: {
      resize_keyboard: true,
      keyboard: customKFunction(2, `✅ Buyurtma berish`, '🚪Chiqish').build(),
    },
  })

  ctx.session.amountMessageId = message.message_id
  ctx.session.messageIds.push(message.message_id)

  ctx.scene.resume()
})

// action part 1
scene.wait('order').on(['callback_query:data', 'message:text'], async (ctx) => {
  const inlineData = ctx.update?.callback_query?.data

  const command = inlineData?.split('_')[0]
  const orderId = inlineData?.split('_')[1]

  const textData = ctx.message?.text

  // check text
  if (textData && !['✅ Buyurtma berish', '🚪Chiqish'].includes(textData)) {
    const message = await ctx.reply('Iltimos tugmalardan foydalaning')

    return ctx.session.messageIds.push(message.message_id)
  }

  // check inline
  if (command && command !== 'delete') {
    return await ctx.answerCallbackQuery({ text: 'Iltimos quyidagilardan birini tanlang', show_alert: true })
  }

  if (textData) {
    if (textData === '✅ Buyurtma berish') {
      const keyboard = new Keyboard().requestLocation("📍 Joylashuvni jo'natish").resized().oneTime()

      const message = await ctx.reply('Yetkazib berish manzilini kiriting', {
        reply_markup: keyboard,
      })

      ctx.session.messageIds.push(message.message_id)

      ctx.scene.resume()
    } else {
      return exitScene(ctx, "Asosiy menyuga o'tildi")
    }
  } else if (command && orderId) {
    if (command === 'delete') {
      await ctx.answerCallbackQuery("Mahsulot savatchadan o'chirildi")

      await Model.Order.deleteOne({ userId: ctx.user.userId, id: orderId })

      ctx.session.amount = 0

      for (let key in ctx.session.orderObj) {
        if (key !== orderId) {
          ctx.session.amount +=
            ctx.session.productObj[ctx.session.orderObj[key].productId].price *
            (ctx.session.orderObj[key].quantity || ctx.session.orderObj[key].weight)
        } else {
          delete ctx.session.orderObj[key]
        }
      }

      await ctx.api.deleteMessage(ctx.session.chatId, ctx.session.amountMessageId)

      const buttons = ctx.session.amount ? ['✅ Buyurtma berish', '🚪Chiqish'] : ['🚪Chiqish']

      const message = await ctx.reply(`Umumiy narxi: ${ctx.session.amount} sum`, {
        reply_markup: {
          resize_keyboard: true,
          keyboard: customKFunction(2, ...buttons).build(),
        },
      })

      ctx.session.messageIds.push(message.message_id)
      ctx.session.amountMessageId = message.message_id
    }
  }
})

// action part 2
scene.wait('location').on('message:location', async (ctx) => {
  await messageDeleter(ctx)

  const userLocation = ctx.message?.location

  if (!userLocation) {
    const keyboard = new Keyboard().requestLocation('📍 Yangi joylashuv').resized().oneTime()

    const message = await ctx.reply('Yetkazib berish manzilini kiriting', {
      reply_markup: keyboard,
    })

    ctx.session.messageIds.push(message.message_id)
  }

  const adminLocation = await Model.Address.findOne<IAddress>({ userId: ADMIN_USER_ID })

  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${adminLocation!.longitude},${
    adminLocation!.latitude
  };${userLocation.longitude},${userLocation.latitude}`

  const response = await axios.get(url, {
    params: {
      access_token: process.env.MAPBOX_ACCESS_TOKEN,
      geometries: 'geojson',
      overview: 'simplified',
      alternatives: true,
    },
  })

  const data: {
    routes: Array<{
      weight_name: string
      weight: number
      duration: number
      distance: number
    }>
    waypoints: Array<{
      distance: number
      name: string
      location: [number, number]
    }>
    code: 'Ok'
    uuid: string
  } = response.data

  const bestRoute = data.routes.reduce((prev, curr) => {
    return curr.distance < prev.distance ? curr : prev
  })

  const distance = bestRoute.distance / 1000

  ctx.session.waybill = 10000
  ctx.session.userLocation = userLocation

  const waybill = await Model.Waybill.findOne<IWaybill>()

  if (distance > 2) {
    ctx.session.waybill = Math.round((10000 + (distance - 2) * waybill!.price) / 100) * 100
  }

  const message = await ctx.reply(
    `Buyurtma narxi: ${ctx.session.amount} sum\nYetkazib berish narxi: ${ctx.session.waybill}`,
    {
      reply_markup: {
        resize_keyboard: true,
        keyboard: customKFunction(2, `✅ Tasdiqlayman`, '🚪Chiqish').build(),
      },
    },
  )

  ctx.session.messageIds.push(message.message_id)

  ctx.scene.resume()
})

// final
scene.wait('notify').on('message:text', async (ctx) => {
  const textData = ctx.message?.text

  if (!['✅ Tasdiqlayman', '🚪Chiqish'].includes(textData)) {
    const message = await ctx.reply('Iltimos tugmalardan foydalaning', {
      reply_markup: {
        resize_keyboard: true,
        keyboard: customKFunction(2, `✅ Tasdiqlayman`, '🚪Chiqish').build(),
      },
    })

    return ctx.session.messageIds.push(message.message_id)
  }

  if (textData === '🚪Chiqish') {
    return exitScene(ctx, "Asosiy menyuga o'tildi")
  } else if (textData === '✅ Tasdiqlayman') {
    await ctx.api.sendMessage(
      ADMIN_USER_ID,
      `Yangi buyurtma berildi\n\nXaridor ismi: ${ctx.user.name}\nXaridor telefon raqami: ${ctx.user.phoneNumber}`,
    )

    await Model.Order.updateMany(
      { userId: ctx.user.userId, status: false },
      {
        status: true,
        isDelivered: false,
        latitude: ctx.session.userLocation!.latitude,
        longitude: ctx.session.userLocation!.longitude,
        productOverallPrice: ctx.session.amount,
        overallWaybill: ctx.session.waybill,
      },
    )

    return exitScene(ctx, 'Xaridingiz uchun raxmat.\nTez orada xaydovchi sizga aloqaga chiqadi')
  }
})

export default scene
