import { DateTime } from 'luxon'
import { afterFetch, afterFind, column, computed } from '@adonisjs/lucid/orm'
import drive from '@adonisjs/drive/services/main'
import env from '#start/env'
import { CustomBaseModel } from '#services/custom_base_model'

export default class Banner extends CustomBaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string | null

  @column()
  declare image: string

  @column()
  declare position: string | null

  @column()
  declare order: number

  @column()
  declare imageMobile: string

  @column()
  declare description: string | null

  @column({ serializeAs: 'button_text' })
  declare buttonText: string | null

  @column({ serializeAs: 'button_url' })
  declare buttonUrl: string | null

  @column({ serializeAs: 'has_button' })
  declare hasButton: number

  @column({ serializeAs: 'created_by' })
  declare createdBy: number

  @column({ serializeAs: 'updated_by' })
  declare updatedBy: number

  @column.dateTime({ serializeAs: null })
  declare deletedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @computed({ serializeAs: 'image_url' })
  declare imageUrl: string

  @computed({ serializeAs: 'image_mobile_url' })
  declare imageMobileUrl: string

  public async getImageUrl() {
    this.imageMobileUrl = ''
    this.imageUrl = ''
    if (this.image) {
      this.imageUrl = this.image.startsWith('http')
        ? this.image
        : await drive.use(env.get('DRIVE_DISK')).getSignedUrl(this.image)
    }
    if (this.imageMobile) {
      this.imageMobileUrl = this.imageMobile.startsWith('http')
        ? this.imageMobile
        : await drive.use(env.get('DRIVE_DISK')).getSignedUrl(this.imageMobile)
    }
  }

  @computed({ serializeAs: 'file_desktop_type' })
  public get fileDesktopType() {
    if (!this.image) return null

    return this.image?.split('.')?.pop()?.toLowerCase() === 'mp4' ? 'video' : 'image'
  }

  @computed({ serializeAs: 'file_mobile_type' })
  public get fileMobileType() {
    if (!this.imageMobile) return null

    return this.imageMobile?.split('.')?.pop()?.toLowerCase() === 'mp4' ? 'video' : 'image'
  }

  @afterFetch()
  public static async getImageUrlAfterFetch(models: Banner[]) {
    for (const model of models) {
      await model.getImageUrl()
    }
  }

  @afterFind()
  public static async getImageUrlAfterFind(model: Banner) {
    await model.getImageUrl()
  }
}
