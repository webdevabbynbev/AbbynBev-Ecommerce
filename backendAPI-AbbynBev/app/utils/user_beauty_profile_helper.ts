import { errors } from '@vinejs/vine'
import ConcernOption from '#models/concern_option'
import ProfileCategoryOption from '#models/profile_category_option'

export async function assertConcernOptionsExist(ids: number[]) {
  if (!ids.length) return
  const found = await ConcernOption.query().whereIn('id', ids).count('* as total')
  const total = Number(found?.[0]?.$extras?.total ?? 0)

  if (total !== ids.length) {
    throw new errors.E_VALIDATION_ERROR([
      {
        field: 'concern_option_ids',
        message: 'One or more concern_option_ids not found',
        rule: 'exists',
      },
    ])
  }
}

export async function assertProfileOptionsExist(ids: number[]) {
  if (!ids.length) return
  const found = await ProfileCategoryOption.query().whereIn('id', ids).count('* as total')
  const total = Number(found?.[0]?.$extras?.total ?? 0)

  if (total !== ids.length) {
    throw new errors.E_VALIDATION_ERROR([
      {
        field: 'profile_option_ids',
        message: 'One or more profile_option_ids not found',
        rule: 'exists',
      },
    ])
  }
}
