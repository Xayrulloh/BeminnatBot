import { Bot, MemorySessionStorage, session } from 'grammy'
import { scenes } from './scenes'
import { authMiddleware } from '#middlewares/auth'
import { BotContext } from '#types/context'
import { env } from '#utils/env'
import { Color } from '#utils/enums'
import { errorHandler } from '#helper/errorHandler'
import { autoRetry } from '@grammyjs/auto-retry'
import { keyboardMapper } from '#helper/keyboardMapper'
import customKFunction from '#keyboard/custom'
import { UserKeyboard } from '#helper/putUserKeyboard'
import { ADMIN_USER_ID } from '#utils/constants'

const bot = new Bot<BotContext>(env.TOKEN)

// plugins
bot.api.config.use(
  autoRetry({
    maxDelaySeconds: 1,
    maxRetryAttempts: 3,
  }),
)

// middleware
bot.use(
  session({
    initial: () => ({}),
    storage: new MemorySessionStorage(env.SESSION_TTL),
  }),
)

bot.use(scenes.manager())
bot.use(authMiddleware)
bot.use(scenes)

// Commands
bot.command('start', async (ctx) => {
  if (ctx.user.userId === ADMIN_USER_ID) {
    ctx.reply('Xush kelibsiz!', {
      reply_markup: {
        keyboard: customKFunction(2, ...UserKeyboard(ctx.user.userId)).build(),
        resize_keyboard: true,
      },
    })
  } else {
    ctx.reply('Xush kelibsiz!', {
      reply_markup: {
        keyboard: customKFunction(2, ...UserKeyboard(ctx.user.userId)).build(),
        resize_keyboard: true,
      },
    })
  }
})

bot.command('address', async (ctx) => {
  ctx.scenes.enter('Address')
})

bot.command('bucket', async (ctx) => {
  ctx.scenes.enter('Bucket')
})

bot.command('admin_category', async (ctx) => {
  await ctx.scenes.enter('AdminCategory')
})

bot.command('admin_product', async (ctx) => {
  await ctx.scenes.enter('AdminProduct')
})

bot.on('message:text', async (ctx) => {
  const mappedScene = keyboardMapper(ctx.message.text)

  if (mappedScene) {
    return ctx.scenes.enter(mappedScene)
  }
})

// error handling
bot.catch(errorHandler)

// webhook
bot
  .start({
    onStart: () => {
      console.info('Bot successfully started')
    },
  })
  .catch((e) => {
    console.error(Color.Red, 'Something went wrong!', e)
    process.exit()
  })
