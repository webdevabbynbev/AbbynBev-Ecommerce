import Attribute from '#models/attribute'
import AttributeValue from '#models/attribute_value'

export default class AttributeSeeder {
  public async run() {
    const attributes = [
      {
        name: 'Size',
        values: ['30ml', '50ml', '80ml', '100ml', '150ml'],
      },
      {
        name: 'Ukuran',
        values: ['S', 'M', 'L', 'XL'],
      },
      {
        name: 'Finish',
        values: ['Matte', 'Glossy', 'Satin'],
      },
      {
        name: 'Shade',
        values: ['Light', 'Medium', 'Dark'],
      },
    ]

    for (const attr of attributes) {
      const attribute = await Attribute.firstOrCreate({ name: attr.name }, { name: attr.name })
      for (const val of attr.values) {
        await AttributeValue.firstOrCreate(
          { value: val, attributeId: attribute.id },
          { value: val, attributeId: attribute.id }
        )
      }
    }

    console.log('✅ Attribute & AttributeValue seed inserted!')
  }
}
