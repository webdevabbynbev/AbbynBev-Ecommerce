import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Province from '#models/province'
import City from '#models/city'
import District from '#models/district'
import SubDistrict from '#models/sub_district'
import axios from 'axios'
import env from '#start/env'
import fs from 'fs/promises'
import path from 'path'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const DATA_PATH = path.join(process.cwd(), 'storage', 'locations.json')
const MAX_HIT_PER_DAY = 100

export default class LocationSeeder extends BaseSeeder {
  public async run() {
    console.log('🌍 Start seeding provinces, cities, districts, subdistricts...')

    let locations: any = { provinces: [] }
    let apiHits = 0

    try {
      const raw = await fs.readFile(DATA_PATH, 'utf8')
      locations = JSON.parse(raw)
      console.log('📂 Cache file ditemukan, lanjut dari storage/locations.json')
    } catch (err) {
      console.log('⚠️ Cache tidak ditemukan, akan fetch baru...')
    }

    const client = axios.create({
      baseURL: env.get('KOMERCE_COST_BASE_URL'),
      headers: { key: env.get('KOMERCE_COST_API_KEY') },
    })

    if (!locations.provinces || locations.provinces.length === 0) {
      console.log('⚠️ Cache kosong → ambil provinces dari API...')
      const { data: provinceRes } = await client.get('/destination/province')
      apiHits++
      locations.provinces = provinceRes?.data ?? []
      console.log(`✅ Provinces fetched: ${locations.provinces.length}`)
      await fs.writeFile(DATA_PATH, JSON.stringify(locations, null, 2))
    }

    const provinceCount = await Province.query().count('* as total')
    const cityCount = await City.query().count('* as total')
    const districtCount = await District.query().count('* as total')
    const subDistrictCount = await SubDistrict.query().count('* as total')

    if (
      Number(provinceCount[0].$extras.total) === 0 &&
      Number(cityCount[0].$extras.total) === 0 &&
      Number(districtCount[0].$extras.total) === 0 &&
      Number(subDistrictCount[0].$extras.total) === 0
    ) {
      console.log('🗑️ Database kosong → isi ulang dari cache JSON dulu...')
      for (const p of locations.provinces) {
        await Province.updateOrCreate({ id: p.id }, { id: p.id, name: p.name })
        for (const c of p.cities ?? []) {
          await City.updateOrCreate({ id: c.id }, { id: c.id, name: c.name, provinceId: p.id })
          for (const d of c.districts ?? []) {
            await District.updateOrCreate({ id: d.id }, { id: d.id, name: d.name, cityId: c.id })
            for (const s of d.subdistricts ?? []) {
              await SubDistrict.updateOrCreate(
                { id: s.id },
                { id: s.id, name: s.name, districtId: d.id, zipCode: s.zipCode || null }
              )
            }
          }
        }
      }
      console.log('✅ DB berhasil diisi / diupdate dari cache JSON.')
    }

    for (const p of locations.provinces) {
      if (!p.cities) {
        if (apiHits >= MAX_HIT_PER_DAY) break
        const { data: cityRes } = await client.get(`/destination/city/${p.id}`)
        apiHits++
        p.cities = cityRes?.data ?? []
        console.log(`🏙️ Cities fetched for ${p.name}: ${p.cities.length}`)
        await fs.writeFile(DATA_PATH, JSON.stringify(locations, null, 2))
        await sleep(2000)
      }

      for (const c of p.cities) {
        if (!c.districts) {
          if (apiHits >= MAX_HIT_PER_DAY) break
          const { data: districtRes } = await client.get(`/destination/district/${c.id}`)
          apiHits++
          c.districts = districtRes?.data ?? []
          console.log(`📍 Districts fetched for ${c.name}: ${c.districts.length}`)
          await fs.writeFile(DATA_PATH, JSON.stringify(locations, null, 2))
          await sleep(2000)
        }

        for (const d of c.districts) {
          if (!d.subdistricts) {
            if (apiHits >= MAX_HIT_PER_DAY) break
            const { data: subRes } = await client.get(`/destination/sub-district/${d.id}`)
            apiHits++
            d.subdistricts = subRes?.data ?? []
            console.log(`🏘️ Subdistricts fetched for ${d.name}: ${d.subdistricts.length}`)
            await fs.writeFile(DATA_PATH, JSON.stringify(locations, null, 2))
            await sleep(2000)
          }
        }
      }
    }

    console.log(`🎉 Done seeding. Total API hits used: ${apiHits}/${MAX_HIT_PER_DAY}`)
  }
}
