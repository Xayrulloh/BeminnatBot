import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import { exitScene } from '#helper/exitScene'
import { ADMIN_USER_ID } from '#utils/constants'
import Model from '#config/database'

const scene = new Scene<BotContext>('AdminWaybill')

// initial
scene.step(async (ctx) => {
  ctx.session.chatId = ctx.chat?.id
  ctx.session.messageIds = []

  if (ctx.user.userId !== ADMIN_USER_ID) {
    return ctx.scene.exit()
  }

  const message = await ctx.reply('Narxni kiriting:', {
    reply_markup: {
      remove_keyboard: true,
    },
  })

  ctx.session.messageIds.push(message.message_id)
})

// action
scene.wait('waybill').on('message:text', async (ctx) => {
  const textData = ctx.message.text

  const price = parseFloat(textData)

  if (isNaN(price) || price <= 0) {
    const message = await ctx.reply("Iltimos, to'g'ri narxni kiriting.")

    ctx.session.messageIds.push(message.message_id)

    return
  }

  await Model.Waybill.deleteMany()

  await Model.Waybill.create({ price })

  return exitScene(ctx, `O'zgartirilgan narx: ${price} so'm`)
})

export default scene
