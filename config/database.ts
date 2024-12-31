import mongoose, { Schema } from 'mongoose'
import { IAddress, IOrder, IProduct, IUser, IWaybill } from '#types/database'
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
    },
  },
  { versionKey: false },
)

const Product = new Schema(
  {
    id: {
      required: true,
      type: Number,
    },
    name: {
      required: true,
      type: String,
    },
    description: {
      required: true,
      type: String,
    },
    image: {
      required: true,
      type: String,
    },
    price: {
      required: true,
      type: Number,
    },
    type: {
      required: true,
      type: String,
      enum: Object.values(['miqdor', "og'irlik"]),
    },
  },
  { versionKey: false },
)

const Order = new Schema(
  {
    id: {
      required: true,
      type: Number,
    },
    productId: {
      required: true,
      type: Number,
      ref: 'Product',
    },
    userId: {
      required: true,
      type: Number,
      ref: 'User',
    },
    status: {
      required: true,
      type: Boolean,
    },
    quantity: {
      required: false,
      type: Number,
    },
    weight: {
      required: false,
      type: Number,
    },
    isDelivered: {
      required: true,
      type: Boolean,
    },
  },
  { versionKey: false },
)

const Waybill = new Schema(
  {
    price: {
      required: true,
      type: Number,
    },
  },
  { versionKey: false },
)

Address.index({ userId: 1, name: 1 }, { unique: true })

mongoose.model<IUser>('User', User)
mongoose.model<IAddress>('Address', Address)
mongoose.model<IProduct>('Product', Product)
mongoose.model<IOrder>('Order', Order)
mongoose.model<IWaybill>('Waybill', Waybill)
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
