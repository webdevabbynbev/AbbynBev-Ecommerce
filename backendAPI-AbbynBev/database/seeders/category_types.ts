import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CategoryTypes from '#models/category_type'
import { DateTime } from 'luxon'

export default class extends BaseSeeder {
  async run() {
    await CategoryTypes.createMany([
      {
        name: 'Makeup',
        slug: 'makeup',
        parentId: null,
        level: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        createdBy: 1,
        updatedBy: 1,
      },
      {
        name: 'Skincare',
        slug: 'skincare',
        parentId: null,
        level: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        createdBy: 1,
        updatedBy: 1,
      },
      {
        name: 'Haircare',
        slug: 'haircare',
        parentId: null,
        level: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        createdBy: 1,
        updatedBy: 1,
      },
      {
        name: 'Beauty Kit',
        slug: 'beauty-kit',
        parentId: null,
        level: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        createdBy: 1,
        updatedBy: 1,
      },
      {
        name: 'Bath & Body',
        slug: 'bath-body',
        parentId: null,
        level: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        createdBy: 1,
        updatedBy: 1,
      },
      {
        name: "Men's Care",
        slug: 'mens-care',
        parentId: null,
        level: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        createdBy: 1,
        updatedBy: 1,
      },
      {
        name: 'Perfume',
        slug: 'perfume',
        parentId: null,
        level: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        createdBy: 1,
        updatedBy: 1,
      },
      {
        name: 'Highend Brand',
        slug: 'highend-brand',
        parentId: null,
        level: 1,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        createdBy: 1,
        updatedBy: 1,
      },
    ])
  }
}
