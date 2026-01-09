import Setting from '#models/setting'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    await Setting.createMany([
      {
        key: 'COURIER',
        group: 'TRANSACTION',
        value: 'jne:tiki:sicepat:jnt',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
    ])
  }
}
