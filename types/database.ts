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

export interface ICategory extends Document{
  id:number,
  name:string
}

export interface Iproducts extends Document{
  id:number,
  name:string,
  description:string,
  image:string,
  price:number,
  categoryId:number
}

export interface IOrders extends Document{
  id:number,
  productId:number,
  userid:number,
  status:number,
  count:number
}