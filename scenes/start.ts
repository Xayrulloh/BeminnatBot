import { Scene } from 'grammy-scenes'
import Model from '#config/database'
import customKFunction from '#keyboard/custom'
import { BotContext } from '#types/context'
import { IUser } from '#types/database'
import { Keyboard } from 'grammy'
import { MAIN_KEYBOARD } from '#utils/constants'

const scene = new Scene<BotContext>('Start')

// phoneNumber
scene.step(async (ctx) => {
  const keyboard = new Keyboard().requestContact('📱 Telefon raqamni yuborish').resized().oneTime()

  await ctx.reply('Assalomu alaykum.\n\nIltimos, telefon raqamingizni yuboring.', {
    reply_markup: keyboard,
  })
})

// save to db
scene.wait('the_end').on('message:contact', async (ctx) => {
  const contact = ctx.message.contact
  const user = ctx.update.message?.from

  await Model.User.create<IUser>({
    userId: user.id,
    userName: user.username || 'unknown',
    name: user.first_name || 'name',
    phoneNumber: contact.phone_number,
  })

  await ctx.reply('Xush kelibsiz', {
    reply_markup: {
      keyboard: customKFunction(2, ...MAIN_KEYBOARD).build(),
      resize_keyboard: true,
    },
    parse_mode: 'HTML',
  })

  ctx.scene.exit()
})

export default scene
