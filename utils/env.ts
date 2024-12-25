import * as dotenv from 'dotenv'
import * as process from 'process'
import * as z from 'zod'
import { Color } from '#utils/enums'

dotenv.config()

export const schema = z.object({
  TOKEN: z.string().regex(/^(\d+):(.*)$/),
  MONGO_URL: z.string(),
  SESSION_TTL: z.number({ coerce: true }),
  CLOUDFLARE_URL: z.string(),
  CLOUDFLARE_ACCESS_KEY_ID: z.string(),
  CLOUDFLARE_SECRET_ACCESS_KEY: z.string(),
  CLOUDFLARE_ENDPOINT: z.string(),
})

type Env = z.infer<typeof schema>

export const result = schema.safeParse(process.env)

if (!result.success) {
  console.error(result.error.issues)
  console.error(Color.Red, 'Some Environment variables are missing. Exiting...')
  process.exit()
}

export const env: Env = result.data
