import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import Model from '#config/database'
import { Keyboard } from 'grammy'
import { IAddress } from '#types/database'
import { exitScene } from '#helper/exitScene'
import { ADMIN_USER_ID } from '#utils/constants'

const scene = new Scene<BotContext>('AdminAddress')

scene.step(async (ctx) => {
  if (ctx.user.userId != ADMIN_USER_ID) {
    return ctx.scene.exit()
  }

  // Request location from the user
  const keyboard = new Keyboard().requestLocation("📍 Joylashuvni jo'natish").resized().oneTime()

  const message = await ctx.reply("Do'kon joylashuvini jo'nating", {
    reply_markup: keyboard,
  })

  // Store the message ID for cleanup later
  ctx.session.messageIds = [message.message_id]
})

// Step 2: Wait for the user's location
scene.wait('create').on('message:location', async (ctx) => {
  const location = ctx.message.location

  await Model.Address.deleteMany({
    userId: ADMIN_USER_ID,
  })

  // Save the location to the database
  await Model.Address.create<IAddress>({
    latitude: location.latitude,
    longitude: location.longitude,
    userId: ADMIN_USER_ID,
    name: "Do'kon",
  })
  // Exit the scene with a success message
  return exitScene(ctx, "Yangi joylashuv muvaffaqiyatli qo'shildi")
})

export default scene
