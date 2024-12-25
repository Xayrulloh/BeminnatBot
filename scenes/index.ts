import { BotContext } from '#types/context'
import { ScenesComposer } from 'grammy-scenes'
import start from './start'
import address from './address'
import adminCategory from './admin-category'
import adminProduct from './admin-product'

export const scenes = new ScenesComposer<BotContext>(start, address, adminCategory, adminProduct)
