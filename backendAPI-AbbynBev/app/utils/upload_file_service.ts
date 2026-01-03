import path from 'path'
import fs from 'fs'
import drive from '@adonisjs/drive/services/main'
import { cuid } from '@adonisjs/core/helpers'
<<<<<<< HEAD
import { replaceUrlUnsafeCharacters, stripFileExtension } from './helpers.js'
import { v2 as cloudinary } from 'cloudinary'
=======
import Helpers from './helpers.js'
<<<<<<< HEAD
>>>>>>> origin/main
=======
import env from '#start/env'
>>>>>>> origin/main

export default class FileUploadService {
  public static async uploadFile(file: any, options: { folder: string; type: string }) {
    try {
      const fileExtName: any = {
        'application/msword': 'doc',
        'application/vnd.ms-excel': 'xls',
        'application/pdf': 'pdf',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      }

      const filename = Helpers.stripFileExtension(Helpers.replaceUrlUnsafeCharacters(file.clientName))
      const folder = options.folder ?? 'others'
      const fileType = options.type ? `${options.type}_` : ''

      // @ts-ignore
      const fileExtension =
        fileExtName[file.headers['content-type']] ||
        path.extname(file.clientName).slice(1) ||
        'unknown'
      const fileMimeType = file.headers['content-type'] || 'application/octet-stream'

      const newFile = `${folder}/${fileType}${filename}-${cuid()}.${fileExtension}`

      await drive.use(env.get('DRIVE_DISK')).put(newFile, await fs.promises.readFile(file.tmpPath), {
        contentType: fileMimeType,
        visibility: 'private',
      })

      return newFile
    } catch (error) {
      console.error('Error uploading attachment:', error)
      throw error
    }
<<<<<<< HEAD

    const filename = stripFileExtension(replaceUrlUnsafeCharacters(file.clientName))
    const folder = options.folder ?? 'others'
    const fileType = options.type ? `${options.type}_` : ''

    // @ts-ignore
    const fileExtension =
      fileExtName[file.headers['content-type']] ||
      path.extname(file.clientName).slice(1) ||
      'unknown'
    const fileMimeType = file.headers['content-type'] || 'application/octet-stream'

    const newFile = `${folder}/${fileType}${filename}-${cuid()}.${fileExtension}`

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

      const uploaded = await cloudinary.uploader.upload(file.tmpPath, {
        folder,
        resource_type: 'auto',
      })

      return uploaded.secure_url
    }

    await drive.use('fs').put(newFile, await fs.promises.readFile(file.tmpPath), {
      contentType: fileMimeType,
      visibility: 'private',
    })

    return newFile
  } catch (error) {
    console.error('Error uploading attachment:', error)
    throw error
=======
>>>>>>> origin/main
  }
}