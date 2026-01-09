import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Persona from '#models/persona'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    await Persona.createMany([
      {
        name: 'Abby',
        slug: 'abby',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
      {
        name: 'Bev',
        slug: 'bev',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
    ])
  }
}
