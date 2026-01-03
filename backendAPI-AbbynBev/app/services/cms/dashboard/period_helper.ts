import moment from 'moment'

export type MonthKey = {
  date: string // YYYY-MM
  monthName: string
  monthNumber: number
}

export function getMonthContext(month?: any) {
  const m = Number(month)
  const currentDate = Number.isFinite(m) && m >= 1 && m <= 12 ? moment().month(m - 1) : moment()

  const monthlyStart = currentDate.clone().startOf('month').format('YYYY-MM-DD HH:mm:ss')
  const monthlyEnd = currentDate.clone().endOf('month').format('YYYY-MM-DD HH:mm:ss')

  return { currentDate, monthlyStart, monthlyEnd }
}

export function getDayKeysInMonth(currentDate = moment()): string[] {
  const days: string[] = []
  const d = currentDate.clone().startOf('month')
  const end = currentDate.clone().endOf('month')

  while (d.isSameOrBefore(end)) {
    days.push(d.format('YYYY-MM-DD'))
    d.add(1, 'day')
  }

  return days
}

export function getMonthKeysInYear(currentDate = moment()): MonthKey[] {
  const months: MonthKey[] = []
  const start = currentDate.clone().startOf('year')
  const end = currentDate.clone().endOf('year')
  const m = start.clone()

  while (m.isSameOrBefore(end)) {
    months.push({
      date: m.format('YYYY-MM'),
      monthName: m.format('MMMM'),
      monthNumber: Number(m.format('M')),
    })
    m.add(1, 'month')
  }

  return months
}
