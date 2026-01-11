import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import moment from 'moment'
import Transaction from '#models/transaction'
import { TransactionStatus } from '../../enums/transaction_status.js'

export default class HomeController {
  public async getTotalRegisterUser({ response }: HttpContext) {
    const totalRegisterUser = await User.query()
      .apply((s) => s.active())
      .count('* as total')
      .first()

    return response.status(200).send({
      message: 'Success',
      serve: { total: totalRegisterUser?.$extras?.total || 0 },
    })
  }

  public async getTotalRegisterUserByPeriod({ response }: HttpContext) {
    const currentDate = moment()

    const days = []
    const firstDayOfMonth = currentDate.clone().startOf('month')
    const lastDayOfMonth = currentDate.clone().endOf('month')
    let currentDay = firstDayOfMonth.clone()

    while (currentDay.isSameOrBefore(lastDayOfMonth)) {
      days.push({
        start: currentDay.clone().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        end: currentDay.clone().endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      })
      currentDay.add(1, 'day')
    }

    const months = []
    const startOfYear = moment().startOf('year')
    const endOfYear = moment().endOf('year')
    let currentMonth = startOfYear.clone()

    while (currentMonth.isSameOrBefore(endOfYear)) {
      months.push({
        start: currentMonth.clone().startOf('month').format('YYYY-MM-DD HH:mm:ss'),
        end: currentMonth.clone().endOf('month').format('YYYY-MM-DD HH:mm:ss'),
      })
      currentMonth.add(1, 'month')
    }

    const [dailyTotals, monthlyTotals] = await Promise.all([
      Promise.all(
        days.map(async (day) => {
          const total = await User.query()
            .whereBetween('created_at', [day.start, day.end])
            .count('* as total')
            .first()

          return {
            date: moment(day.start).format('YYYY-MM-DD'),
            total: total?.$extras?.total || 0,
          }
        })
      ),
      Promise.all(
        months.map(async (month) => {
          const total = await User.query()
            .whereBetween('created_at', [month.start, month.end])
            .count('* as total')
            .first()
          const monthDate = moment(month.start)
          return {
            date: monthDate.format('YYYY-MM'),
            monthName: monthDate.format('MMMM'),
            monthNumber: +monthDate.format('M'),
            total: total?.$extras?.total || 0,
          }
        })
      ),
    ])

    return response.status(200).send({
      message: 'Success',
      serve: {
        daily: dailyTotals,
        monthly: monthlyTotals,
      },
    })
  }

  public async getUserCart({ response, request }: HttpContext) {
    const { page = 1, per_page: perPage = 10, q: search = '' } = request.qs()

    const userCart = await User.query()
      .select(['users.id', 'users.first_name', 'users.last_name', 'users.email'])
      .has('carts')
      .if(search, (query) =>
        query
          .whereILike('users.first_name', `%${search}%`)
          .orWhereILike('users.last_name', `%${search}%`)
          .orWhereILike('users.email', `%${search}%`)
          .orWhereHas('carts', (queryCart) =>
            queryCart.whereHas('product', (queryProduct) =>
              queryProduct.whereILike('products.name', `%${search}%`)
            )
          )
      )
      .preload('carts', (query) =>
        query
          .preload('product', (queryProduct) =>
            queryProduct.preload('categoryType').preload('medias')
          )
          .preload('variant')
      )
      .paginate(page, perPage || 10)

    return response.ok({
      message: 'Success',
      serve: {
        data: userCart.toJSON().data,
        ...userCart.toJSON().meta,
      },
    })
  }

  public async getTotalTransaction({ response }: HttpContext) {
    const totalTransaction = await Transaction.query()
      .where('paymentStatus', TransactionStatus.COMPLETED)
      .count('* as total')
      .first()

    return response.status(200).send({
      message: 'Success',
      serve: { total: totalTransaction?.$extras?.total || 0 },
    })
  }

  public async getTotalTransactionByMonth({ response, request }: HttpContext) {
    const { month } = request.qs()

    const currentDate = month ? moment().month(month - 1) : moment()

    const monthlyStartDate = currentDate.clone().startOf('month').format('YYYY-MM-DD HH:mm:ss')
    const monthlyEndDate = currentDate.clone().endOf('month').format('YYYY-MM-DD HH:mm:ss')

    const total = await Transaction.query()
      .whereBetween('created_at', [monthlyStartDate, monthlyEndDate])
      .where('paymentStatus', TransactionStatus.COMPLETED)
      .count('* as total')
      .first()

    return response.status(200).send({
      message: 'Success',
      serve: {
        total: total?.$extras?.total || 0,
      },
    })
  }

  public async getTotalTransactionByStatus({ response, request }: HttpContext) {
    const { paymentStatus } = request.qs()

    const totalTransaction = await Transaction.query()
      .if(paymentStatus, (query) => query.where('paymentStatus', paymentStatus))
      .count('* as total')
      .first()

    return response.status(200).send({
      message: 'Success',
      serve: { total: totalTransaction?.$extras?.total || 0 },
    })
  }

