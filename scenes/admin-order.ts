import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import Model from '#config/database'
import { IOrder, IProduct, IUser } from '#types/database'
import { exitScene } from '#helper/exitScene'
import { ADMIN_USER_ID, PER_PAGE } from '#utils/constants'
import inlineKFunction from '#keyboard/inline'
import customKFunction from '#keyboard/custom'
import { messageDeleter } from '#helper/messageDeleter'

const scene = new Scene<BotContext>('AdminOrder')

// initial
scene.step(async (ctx) => {
  ctx.session.messageIds = []

  if (ctx.user.userId != ADMIN_USER_ID) {
    return ctx.scene.exit()
  }

  const orders = await Model.Order.find<IOrder>({ status: true, isDelivered: false })

  const userIds = orders.map((order) => order.userId)

  const uniqueUserIds = [...new Set(userIds)]

  if (!uniqueUserIds.length) {
    return exitScene(ctx, "Buyurtmalar ro'yxati bo'sh\n\n Asosiy menuga o'tildi")
  }

  const users = await Model.User.find<IUser>({ userId: { $in: uniqueUserIds } })

  ctx.session.currPage = 1

  ctx.session.inlineKeyboard = users.map((user) => {
    return { view: `${user.name}: ${user.phoneNumber}`, text: user.userId.toString() }
  })

  const buttons = inlineKFunction(2, ctx.session.inlineKeyboard)

  const message = await ctx.reply("Buyurtma qilgan foydalanuvchilar ro'yxati", { reply_markup: buttons })

  ctx.session.messageIds.push(message.message_id)

  ctx.scene.resume()
})

// actions
scene.wait('user').on('callback_query:data', async (ctx) => {
  const inputData = ctx.update?.callback_query?.data

  if (inputData) {
    if (inputData == '<') {
      if (ctx.session.currPage != 1) {
        await ctx.editMessageText("Buyurtma qilgan foydalanuvchilar ro'yxati", {
          reply_markup: inlineKFunction(3, ctx.session.inlineKeyboard, --ctx.session.currPage),
          parse_mode: 'HTML',
        })
      } else {
        await ctx.answerCallbackQuery('Quyidagilardan birini bosing')
      }

      return
    } else if (inputData == '>') {
      if (ctx.session.currPage * PER_PAGE <= ctx.session.inlineKeyboard.length) {
        await ctx.editMessageText("Buyurtma qilgan foydalanuvchilar ro'yxati", {
          reply_markup: inlineKFunction(3, ctx.session.inlineKeyboard, ++ctx.session.currPage),
          parse_mode: 'HTML',
        })
      } else {
        await ctx.answerCallbackQuery('Quyidagilardan birini bosing')
      }

      return
    } else if (inputData == 'pageNumber') {
      await ctx.answerCallbackQuery('Quyidagilardan birini bosing')

      return
    }

    await ctx.answerCallbackQuery()
  }

  await messageDeleter(ctx)

  const userId = ctx.callbackQuery.data

  const user = await Model.User.findOne<IUser>({ userId })

  ctx.session.user = user

  const userInfoMessage = await ctx.reply(
    `Foydalanuvchi ismi: ${user!.name}\nTelefon raqami: ${user!.phoneNumber}\n${
      user!.userName ? `Username: https://t.me/${user!.userName}` : ''
    }`,
    {
      reply_markup: {
        remove_keyboard: true,
      },
    },
  )

  ctx.session.messageIds.push(userInfoMessage.message_id)

  const orders = await Model.Order.find<IOrder>({ userId, status: true, isDelivered: false })

  const productIds = orders.map((order) => order.productId)
  const products = await Model.Product.find<IProduct>({ id: { $in: productIds } })

  const productObj: Record<number, IProduct> = {}

  products.forEach((product) => {
    productObj[product.id] = product
  })

  for (const order of orders) {
    const message = await ctx.replyWithPhoto(
      `https://pub-077f05899f294e24b391111fce1ebf0b.r2.dev/${productObj[order.productId].image}`,
      {
        caption: `Maxsulot nomi: ${productObj[order.productId].name}\nMaxsulot ma'lumoti: ${
          productObj[order.productId].description
        }\nMaxsulot narxi: ${productObj[order.productId].price * (order.quantity || order.weight)!}\nMaxsulot turi: ${
          productObj[order.productId].type
        }\n${
          productObj[order.productId].type === 'miqdor'
            ? `Maxsulot miqdori: ${order.quantity} ta`
            : `Maxsulot og'irligi: ${order.weight} kg`
        }`,
      },
    )

    ctx.session.messageIds.push(message.message_id)
  }

  const orderMessage = await ctx.reply(
    `Umumiy maxsulot narxi: ${orders[0].productOverallPrice} sum\nOlib borib berish narxi: ${
      orders[0].overallWaybill
    } sum\nUmumiy narx: ${orders[0].productOverallPrice + orders[0].overallWaybill}sum\n\nYetkazib berish manzili:`,
  )

  ctx.session.messageIds.push(orderMessage.message_id)

  const deliverMessage = await ctx.replyWithLocation(orders[0].latitude, orders[0].longitude, {
    reply_markup: {
      resize_keyboard: true,
      keyboard: customKFunction(2, '✅ Yetkazib berish', '🚪Chiqish').build(),
    },
  })

  ctx.session.messageIds.push(deliverMessage.message_id)

  ctx.scene.resume()
})

// final
scene.wait('deliver').on('message:text', async (ctx) => {
  const textData = ctx.message?.text

  if (!['✅ Yetkazib berish', '🚪Chiqish'].includes(textData)) {
    const message = await ctx.reply('Iltimos tugmalardan foydalaning', {
      reply_markup: {
        resize_keyboard: true,
        keyboard: customKFunction(2, '✅ Yetkazib berish', '🚪Chiqish').build(),
      },
    })

    return ctx.session.messageIds.push(message.message_id)
  }

  await messageDeleter(ctx)

  if (textData === '🚪Chiqish') {
    return exitScene(ctx, "Asosiy menuga o'tildi")
  }

  await ctx.api.sendMessage(
    ctx.session.user!.userId,
    'Xaydovchi yolga chiqdi.\nMaxsulot tez orada yetib keladi.\nXaridingiz uchun rahmat',
  )

  const message = await ctx.reply("Xaridor ogohlantirib qo'yildi.\nOq yo'l")

  ctx.session.messageIds.push(message.message_id)

  await Model.Order.updateMany({ userId: ctx.session.user!.userId }, { isDelivered: true })

  return exitScene(ctx, "Asosiy menuga o'tildi")
})

export default scene
