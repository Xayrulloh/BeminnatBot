import customKFunction from '#keyboard/custom'
import { BotContext } from '#types/context'
import { SceneFlavoredContext } from 'grammy-scenes'
import { messageDeleter } from './messageDeleter'
import { UserKeyboard } from './putUserKeyboard'

export const exitScene = async (ctx: SceneFlavoredContext<BotContext, undefined>, message: string) => {
  await messageDeleter(ctx)

  ctx.scene.exit()

  return ctx.reply(message, {
    reply_markup: {
      keyboard: customKFunction(2, ...UserKeyboard(ctx.user.userId)).build(),
      resize_keyboard: true,
    },
  })
}
