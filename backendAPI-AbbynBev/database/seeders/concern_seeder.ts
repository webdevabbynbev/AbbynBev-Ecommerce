// database/seeders/ConcernSeeder.ts
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Concern from '#models/concern'
import ConcernOption from '#models/concern_option'

export default class ConcernSeeder extends BaseSeeder {
  public async run() {
    const skinConcern = await Concern.firstOrCreate(
      { slug: 'skin-concern' },
      { name: 'Skin Concern', description: 'Masalah kulit wajah', position: 1 }
    )

    const bodyConcern = await Concern.firstOrCreate(
      { slug: 'body-concern' },
      { name: 'Body Concern', description: 'Masalah kulit tubuh', position: 2 }
    )

    const hairConcern = await Concern.firstOrCreate(
      { slug: 'hair-concern' },
      { name: 'Hair Concern', description: 'Masalah rambut & kulit kepala', position: 3 }
    )

    await ConcernOption.updateOrCreateMany('slug', [
      { concernId: skinConcern.id, name: 'Dehydrated', slug: 'dehydrated' },
      { concernId: skinConcern.id, name: 'Acne', slug: 'acne' },
      { concernId: skinConcern.id, name: 'Wrinkles', slug: 'wrinkles' },
      { concernId: skinConcern.id, name: 'Sensitivity', slug: 'sensitivity' },
      { concernId: skinConcern.id, name: 'Large Pores', slug: 'large-pores' },
      { concernId: skinConcern.id, name: 'Dullness', slug: 'dullness' },
      { concernId: skinConcern.id, name: 'Hyperpigmentation', slug: 'hyperpigmentation' },
      { concernId: skinConcern.id, name: 'Roughness', slug: 'roughness' },
      { concernId: skinConcern.id, name: 'Acne Scars', slug: 'acne-scars' },
      { concernId: skinConcern.id, name: 'Dark Undereyes', slug: 'dark-undereyes' },
      { concernId: skinConcern.id, name: 'Sagging', slug: 'sagging' },
      { concernId: skinConcern.id, name: 'Black Or White Heads', slug: 'black-white-heads' },
      { concernId: skinConcern.id, name: 'Uneven Skin Tone', slug: 'uneven-skin-tone' },
    ])

    await ConcernOption.updateOrCreateMany('slug', [
      { concernId: bodyConcern.id, name: 'Stretch Marks', slug: 'stretch-marks' },
      { concernId: bodyConcern.id, name: 'Sensitivity', slug: 'body-sensitivity' },
      { concernId: bodyConcern.id, name: 'Dryness', slug: 'body-dryness' },
      { concernId: bodyConcern.id, name: 'Hyperpigmentation', slug: 'body-hyperpigmentation' },
      { concernId: bodyConcern.id, name: 'Cellulite', slug: 'cellulite' },
      { concernId: bodyConcern.id, name: 'Body Acne', slug: 'body-acne' },
      { concernId: bodyConcern.id, name: 'Uneven Skin Tone', slug: 'body-uneven-skin-tone' },
      { concernId: bodyConcern.id, name: 'Unwanted Hair', slug: 'unwanted-hair' },
      { concernId: bodyConcern.id, name: 'Dullness', slug: 'body-dullness' },
      { concernId: bodyConcern.id, name: 'Roughness', slug: 'body-roughness' },
      { concernId: bodyConcern.id, name: 'Loose Skin', slug: 'loose-skin' },
    ])

    await ConcernOption.updateOrCreateMany('slug', [
      { concernId: hairConcern.id, name: 'Dandruff', slug: 'dandruff' },
      { concernId: hairConcern.id, name: 'Hair Loss', slug: 'hair-loss' },
      { concernId: hairConcern.id, name: 'Dryness', slug: 'hair-dryness' },
      { concernId: hairConcern.id, name: 'Frizz', slug: 'frizz' },
      { concernId: hairConcern.id, name: 'Oily Scalp', slug: 'oily-scalp' },
      { concernId: hairConcern.id, name: 'Damaged', slug: 'damaged' },
      { concernId: hairConcern.id, name: 'Flatness', slug: 'flatness' },
      { concernId: hairConcern.id, name: 'Split Ends', slug: 'split-ends' },
      { concernId: hairConcern.id, name: 'Grey Hair', slug: 'grey-hair' },
      { concernId: hairConcern.id, name: 'Sensitive Scalp', slug: 'sensitive-scalp' },
    ])
  }
}
