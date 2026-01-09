import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Tag from '#models/tag'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    await Tag.createMany([
      {
        name: 'Flash Sale',
        slug: 'flash-sale',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
      {
        name: 'Best Seller',
        slug: 'best-seller',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
      {
        name: 'New Arrival',
        slug: 'new-arrival',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
    ])
  }
}
