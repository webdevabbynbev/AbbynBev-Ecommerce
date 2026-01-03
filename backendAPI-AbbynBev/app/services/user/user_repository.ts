import User from '#models/user'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export class UserRepository {
  query(trx?: TransactionClientContract) {
    return trx ? User.query({ client: trx }) : User.query()
  }

  async findActiveById(id: number | string, trx?: TransactionClientContract) {
    return this.query(trx).where('id', id).whereNull('deleted_at').first()
  }

  async findActiveByEmail(email: string, trx?: TransactionClientContract) {
    return this.query(trx).where('email', email).whereNull('deleted_at').first()
  }

  async findActiveByColumn(
    column: 'email' | 'phone_number' | 'phone' | 'google_id',
    value: string | number,
    trx?: TransactionClientContract
  ) {
    return this.query(trx).where(column, value).whereNull('deleted_at').first()
  }
}
