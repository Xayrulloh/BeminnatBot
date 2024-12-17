import { Bot, MemorySessionStorage, session, webhookCallback } from 'grammy'
// import { scenes } from './scenes'
// import customKFunction from './keyboard/custom'
import Fastify from 'fastify'
// import { authMiddleware } from '#middlewares/auth'
// import { keyboardMapper } from '#helper/keyboardMapper'
import { BotContext } from '#types/context'
import { env } from '#utils/env'
import { Color } from '#utils/enums'
import { errorHandler } from '#helper/errorHandler'
import { autoRetry } from '@grammyjs/auto-retry'
// import Model from '#config/database'
// import { WebhookClient, EmbedBuilder } from 'discord.js'
import { format } from 'node:util'
// import { FLOOD_MESSAGE } from '#utils/constants'

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

// bot.use(scenes.manager())
// bot.use(authMiddleware)
// bot.use(scenes)

// Commands
bot.command('notification', async (ctx) => {
  await ctx.scenes.enter('Notification')
})

bot.command('fasting', async (ctx) => {
  await ctx.scenes.enter('Fasting')
})

bot.command('location', async (ctx) => {
  await ctx.scenes.enter('Location')
})

bot.command('search', async (ctx) => {
  await ctx.scenes.enter('Search')
})

bot.command('statistic', async (ctx) => {
  await ctx.scenes.enter('Statistic')
})

bot.command('announcement', async (ctx) => {
  await ctx.scenes.enter('Announcement')
})

bot.command('hadith', async (ctx) => {
  await ctx.scenes.enter('Hadith')
})

bot.command('addHadith', async (ctx) => {
  await ctx.scenes.enter('AddHadith')
})

bot.command('quran', async (ctx) => {
  await ctx.scenes.enter('Quran')
})

bot.command('start', async (ctx) => {
  const welcomeText = 'Xush kelibsiz'
  const keyboardText = [
    "🔍 Qidirish",
    "🌍 Joylashuvni o'zgartirish",
    "🍽 Ro'za",
    "🔔 Xabarnomani o'zgartirish",
    "📊 Statistika",
    "📚 Manba",
    "📜 Hadis",
    "📖 Qur'on va Tafsiri",
    "📢 Taklif yoki Shikoyat"
  ]
  // const buttons = customKFunction(2, ...keyboardText)

  // if (!ctx.user.status) {
  //   await Model.User.updateOne({ userId: ctx.user.userId }, { status: true }, {})
  // }

  // await ctx.reply(welcomeText, {
  //   reply_markup: {
  //     keyboard: buttons.build(),
  //     resize_keyboard: true,
  //   },
  // })
})

bot.command('source', async (ctx) => {
  await ctx.scenes.enter('Source')
})

bot.command('feedback', async (ctx) => {
  await ctx.scenes.enter('Feedback')
})

// bot.on('message:text', async (ctx) => {
//   const mappedScene = keyboardMapper(ctx.message.text)

//   if (mappedScene) {
//     return ctx.scenes.enter(mappedScene)
//   } else {
//     const discordClient = new WebhookClient({
//       url: env.DISCORD_WEBHOOK_URL,
//     })

//     let embed = new EmbedBuilder()
//       .setColor('Blue')
//       .setTitle(`**ID:** ${ctx.from.id}`)
//       .setDescription(
//         format(
//           FLOOD_MESSAGE,
//           env.NODE_ENV,
//           ctx.from.username,
//           ctx.from.first_name,
//           ctx.from.last_name,
//           ctx.message.text,
//         ),
//       )
//       .setTimestamp(new Date())

//     await discordClient.send({
//       threadId: env.DISCORD_FLOOD_THREAD_ID,
//       embeds: [embed],
//     })
//   }
// })

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

// commented works

// bot.command('donate', async (ctx) => {
//   await ctx.scenes.enter('Donate')
// })
