import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import { BotContext } from '#types/context'
import { IUser } from '#types/database'
import { Keyboard } from 'grammy'
import { exitScene } from '#helper/exitScene'

const scene = new Scene<BotContext>('Start')

// phoneNumber
scene.step(async (ctx) => {
  const keyboard = new Keyboard().requestContact('📱 Telefon raqamni yuborish').resized().oneTime()

  const message = await ctx.reply('Assalomu alaykum.\n\nIltimos, telefon raqamingizni yuboring.', {
    reply_markup: keyboard,
  })

  ctx.session.messageIds = [message.message_id]
  ctx.session.chatId = ctx.chat?.id
})

// save to db
scene.wait('the_end').on('message:contact', async (ctx) => {
  const contact = ctx.message.contact

  ctx.session.messageIds.push(ctx.update.message?.message_id)

  const user = ctx.update.message?.from

  const createdUser = await Model.User.create<IUser>({
    userId: user.id,
    userName: user.username || 'unknown',
    name: user.first_name || 'name',
    phoneNumber: contact.phone_number,
  })

  ctx.user = createdUser

  return exitScene(ctx, 'Xush kelibsiz')
})

export default scene
