import type { HttpContext } from '@adonisjs/core/http'
import drive from '@adonisjs/drive/services/main'
import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

export default class UploadsController {
  public async upload({ response, request }: HttpContext) {
    try {
      const file = request.file('file')
      const fileValidation = request.file('file', {
        size: '500mb',
        extnames: ['jpg', 'jpeg', 'gif', 'png', 'pdf', 'doc', 'docx', 'mp4', 'webp'],
      })

      if (!fileValidation?.isValid) {
        return response.status(422).send({
          message: 'Failed to upload file.',
          serve: [],
        })
      }

      const sanitizedFileName = file?.clientName.replace(/\s+/g, '_')
      const timestamp = Date.now()
      const newFileName = `${timestamp}_${sanitizedFileName}`

      const tmpPath = request.file('file')?.tmpPath
      if (!tmpPath) {
        return response.status(422).send({
          message: 'Failed to upload file.',
          serve: [],
        })
      }

      if (
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
      ) {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        })

        const uploaded = await cloudinary.uploader.upload(tmpPath, {
          folder: 'uploads',
          resource_type: 'auto',
        })

        return response.status(200).send({
          message: '',
          serve: uploaded.secure_url,
          signedUrl: uploaded.secure_url,
        })
      }

      await drive.use('fs').put('/' + newFileName, await fs.promises.readFile(tmpPath), {
        ContentType: request.file('file')?.headers['content-type'],
        visibility: 'private',
      })

      const signedUrl = await drive.use('fs').getSignedUrl(newFileName)
      return response.status(200).send({
        message: '',
        serve: newFileName,
        signedUrl,
      })

    } 
    catch (error) {
      return response.status(500).send({
        message: error.message,
        serve: [],
      })
    }
  }
}
