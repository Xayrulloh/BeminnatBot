import { Bot, MemorySessionStorage, session } from 'grammy'
import { scenes } from './scenes'
// import customKFunction from './keyboard/custom'
import { authMiddleware } from '#middlewares/auth'
// import { keyboardMapper } from '#helper/keyboardMapper'
import { BotContext } from '#types/context'
import { env } from '#utils/env'
import { Color } from '#utils/enums'
import { errorHandler } from '#helper/errorHandler'
import { autoRetry } from '@grammyjs/auto-retry'
// import Model from '#config/database'
// import { WebhookClient, EmbedBuilder } from 'discord.js'

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
// bot.command('notification', async (ctx) => {
//   await ctx.scenes.enter('Notification')
// })

// bot.command('fasting', async (ctx) => {
//   await ctx.scenes.enter('Fasting')
// })

// bot.command('location', async (ctx) => {
//   await ctx.scenes.enter('Location')
// })

// bot.command('search', async (ctx) => {
//   await ctx.scenes.enter('Search')
// })

// bot.command('statistic', async (ctx) => {
//   await ctx.scenes.enter('Statistic')
// })

// bot.command('announcement', async (ctx) => {
//   await ctx.scenes.enter('Announcement')
// })

// bot.command('hadith', async (ctx) => {
//   await ctx.scenes.enter('Hadith')
// })

// bot.command('addHadith', async (ctx) => {
//   await ctx.scenes.enter('AddHadith')
// })

// bot.command('quran', async (ctx) => {
//   await ctx.scenes.enter('Quran')
// })

bot.command('start', async (ctx) => {
  ctx.scenes.enter('Start')
})

// bot.command('source', async (ctx) => {
//   await ctx.scenes.enter('Source')
// })

// bot.command('feedback', async (ctx) => {
//   await ctx.scenes.enter('Feedback')
// })

bot.on('message:text', async (ctx) => {
  // console.log('🚀 ~ ctx:', ctx)
  // const mappedScene = keyboardMapper(ctx.message.text)

  // if (mappedScene) {
  //   return ctx.scenes.enter(mappedScene)
  // }
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

