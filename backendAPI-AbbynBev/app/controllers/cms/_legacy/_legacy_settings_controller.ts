import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'
import { SettingType } from '../../enums/setting_types.js'
import emitter from '@adonisjs/core/services/emitter'

export default class SettingsController {
  public async getTermAndCondition({ response }: HttpContext) {
    const termAndCondition = await Setting.query()
      .select('value')
      .where('key', SettingType.TERM_AND_CONDITIONS)
      .first()

    return response.status(200).send({
      message: 'Success',
      serve: termAndCondition,
    })
  }

  public async createTermAndCondition({ request, response, auth }: HttpContext) {
    const payload = request.all()

    const existingSetting = await Setting.query()
      .where('key', SettingType.TERM_AND_CONDITIONS)
      .first()

    const oldData = existingSetting?.toJSON()

    let termCondition

    if (existingSetting) {
      existingSetting.merge({
        value: payload?.value || '',
      })
      await existingSetting.save()

      termCondition = existingSetting

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Term and Condition`,
        menu: 'Term and Condition',
        data: { old: oldData, new: termCondition.toJSON() },
      })
    } else {
      termCondition = await Setting.create({
        key: SettingType.TERM_AND_CONDITIONS,
        group: SettingType.TERM_AND_CONDITIONS,
        value: payload?.value || '',
      })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Term and Condition`,
        menu: 'Term and Condition',
        data: termCondition.toJSON(),
      })
    }

    return response.status(200).send({
      message: 'Success',
      serve: termCondition.serialize({
        fields: ['value'],
      }),
    })
  }

  public async getReturnPolicy({ response }: HttpContext) {
    const returnPolicy = await Setting.query()
      .select('value')
      .where('key', SettingType.RETURN_POLICY)
      .first()

    return response.status(200).send({
      message: 'Success',
      serve: returnPolicy,
    })
  }

  public async createReturnPolicy({ request, response, auth }: HttpContext) {
    const payload = request.all()

    const existingSetting = await Setting.query().where('key', SettingType.RETURN_POLICY).first()

    const oldData = existingSetting?.toJSON()

    let returnPolicy

    if (existingSetting) {
      existingSetting.merge({
        value: payload?.value || '',
      })
      await existingSetting.save()

      returnPolicy = existingSetting

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Return Policy`,
        menu: 'Return Policy',
        data: { old: oldData, new: returnPolicy.toJSON() },
      })
    } else {
      returnPolicy = await Setting.create({
        key: SettingType.RETURN_POLICY,
        group: SettingType.RETURN_POLICY,
        value: payload?.value || '',
      })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Return Policy`,
        menu: 'Return Policy',
        data: returnPolicy.toJSON(),
      })
    }

    return response.status(200).send({
      message: 'Success',
      serve: returnPolicy.serialize({
        fields: ['value'],
      }),
    })
  }

  public async getPrivacyPolicy({ response }: HttpContext) {
    const privacyPolicy = await Setting.query()
      .select('value')
      .where('key', SettingType.PRIVACY_POLICY)
      .first()

    return response.status(200).send({
      message: 'Success',
      serve: privacyPolicy,
    })
  }

  public async createPrivacyPolicy({ request, response, auth }: HttpContext) {
    const payload = request.all()

    const existingSetting = await Setting.query().where('key', SettingType.PRIVACY_POLICY).first()

    const oldData = existingSetting?.toJSON()

    let privacyPolicy

    if (existingSetting) {
      existingSetting.merge({
        value: payload?.value || '',
      })
      await existingSetting.save()

      privacyPolicy = existingSetting

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Privacy Policy`,
        menu: 'Privacy Policy',
        data: { old: oldData, new: privacyPolicy.toJSON() },
      })
    } else {
      privacyPolicy = await Setting.create({
        key: SettingType.PRIVACY_POLICY,
        group: SettingType.PRIVACY_POLICY,
        value: payload?.value || '',
      })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Privacy Policy`,
        menu: 'Privacy Policy',
        data: privacyPolicy.toJSON(),
      })
    }

    return response.status(200).send({
      message: 'Success',
      serve: privacyPolicy.serialize({
        fields: ['value'],
      }),
    })
  }

  public async getAboutUs({ response }: HttpContext) {
    const aboutUs = await Setting.query().select('value').where('key', SettingType.ABOUT_US).first()

    return response.status(200).send({
      message: 'Success',
      serve: aboutUs,
    })
  }

  public async createAboutUs({ request, response, auth }: HttpContext) {
    const payload = request.all()

    const existingSetting = await Setting.query().where('key', SettingType.ABOUT_US).first()

    const oldData = existingSetting?.toJSON()

    let aboutUs

    if (existingSetting) {
      existingSetting.merge({
        value: payload?.value || '',
      })
      await existingSetting.save()

      aboutUs = existingSetting

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update About Us`,
        menu: 'About Us',
        data: { old: oldData, new: aboutUs.toJSON() },
      })
    } else {
      aboutUs = await Setting.create({
        key: SettingType.ABOUT_US,
        group: SettingType.ABOUT_US,
        value: payload?.value || '',
      })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create About Us`,
        menu: 'About Us',
        data: aboutUs.toJSON(),
      })
    }

    return response.status(200).send({
      message: 'Success',
      serve: aboutUs.serialize({
        fields: ['value'],
      }),
    })
  }

  public async getContactUs({ response }: HttpContext) {
    const contactUs = await Setting.query()
      .select('value')
      .where('key', SettingType.CONTACT_US)
      .first()

    return response.status(200).send({
      message: 'Success',
      serve: contactUs,
    })
  }

  public async createContactUs({ request, response, auth }: HttpContext) {
    const payload = request.all()

    const existingSetting = await Setting.query().where('key', SettingType.CONTACT_US).first()

    const oldData = existingSetting?.toJSON()

    let contactUs

    if (existingSetting) {
      existingSetting.merge({
        value: payload?.value || '',
      })
      await existingSetting.save()

      contactUs = existingSetting

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Update Contact Us`,
        menu: 'Contact Us',
        data: { old: oldData, new: contactUs.toJSON() },
      })
    } else {
      contactUs = await Setting.create({
        key: SettingType.CONTACT_US,
        group: SettingType.CONTACT_US,
        value: payload?.value || '',
      })

      // @ts-ignore
      await emitter.emit('set:activity-log', {
        roleName: auth.user?.role_name,
        userName: auth.user?.name,
        activity: `Create Contact Us`,
        menu: 'Contact Us',
        data: contactUs.toJSON(),
      })
    }

    return response.status(200).send({
      message: 'Success',
      serve: contactUs.serialize({
        fields: ['value'],
      }),
    })
  }
}
