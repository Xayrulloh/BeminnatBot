import { BotContext } from '#types/context'
import { ScenesComposer } from 'grammy-scenes'
import start from './start'
import address from './address'
import bucket from './bucket'
import adminCategory from './admin-category'
import adminProduct from './admin-product'
import market from './market'

export const scenes = new ScenesComposer<BotContext>(start, address, adminCategory, adminProduct, market, bucket)
