import type { HttpContext } from '@adonisjs/core/http'
import { SettingType } from '../../../enums/setting_types.js'
import { TextSettingService } from '#services/cms/settings/text_setting_service'
import { ActivityLogService } from '#services/activity_log_service'

export default class SettingsPagesController {
  private svc = new TextSettingService()

  private async getByKey({ response }: HttpContext, key: SettingType) {
    const setting = await this.svc.getValue(key)
    return response.status(200).send({ message: 'Success', serve: setting })
  }

  private async upsertByKey(
    { request, response, auth }: HttpContext,
    key: SettingType,
    menu: string
  ) {
    const payload = request.all()
    const result = await this.svc.upsertValue(key, payload?.value || '')

    await ActivityLogService.log({
      roleName: auth.user?.role_name,
      userName: auth.user?.name,
      activity: `${result.action === 'CREATE' ? 'Create' : 'Update'} ${menu}`,
      menu,
      data:
        result.action === 'UPDATE'
          ? { old: result.old, new: result.setting.toJSON() }
          : result.setting.toJSON(),
    })

    return response.status(200).send({
      message: 'Success',
      serve: result.setting.serialize({ fields: ['value'] }),
    })
  }

  public async getAboutUs(ctx: HttpContext) {
    return this.getByKey(ctx, SettingType.ABOUT_US)
  }
  public async createAboutUs(ctx: HttpContext) {
    return this.upsertByKey(ctx, SettingType.ABOUT_US, 'About Us')
  }

  public async getContactUs(ctx: HttpContext) {
    return this.getByKey(ctx, SettingType.CONTACT_US)
  }
  public async createContactUs(ctx: HttpContext) {
    return this.upsertByKey(ctx, SettingType.CONTACT_US, 'Contact Us')
  }
}
