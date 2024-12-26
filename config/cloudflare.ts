import { env } from '#utils/env'
import { S3Client } from '@aws-sdk/client-s3'

// Configure Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: env.CLOUDFLARE_ENDPOINT,
  credentials: {
    accessKeyId: env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
})

export { r2Client }
