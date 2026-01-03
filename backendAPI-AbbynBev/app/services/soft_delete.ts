import { DateTime } from 'luxon'
import { LucidRow, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import { BaseModel } from '@adonisjs/lucid/orm'

export default class SoftDeleteService {
  public static softDeleteQuery(query: ModelQueryBuilderContract<typeof BaseModel>) {
    query.whereNull('deleted_at')
  }

  public static async softDelete(row: LucidRow, column: string = 'deletedAt') {
    if (row) {
      row.$attributes[column] = DateTime.local()

      await row.save()
    }
  }
}
