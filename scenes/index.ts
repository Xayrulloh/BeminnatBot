import { BotContext } from '#types/context'
import { ScenesComposer } from 'grammy-scenes'
import start from './start'
import bucket from './bucket'
import adminProduct from './admin-product'
import adminAddress from './admin-address'
import market from './market'
import adminOrder from './admin-order'

export const scenes = new ScenesComposer<BotContext>(start, adminProduct, market, adminAddress, bucket, adminOrder)
