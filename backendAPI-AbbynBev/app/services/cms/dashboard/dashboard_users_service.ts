import db from '@adonisjs/lucid/services/db'
import moment from 'moment'
import User from '#models/user'

import { getDayKeysInMonth, getMonthKeysInYear, type MonthKey } from '#services/cms/dashboard/period_helper'

export class DashboardUsersService {
  async totalRegisteredActiveUsers(): Promise<number> {
    const row = await User.query().apply((s) => s.active()).count('* as total').first()
    return Number(row?.$extras?.total || 0)
  }

  async registeredUsersByPeriod() {
    const now = moment()

    const startMonth = now.clone().startOf('month').format('YYYY-MM-DD HH:mm:ss')
    const endMonth = now.clone().endOf('month').format('YYYY-MM-DD HH:mm:ss')
    const dayKeys: string[] = getDayKeysInMonth(now)

    const dailyRows = await User.query()
      .whereBetween('created_at', [startMonth, endMonth])
      .select(db.raw('DATE(created_at) as d'))
      .count('* as total')
      .groupByRaw('DATE(created_at)')

    const dailyMap = new Map<string, number>()
    for (const r of dailyRows) {
      const key = String(r.$extras?.d || '')
      dailyMap.set(key, Number(r.$extras?.total || 0))
    }

    const daily = dayKeys.map((date: string) => ({
      date,
      total: dailyMap.get(date) || 0,
    }))

    const startYear = now.clone().startOf('year').format('YYYY-MM-DD HH:mm:ss')
    const endYear = now.clone().endOf('year').format('YYYY-MM-DD HH:mm:ss')
    const monthKeys: MonthKey[] = getMonthKeysInYear(now)

    const monthlyRows = await User.query()
      .whereBetween('created_at', [startYear, endYear])
      .select(db.raw("DATE_FORMAT(created_at, '%Y-%m') as ym"))
      .count('* as total')
      .groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")

    const monthlyMap = new Map<string, number>()
    for (const r of monthlyRows) {
      const key = String(r.$extras?.ym || '')
      monthlyMap.set(key, Number(r.$extras?.total || 0))
    }

    const monthly = monthKeys.map((m: MonthKey) => ({
      ...m,
      total: monthlyMap.get(m.date) || 0,
    }))

    return { daily, monthly }
  }
}
