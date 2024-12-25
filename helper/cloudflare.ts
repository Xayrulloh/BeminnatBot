import { r2Client } from '#config/cloudflare'
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import axios from 'axios'

const bucketName = 'beminnat'

export const uploadImage = async (path: string, fileName: string) => {
  // Step 2: Download the file from Telegram
  const fileResponse = await axios.get(path, { responseType: 'arraybuffer' })

  // Step 3: Upload the file to Cloudflare R2
  const objectKey = fileName // Use a unique key for storage

  const uploadParams = {
    Bucket: bucketName,
    Key: objectKey,
    Body: fileResponse.data, // File stream
    ContentType: 'image/png', // Set the appropriate MIME type
  }

  await r2Client.send(new PutObjectCommand(uploadParams)).catch((err) => console.log(err))
}

export const deleteImage = async (fileName: string) => {
  const deleteParams = {
    Bucket: bucketName,
    Key: fileName,
  }

  await r2Client.send(new DeleteObjectCommand(deleteParams)).catch((err) => console.log(err))
}
