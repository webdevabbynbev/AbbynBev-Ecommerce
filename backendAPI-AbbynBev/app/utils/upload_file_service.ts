import path from 'path'
import fs from 'fs'
import drive from '@adonisjs/drive/services/main'
import { cuid } from '@adonisjs/core/helpers'
import { v2 as cloudinary } from 'cloudinary'
import Helpers from './helpers.js'
import env from '#start/env'

export default class FileUploadService {
  public static async uploadFile(
    file: any,
    options: { folder: string; type?: string },
    extra?: { publicId?: string }
  ) {
    try {
      const fileExtName: any = {
        'application/msword': 'doc',
        'application/vnd.ms-excel': 'xls',
        'application/pdf': 'pdf',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      }

      console.log('[uploadFile] clientName:', file?.clientName)
      console.log('[uploadFile] tmpPath:', file?.tmpPath)
      console.log('[uploadFile] content-type:', file?.headers?.['content-type'])
      console.log('[uploadFile] folder:', options?.folder, 'publicId:', extra?.publicId)

      const filename = Helpers.stripFileExtension(
        Helpers.replaceUrlUnsafeCharacters(file.clientName)
      )

      const folder = options.folder ?? 'others'
      const fileType = options.type ? `${options.type}_` : ''

      const fileExtension =
        fileExtName[file.headers?.['content-type']] ||
        path.extname(file.clientName).slice(1) ||
        'unknown'

      const fileMimeType = file.headers?.['content-type'] || 'application/octet-stream'

      // ✅ Cloudinary config (server-side)
      const cloudName = env.get('CLOUDINARY_CLOUD_NAME', '')
      const apiKey = env.get('CLOUDINARY_API_KEY', '')
      const apiSecret = env.get('CLOUDINARY_API_SECRET', '')

      console.log('[uploadFile] CLOUDINARY ENV:', {
        cloudName: !!cloudName,
        apiKey: !!apiKey,
        apiSecret: !!apiSecret,
      })

      if (cloudName && apiKey && apiSecret) {
        cloudinary.config({
          cloud_name: cloudName,
          api_key: apiKey,
          api_secret: apiSecret,
        })

        try {
          const uploaded = await cloudinary.uploader.upload(file.tmpPath, {
            folder,
            resource_type: 'auto',
            public_id: extra?.publicId, // ✅ slot "1..8"
            overwrite: true,
            unique_filename: false,
            invalidate: true,
          })

          console.log('[uploadFile] Cloudinary uploaded:', uploaded?.secure_url)
          return uploaded.secure_url
        } catch (err: any) {
          // ✅ DEBUG: kalau cloudinary gagal, kamu bakal lihat errornya di terminal
          console.warn(
            '[uploadFile] Cloudinary upload FAILED -> fallback to drive:',
            err?.message || err
          )
        }
      }

      // ✅ fallback ke drive lokal (kalau cloudinary belum diset / gagal)
      const newFile = `${folder}/${fileType}${filename}-${cuid()}.${fileExtension}`
      console.log('[uploadFile] Fallback to DRIVE path:', newFile)

      await drive
        .use(env.get('DRIVE_DISK'))
        .put(newFile, await fs.promises.readFile(file.tmpPath), {
          contentType: fileMimeType,
          visibility: 'private',
        })

      return newFile
    } catch (error) {
      console.error('Error uploading attachment:', error)
      throw error
    }
  }
}
