import mongoose, { Schema } from 'mongoose'
import { IAddress, IUser } from '#types/database'
import { env } from '#utils/env'
import { Color } from '#utils/enums'

const User = new Schema(
  {
    userId: {
      required: true,
      type: Number,
    },
    userName: {
      required: false,
      type: String,
    },
    name: {
      required: true,
      type: String,
    },
    phoneNumber: {
      required: true,
      type: Number,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { versionKey: false },
)

const Address = new Schema(
  {
    latitude: {
      required: true,
      type: Number,
    },
    longitude: {
      required: true,
      type: Number,
    },
    userId: {
      required: true,
      type: Number,
      ref: 'User',
    },
    name: {
      required: true,
      type: String,
    }
  },
  { versionKey: false },
)

Address.index({ userId: 1, name: 1 }, { unique: true });

mongoose.model<IUser>('User', User)
mongoose.model<IAddress>('Address', Address)
mongoose.set('strictQuery', false)

mongoose
  .connect(env.MONGO_URL, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.info('Database successfully connected')
  })
  .catch((reason) => {
    console.error(Color.Red, 'Error with database connection', reason)
    process.exit()
  })

export default mongoose.models
