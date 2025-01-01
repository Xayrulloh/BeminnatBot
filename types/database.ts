import { Document } from 'mongoose'

export interface IUser extends Document {
  userId: number
  userName?: string
  name: string
  phoneNumber: number
}

export interface IAddress extends Document {
  latitude: number
  longitude: number
  userId: number
  name: string
}

export interface IProduct extends Document {
  id: number
  name: string
  description: string
  image: string
  price: number
  type: 'miqdor' | "og'irlik"
}

export interface IOrder extends Document {
  id: number
  productId: number
  userId: number
  status: boolean
  quantity?: number
  weight?: number
  isDelivered: boolean
  latitude: number
  longitude: number
  productOverallPrice: number
  overallWaybill: number
}

export interface IWaybill extends Document {
  price: number
}
