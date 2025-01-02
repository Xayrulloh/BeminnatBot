import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import Model from '#config/database'
import { Keyboard } from 'grammy'
import { IAddress } from '#types/database'
import { exitScene } from '#helper/exitScene'
import { ADMIN_USER_ID } from '#utils/constants'

const scene = new Scene<BotContext>('AdminAddress')

// initial
scene.step(async (ctx) => {
  if (ctx.user.userId != ADMIN_USER_ID) {
    return ctx.scene.exit()
  }

  const keyboard = new Keyboard().requestLocation("📍 Joylashuvni jo'natish").resized().oneTime()

  const message = await ctx.reply("Do'kon joylashuvini jo'nating", {
    reply_markup: keyboard,
  })

  ctx.session.messageIds = [message.message_id]
  ctx.session.chatId = ctx.chat?.id
})

// action
scene.wait('location').on('message:location', async (ctx) => {
  const location = ctx.message.location

  await Model.Address.deleteMany({
    userId: ADMIN_USER_ID,
  })

  await Model.Address.create<IAddress>({
    latitude: location.latitude,
    longitude: location.longitude,
    userId: ADMIN_USER_ID,
    name: "Do'kon",
  })

  return exitScene(ctx, "Yangi joylashuv muvaffaqiyatli qo'shildi")
})

export default scene
