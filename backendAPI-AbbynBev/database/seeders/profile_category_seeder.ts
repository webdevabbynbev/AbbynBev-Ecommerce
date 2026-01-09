import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import ProfileCategory from '#models/profile_category'
import ProfileCategoryOption from '#models/profile_category_option'

export default class ProfileCategorySeeder extends BaseSeeder {
  public async run() {
    const categories = [
      {
        name: 'Skin Type',
        type: 'skin',
        options: ['Dry Skin', 'Normal Skin', 'Combination', 'Oily Skin'],
      },
      {
        name: 'Skin Tone',
        type: 'skin',
        options: ['Light', 'Medium Light', 'Medium', 'Medium Dark', 'Dark'],
      },
      {
        name: 'Skin Undertone',
        type: 'skin',
        options: ['Cool', 'Neutral', 'Warm'],
      },
      {
        name: 'Hair Type',
        type: 'hair',
        options: ['Wavy', 'Straight', 'Curly'],
      },
      {
        name: 'Colored Hair',
        type: 'hair',
        options: ['Colored', 'Non Colored'],
      },
      {
        name: 'Hijaber',
        type: 'hair',
        options: ['Hijaber', 'Non Hijaber'],
      },
    ]

    for (const category of categories) {
      const cat = await ProfileCategory.create({
        name: category.name,
        type: category.type,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      })
      for (const option of category.options) {
        await ProfileCategoryOption.create({
          profileCategoriesId: cat.id,
          label: option,
          value: option.toLowerCase().replace(/\s+/g, '_'),
          isActive: true,
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        })
      }
    }
  }
}
