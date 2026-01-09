import { BaseModel, scope } from '@adonisjs/lucid/orm'
import SoftDeleteService from '#services/soft_delete'
import { TransactionClientContract } from '@adonisjs/lucid/types/database'

export class CustomBaseModel extends BaseModel {
  public static async findWithSoftDelete(id: number | string, trx?: TransactionClientContract) {
    if (trx) {
      return this.query({ client: trx }).where('id', id).whereNull('deleted_at').first()
    }

    return this.query().where('id', id).whereNull('deleted_at').first()
  }

  public static async findColumnWithSoftDelete(
    column: string,
    id: number | string,
    trx?: TransactionClientContract
  ) {
    if (trx) {
      return this.query({ client: trx }).where(column, id).whereNull('deleted_at').first()
    }
    return this.query().where(column, id).whereNull('deleted_at').first()
  }
    public static active = scope((query) => query.whereNull('deleted_at'))
  public static trashed = scope((query) => query.whereNotNull('deleted_at'))

  public static async findColumnsWithSoftDelete(
    conditions: object,
    trx?: TransactionClientContract
  ) {
    if (trx) {
      return this.query({ client: trx }).where(conditions).whereNull('deleted_at').first()
    }
    return this.query().where(conditions).whereNull('deleted_at').first()
  }

  public async softDelete(column: string = 'deletedAt') {
    await SoftDeleteService.softDelete(this, column)
  }

 
}