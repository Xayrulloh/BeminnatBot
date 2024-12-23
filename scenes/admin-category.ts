import { Scene } from 'grammy-scenes'
import { BotContext } from '#types/context'
import { ICategory } from '#types/database'
import Model from '#config/database'
import inlineKFunction from '#keyboard/inline'
import customKFunction from '#keyboard/custom'
import { MAIN_KEYBOARD } from '#utils/constants'

const scene = new Scene<BotContext>('AdminCategory')

// show and decide rather to delete, update or create
scene.step(async (ctx) => {
  if (ctx.user.userId != 1151533771) {
    return ctx.scene.exit()
  }

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
    ])

    await ctx.reply(`${category.name}`, { reply_markup: { ...buttons, remove_keyboard: true } })
  }

  const createButton = inlineKFunction(1, [{ view: '➕ Yangi yasash', text: 'create' }])

  await ctx.reply("Yangi kategoriyani qo'shish", { reply_markup: { ...createButton, remove_keyboard: true } })
})

// delete, update or create
scene.wait('delete_add_update').on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery()

  const inputData = ctx.update.callback_query.data

  ctx.session.command = inputData.split('_')[0]
  ctx.session.categoryId = inputData.split('_')[1]

  if (!['delete', 'update', 'create'].includes(ctx.session.command)) {
    await ctx.answerCallbackQuery('Iltimos quyidagilardan birini tanlang')
  }

  // create
  if (ctx.session.command === 'create') {
    await ctx.deleteMessage()

    ctx.reply('Kategoriya nomini kiriting', {
      reply_markup: {
        remove_keyboard: true,
      },
    })
  } else if (ctx.session.command === 'update') {
    ctx.reply('Kategoriya nomini kiriting', {
      reply_markup: {
        remove_keyboard: true,
      },
    })
  } else if (ctx.session.command === 'delete') {
    await Model.Category.deleteOne({ id: ctx.session.categoryId })

    ctx.deleteMessage()

    ctx.reply("Kategoriya o'chirildi", {
      reply_markup: {
        keyboard: customKFunction(2, ...MAIN_KEYBOARD).build(),
        resize_keyboard: true,
      },
    })

    ctx.scene.exit()
  }

  ctx.scene.resume()
})

// create or update
scene.wait('category_name').on('message:text', async (ctx) => {
  const textData = ctx.message?.text

  if (ctx.session.command === 'create') {
    if (ctx.session.categories.find((c: ICategory) => c.name === textData)) {
      ctx.reply('Bunday kategoriya mavjud')
    } else {
      await Model.Category.create({
        name: textData,
        id: Date.now(),
      })

      ctx.reply("Kategoriya muvaffaqiyatli qo'shildi", {
        reply_markup: {
          keyboard: customKFunction(2, ...MAIN_KEYBOARD).build(),
          resize_keyboard: true,
        },
      })
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

    ctx.reply('Kategoriya muvaffaqiyatli yangilandi', {
      reply_markup: {
        keyboard: customKFunction(2, ...MAIN_KEYBOARD).build(),
        resize_keyboard: true,
      },
    })
  }

  ctx.scene.exit()
})

export default scene
