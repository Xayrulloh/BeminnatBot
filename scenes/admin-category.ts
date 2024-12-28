import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import { ICategory } from '#types/database'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import { messageDeleter } from '#helper/messageDeleter'
import { exitScene } from '#helper/exitScene'
import { ADMIN_USER_ID } from '#utils/constants'

const scene = new Scene<BotContext>('AdminCategory')

// show and decide rather to delete, update or create
scene.step(async (ctx) => {
  if (ctx.user.userId != ADMIN_USER_ID) {
    return ctx.scene.exit()
  }

  ctx.session.messageIds = [ctx.update.message?.message_id]
  ctx.session.chatId = ctx.chat?.id

  const categories = await Model.Category.find<ICategory>()

  ctx.session.categories = categories

  for (const category of categories) {
    const buttons = inlineKFunction(2, [
      {
        view: "🗑 O'chirish",
        text: `delete_${category.id}`,
      },
      {
        view: '✏️ Yangilash',
        text: `update_${category.id}`,
      },
      {
        view:'🚪 Chiqish',
        text:`exit_${category.id}`
      }
    ])

    const message = await ctx.reply(`${category.name}`, { reply_markup: { ...buttons, remove_keyboard: true } })

    ctx.session.messageIds.push(message.message_id)
  }

  const createButton = inlineKFunction(1, [{ view: '➕ Yangi yasash', text: 'create' }])

  const message = await ctx.reply("Yangi kategoriyani qo'shish", {
    reply_markup: { ...createButton, remove_keyboard: true },
  })

  ctx.session.messageIds.push(message.message_id)
})

// delete, update or create
scene.wait('delete_add_update').on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery()

  const inputData = ctx.update.callback_query.data

  ctx.session.command = inputData.split('_')[0]
  ctx.session.categoryId = inputData.split('_')[1]

  if (!['delete', 'update', 'create','exit'].includes(ctx.session.command)) {
    await ctx.answerCallbackQuery('Iltimos quyidagilardan birini tanlang')
  }

  // create
  if (ctx.session.command === 'create') {
    await messageDeleter(ctx)

    const message = await ctx.reply('Kategoriya nomini kiriting', {
      reply_markup: {
        remove_keyboard: true,
      },
    })

    ctx.session.messageIds = [message.message_id]
  } else if (ctx.session.command === 'update') {
    await messageDeleter(ctx)

    const message = await ctx.reply('Kategoriya nomini kiriting', {
      reply_markup: {
        remove_keyboard: true,
      },
    })

    ctx.session.messageIds = [message.message_id]
  } else if (ctx.session.command === 'delete') {
    await Model.Category.deleteOne({ id: ctx.session.categoryId })

    return exitScene(ctx, "Kategoriya o'chirildi")
  }else if(ctx.session.command==='exit'){
    return exitScene(ctx, "Asosiy menuga o'tildi")

  }

  ctx.scene.resume()
})

// create or update
scene.wait('category_name').on('message:text', async (ctx) => {
  const textData = ctx.message?.text

  if (ctx.session.command === 'create') {
    if (ctx.session.categories.find((c: ICategory) => c.name === textData)) {
      ctx.reply('Bunday kategoriya mavjud. Iltimos boshqa nom bering')
    } else {
      await Model.Category.create({
        name: textData,
        id: Date.now(),
      })

      ctx.session.messageIds.push(ctx.message?.message_id)

      return exitScene(ctx, "Kategoriya muvaffaqiyatli qo'shildi")
    }
  } else if (ctx.session.command === 'update') {
    await Model.Category.updateOne(
      {
        id: ctx.session.categoryId,
      },
      {
        name: textData,
      },
    )

    ctx.session.messageIds.push(ctx.message?.message_id)

    return exitScene(ctx, 'Kategoriya muvaffaqiyatli yangilandi')
  }
})

export default scene
