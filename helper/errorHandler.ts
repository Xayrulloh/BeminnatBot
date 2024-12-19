import { BotError, GrammyError } from 'grammy'
import Model from '#config/database'
import { IUser } from '#types/database'

export async function errorHandler(err: BotError) {
  console.log('🚀 ~ err:', err)
}

export async function handleSendMessageError(error: GrammyError, user: IUser) {
  switch (error.description) {
    case 'Forbidden: bot was blocked by the user': {
      await Model.User.updateOne({ userId: user.userId }, { status: false })
      break
    }
    case 'Forbidden: user is deactivated': {
      await Model.User.updateOne({ userId: user.userId }, { deletedAt: new Date() })
      break
    }
    default: {
      console.error(error)
    }
  }
}
