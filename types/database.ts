import { Document } from 'mongoose'

export interface IUser extends Document {
  userId: number
  userName?: string
  name: string
  phoneNumber: number
  deletedAt: Date | null
}

export interface IAddress extends Document {
  id: number,
  latitude: number,
  longitude: number
  userId: number
}