  public async getTotalTransactionByPeriod({ response }: HttpContext) {
    const currentDate = moment()

    const days = []
    const firstDayOfMonth = currentDate.clone().startOf('month')
    const lastDayOfMonth = currentDate.clone().endOf('month')
    let currentDay = firstDayOfMonth.clone()

    while (currentDay.isSameOrBefore(lastDayOfMonth)) {
      days.push({
        start: currentDay.clone().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        end: currentDay.clone().endOf('day').format('YYYY-MM-DD HH:mm:ss'),
      })
      currentDay.add(1, 'day')
    }

    const months = []
    const startOfYear = moment().startOf('year')
    const endOfYear = moment().endOf('year')
    let currentMonth = startOfYear.clone()

    while (currentMonth.isSameOrBefore(endOfYear)) {
      months.push({
        start: currentMonth.clone().startOf('month').format('YYYY-MM-DD HH:mm:ss'),
        end: currentMonth.clone().endOf('month').format('YYYY-MM-DD HH:mm:ss'),
      })
      currentMonth.add(1, 'month')
    }

    const [dailyTotals, monthlyTotals] = await Promise.all([
      Promise.all(
        days.map(async (day) => {
          const total = await Transaction.query()
            .whereBetween('created_at', [day.start, day.end])
            .where('paymentStatus', TransactionStatus.COMPLETED)
            .count('* as total')
            .first()

          return {
            date: moment(day.start).format('YYYY-MM-DD'),
            total: total?.$extras?.total || 0,
          }
        })
      ),
      Promise.all(
        months.map(async (month) => {
          const total = await Transaction.query()
            .whereBetween('created_at', [month.start, month.end])
            .where('paymentStatus', TransactionStatus.COMPLETED)
            .count('* as total')
            .first()
          const monthDate = moment(month.start)
          return {
            date: monthDate.format('YYYY-MM'),
            monthName: monthDate.format('MMMM'),
            monthNumber: +monthDate.format('M'),
            total: total?.$extras?.total || 0,
          }
        })
      ),
    ])

    return response.status(200).send({
      message: 'Success',
      serve: {
        daily: dailyTotals,
        monthly: monthlyTotals,
      },
    })
  }

  public async getStatusTransactionByMonth({ response, request }: HttpContext) {
    const { month } = request.qs()

    const currentDate = month ? moment().month(month - 1) : moment()

    const monthlyStartDate = currentDate.clone().startOf('month').toDate()
    const monthlyEndDate = currentDate.clone().endOf('month').toDate()

    const defaultStatus: Record<'1' | '2' | '3' | '4' | '9', { total: number; label: string }> = {
      '1': { total: 0, label: 'Waiting Payment' },
      '2': { total: 0, label: 'On Process' },
      '3': { total: 0, label: 'On Delivery' },
      '4': { total: 0, label: 'Completed' },
      '9': { total: 0, label: 'Failed' },
    }

    const statusTransaction = await Transaction.query()
      .select('paymentStatus') 
      .whereBetween('createdAt', [monthlyStartDate, monthlyEndDate])
      .groupBy('paymentStatus')
      .count('* as total')

    const result = Object.values(
      statusTransaction.reduce(
        (acc, item) => {
          const status = String(item.transactionStatus) as keyof typeof defaultStatus

          if (defaultStatus[status]) {
            acc[status] = {
              total: Number(item.$extras?.total) || 0,
              label: defaultStatus[status].label,
            }
          }

          return acc
        },
        { ...defaultStatus }
      )
    )

    return response.ok({
      message: 'Success',
      serve: result,
    })
  }

  public async getTopProductSell({ response }: HttpContext) {
    const topProductSell = await Transaction.query()
      .select(['products.id', 'products.name', 'products.base_price'])
      .sum('transaction_details.qty as total')
      .join('transaction_details', 'transactions.id', '=', 'transaction_details.transaction_id')
      .join('products', 'products.id', '=', 'transaction_details.product_id')
      .where('transactions.payment_status', TransactionStatus.COMPLETED)
      .groupBy('transaction_details.product_id', 'products.id', 'products.name')
      .orderBy('total', 'desc')
      .limit(5)

    const result = topProductSell.map((item) => ({
      total: +(item.$extras?.total || 0),
      id: +item.id,
      name: item.$extras?.name,
      base_price: +(item.$extras?.base_price || 0),
    }))

    return response.ok({
      message: 'Success',
      serve: result,
    })
  }

  public async getLessProductSell({ response }: HttpContext) {
    const [result, _] = await db.rawQuery(`
      select
        p.id,
        p.name,
        case
          when sum(td.qty) is null then 0
          else sum(td.qty)
        end as total
      from
        products p
      left join (
        select
          td.qty,
          td.product_id
        from
          transaction_details td
        join transactions t on
          t.id = td.transaction_id
        where
          t.payment_status = ${TransactionStatus.COMPLETED}) td on
        td.product_id = p.id
      group by
        p.id
      order by total asc
      limit 5
    `)

    return response.ok({
      message: 'Success',
      serve: result,
    })
  }
}
