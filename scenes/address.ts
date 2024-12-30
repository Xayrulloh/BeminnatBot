import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import Model from '#config/database'
import { Keyboard } from 'grammy'
import customKFunction from '#keyboard/custom'
import inlineKFunction from '#keyboard/inline'
import { IAddress } from '#types/database'
import { UserKeyboard } from '#helper/putUserKeyboard'
import { exitScene } from '#helper/exitScene'

const scene = new Scene<BotContext>('Address')

// Initial
scene.step(async (ctx) => {
  const buttons = inlineKFunction(2, [
    { view: "📍 Joyshuvlar ro'yxati", text: 'get address' },
    { view: "➕ Joylashuv qo'shish", text: 'add address' },
    { view: "🗑 Joylashuv o'chirish", text: 'delete address' },
    { view: '🚪 Chiqish', text: 'exit' },
  ])

  const message = await ctx.reply('Quyidagilardan birini tanlang', { reply_markup: buttons })

  ctx.session.messageIds = [message.message_id]
  ctx.session.chatId = ctx.chat?.id
})

// Create, Get, Delete and Exit
scene.wait('crud').on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery()

  const inputData = ctx.update.callback_query.data

  ctx.session.messageIds.push(ctx.update.callback_query?.message?.message_id)

  if (!['get address', 'add address', 'delete address', 'exit'].includes(inputData)) {
    await ctx.answerCallbackQuery('Iltimos quyidagilardan birini tanlang')
  }

  ctx.session.command = inputData

  const addresses = await Model.Address.find<IAddress>({
    userId: ctx.user.userId,
  })

  if (inputData === 'exit') {
    return exitScene(ctx, "Asosiy menuga o'tildi")
  }
  // checking
  if (!addresses.length && ['get address', 'delete address'].includes(inputData)) {
    return exitScene(ctx, 'Sizda hali xech qanday joylashuv mavjud emas')
  }

  // create
  if (inputData === 'add address') {
    if (addresses.length > 3) {
      return exitScene(
        ctx,
        "Siz maksimal joylashuv miqdoriga yetdingiz\n\nJoyshlashuv kiritish uchun boshqa joylashuvingizni o'chirishingizni so'raymiz",
      )
    } else {
      ctx.session.locationNames = addresses.map((address) => address.name)

      const message = await ctx.reply('Joylashuv nomini kiriting')

      ctx.session.messageIds.push(message.message_id)
    }
  } else if (inputData === 'get address') {
    // get
    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i]

      await ctx.reply(`${i + 1}) ${address.name}`, {
        reply_markup: {
          keyboard: customKFunction(2, ...UserKeyboard(ctx.user.userId)).build(),
          resize_keyboard: true,
        },
        parse_mode: 'HTML',
      })

      await ctx.replyWithLocation(address.latitude, address.longitude)
    }

    return ctx.scene.exit()
  } else {
    // delete
    const buttons = inlineKFunction(
      2,
      addresses.map((address) => {
        return { text: address.name, view: address.name }
      }),
    )

    ctx.session.deleteButtons = buttons

    const message = await ctx.reply("Qaysi birini o'chirishni xohlaysiz?", { reply_markup: buttons })

    ctx.session.messageIds.push(message.message_id)
  }

  ctx.scene.resume()
})

scene.wait('create_delete').on(['callback_query:data', 'message:text'], async (ctx) => {
  const inlineData = ctx.update?.callback_query?.data
  const textData = ctx.message?.text

  ctx.message?.message_id && ctx.session.messageIds.push(ctx.message?.message_id)
  ctx.update.callback_query?.message?.message_id &&
    ctx.session.messageIds.push(ctx.update.callback_query?.message?.message_id)

  // checking
  if (
    (ctx.session.command === 'add address' && !textData && inlineData) ||
    (ctx.session.command === 'add address' && textData && ctx.session.locationNames.includes(textData))
  ) {
    const message = await ctx.reply('Joylashuv nomini kiriting')

    ctx.session.messageIds.push(message.message_id)

    return
  } else if (ctx.session.command === 'delete address' && textData && !inlineData) {
    await ctx.answerCallbackQuery()

    const message = await ctx.reply("Qaysi birini o'chirishni xohlaysiz?", { reply_markup: ctx.session.deleteButtons })

    ctx.session.messageIds.push(message.message_id)

    return
  }

  // delete
  if (ctx.session.command === 'delete address') {
    await ctx.answerCallbackQuery()

    await Model.Address.deleteOne({
      userId: ctx.user.userId,
      name: inlineData,
    })

    return exitScene(ctx, "Joylashuv muvaffaqiyatli o'chirildi")
  } else {
    ctx.session.newLocationName = textData

    const keyboard = new Keyboard().requestLocation('📍 Yangi joylashuv').resized().oneTime()

    const message = await ctx.reply("Joylashuvingizni jo'nating", {
      reply_markup: keyboard,
    })

    ctx.session.messageIds.push(message.message_id)
  }

  ctx.scene.resume()
})

scene.wait('create').on('message:location', async (ctx) => {
  const location = ctx.message.location

  ctx.session.messageIds.push(ctx.message.message_id)

  await Model.Address.create<IAddress>({
    latitude: location.latitude,
    longitude: location.longitude,
    userId: ctx.user.userId,
    name: ctx.session.newLocationName,
  })

  return exitScene(ctx, "Yangi joylashuv muvaffaqiyatli qo'shildi")
})

export default scene
