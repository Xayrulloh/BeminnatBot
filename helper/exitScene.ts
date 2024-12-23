import customKFunction from "#keyboard/custom"
import { BotContext } from "#types/context"
import { ADMIN_MAIN_KEYBOARD } from "#utils/constants"
import { SceneFlavoredContext } from "grammy-scenes"
import { messageDeleter } from "./messageDeleter"

export const exitScene = async (ctx: SceneFlavoredContext<BotContext, undefined>, message: string) => {

  await messageDeleter(ctx)

  ctx.scene.exit()

  if (ctx.user?.userId === 1151533771) {
    return await ctx.reply(message, {
        reply_markup: {
          keyboard: customKFunction(2, ...ADMIN_MAIN_KEYBOARD).build(),
          resize_keyboard: true,
        },
        parse_mode: 'HTML',
      })
  }

  await ctx.reply(message, { reply_markup: { remove_keyboard: true } })

}