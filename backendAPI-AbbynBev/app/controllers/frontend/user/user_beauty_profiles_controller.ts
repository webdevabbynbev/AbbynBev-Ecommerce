import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import UserBeautyConcern from '#models/user_beauty_concern'
import UserBeautyProfileOption from '#models/user_beauty_profile_option'
import {
  CreateUserBeautyConcernValidator,
  CreateUserBeautyProfileValidator,
} from '#validators/user_personalize_beauty'
import {
  assertConcernOptionsExist,
  assertProfileOptionsExist,
} from '#utils/user_beauty_profile_helper'

export default class UserBeautyProfilesController {
  public async getUserSelections({ response, auth }: HttpContext) {
    try {
      const user = auth.user!
      await user.load('beautyConcerns')
      await user.load('beautyProfileOptions')

      return response.status(200).send({
        message: 'success',
        serve: {
          concerns: user.beautyConcerns.map((c) => c.concernOptionId),
          profiles: user.beautyProfileOptions.map((p) => p.profileCategoryOptionsId),
        },
      })
    } catch (error) {
      console.error('[getUserSelections] Error:', error)
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: {},
      })
    }
  }

  public async saveConcerns({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(CreateUserBeautyConcernValidator)

      await assertConcernOptionsExist(payload.concern_option_ids)

      await db.transaction(async (trx) => {
        await UserBeautyConcern.query({ client: trx }).where('user_id', user.id).delete()

        const rows = payload.concern_option_ids.map((id) => ({
          userId: user.id,
          concernOptionId: id,
        }))

        if (rows.length) await UserBeautyConcern.createMany(rows, { client: trx })
      })

      return response.status(200).send({
        message: 'Beauty concerns updated successfully',
        serve: { concern_option_ids: payload.concern_option_ids },
      })
    } catch (error) {
      console.error('[saveConcerns] Error:', error)
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: {},
      })
    }
  }

  public async saveProfiles({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(CreateUserBeautyProfileValidator)

      await assertProfileOptionsExist(payload.profile_option_ids)

      await db.transaction(async (trx) => {
        await UserBeautyProfileOption.query({ client: trx }).where('user_id', user.id).delete()

        const rows = payload.profile_option_ids.map((id) => ({
          userId: user.id,
          profileCategoryOptionsId: id,
        }))

        if (rows.length) await UserBeautyProfileOption.createMany(rows, { client: trx })
      })

      return response.status(200).send({
        message: 'Beauty profile updated successfully',
        serve: { profile_option_ids: payload.profile_option_ids },
      })
    } catch (error) {
      console.error('[saveProfiles] Error:', error)
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: {},
      })
    }
  }
}
