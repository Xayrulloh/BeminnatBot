import { BotContext } from '#types/context'
import { ScenesComposer } from 'grammy-scenes'
import start from './start'
import address from './address'
// import location from './location'
// import search from './search'
// import notification from './notification'
// import fasting from './fasting'
// import statistic from './statistic'
// import announcement from './announcement'
// import donate from './donate'
// import hadith from './hadith'
import adminCategory from './admin-category'
// import addHadith from './add-hadith'
// import quran from './quran'
// import feedback from './feedback'

export const scenes = new ScenesComposer<BotContext>(
  // notification,
  // search,
  // announcement,
  // statistic,
  // location,
  // fasting,
  start,
  address,
  adminCategory,
  // donate,
  // hadith,
  // source,
  // addHadith,
  // quran,
  // feedback,
)
