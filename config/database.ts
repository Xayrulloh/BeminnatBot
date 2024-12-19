import mongoose, { Schema } from 'mongoose'
import { IAddress, ICategory, IUser, Iorders, Iproducts } from '#types/database'
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
    id: {
      required: true,
      type: Number,
    },
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
  },
  { versionKey: false },
)

const Category=new mongoose.Schema(
  {
    id:{
      required:true,
      type:Number,
    },
    name:{
      required:true,
      unique:true,
      type:String,
    }
  },
  { versionKey: false },

)

const Products=new mongoose.Schema({
  id:{
    required:true,
    type:Number
  },
  name:{
    required:true,
    type:String,
  },
  description:{
    required:true,
    type:String
  },
  image:{
    required:true,
    type:String
  },
  price:{
    required:true,
    type:Number,
  },
  categoryId:{
    required:true,
    type:String,
    ref:'Category'
  }
},
{ versionKey: false },
)

const Orders=new mongoose.Schema({
  id:{
    required:true,
    type:Number
  },
  categoryId:{
    required:true,
    type:Number,
    ref:"Category"

  },
  userId:{
    required:true,
    type:Number,
    ref:"User"
  },
  status:{
    required:true,
    type:Number
  },
  count:{
    required:true,
    type:Number
  }
},
{versionKey:false})
mongoose.model<IUser>('User', User)
mongoose.model<IAddress>('Address', Address)
mongoose.model<ICategory>('Category',Category)
mongoose.model<Iproducts>('Products',Products)
mongoose.model<Iorders>('Orders',Orders)

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
