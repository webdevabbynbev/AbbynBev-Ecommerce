import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.createMany([
      {
        firstName: 'Abby',
        lastName: 'n Bev',
        email: 'abbynbev@gmail.com',
        phoneNumber: '0823233323232',
        password: 'secret123!',
        role: 1,
        isActive: 1,
      },
      {
        firstName: 'Gudang',
        lastName: 'PRJ',
        email: 'gudangprj@gmail.com',
        phoneNumber: '0823233323232',
        password: 'secret123!',
        role: 3,
        isActive: 1,
      },
      {
        firstName: 'User',
        lastName: 'Testing',
        email: 'asepsutrisnasp@gmail.com',
        phoneNumber: '0823233323232',
        password: 'secret123!',
        role: 2,
        isActive: 1,
      },
      {
        firstName: 'Cashier',
        lastName: 'StoreAB',
        email: 'storeabcashier@gmail.com',
        phoneNumber: '0823233323232',
        password: 'secret123!',
        role: 7,
        isActive: 1,
      },
      {
        firstName: 'Cashier',
        lastName: 'GudangAB',
        email: 'gudangcashier@gmail.com',
        phoneNumber: '0823233323232',
        password: 'secret123!',
        role: 6,
        isActive: 1,
      },
      {
        firstName: 'Media',
        lastName: 'AbbynBev',
        email: 'mediaab@gmail.com',
        phoneNumber: '0823233323232',
        password: 'secret123',
        role: 5,
        isActive: 1,
      },
      {
        firstName: 'Finance',
        lastName: 'AbbynBev',
        email: 'financeab@gmail.com',
        phoneNumber: '0823233323232',
        password: 'secret123!',
        role: 4,
        isActive: 1,
      },
    ])
  }
}
