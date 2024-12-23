import { BotContext } from '#types/context'
import { SceneFlavoredContext } from 'grammy-scenes'

export const messageDeleter = async (ctx: SceneFlavoredContext<BotContext, undefined>) => {
  for (const messageId of ctx.session.messageIds) {
    try {
      await ctx.api.deleteMessage(ctx.session.chatId, messageId)
    } catch (error) {
      console.log('🚀 ~ error:', error)
    }
  }
}
