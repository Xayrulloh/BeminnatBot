import { BotContext } from '#types/context'
import { ScenesComposer } from 'grammy-scenes'
import start from './start'
import address from './address'
// import bucket from './bucket'
import adminProduct from './admin-product'
import adminAddress from './admin-address'
import market from './market'
import adminWaybill from './admin-waybill'

export const scenes = new ScenesComposer<BotContext>(start, address, adminProduct, market, adminAddress, adminWaybill)
