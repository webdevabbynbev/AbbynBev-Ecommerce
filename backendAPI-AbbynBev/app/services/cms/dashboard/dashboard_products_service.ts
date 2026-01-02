import db from '@adonisjs/lucid/services/db'
import { TransactionStatus } from '../../../enums/transaction_status.js'

export class DashboardProductsService {
  async topProductSell(limit = 5) {
    const rows = await db
      .from('transactions as t')
      .join('transaction_details as td', 't.id', 'td.transaction_id')
      .join('products as p', 'p.id', 'td.product_id')
      .where('t.transaction_status', TransactionStatus.COMPLETED)
      .groupBy('p.id', 'p.name', 'p.base_price')
      .select('p.id', 'p.name', 'p.base_price')
      .sum('td.qty as total')
      .orderBy('total', 'desc')
      .limit(limit)

    return rows.map((r: any) => ({
      total: Number(r.total || 0),
      id: Number(r.id),
      name: r.name,
      base_price: Number(r.base_price || 0),
    }))
  }

  async lessProductSell(limit = 5) {
    const [result] = await db.rawQuery(
      `
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
          t.transaction_status = ?
      ) td on td.product_id = p.id
      group by
        p.id
      order by total asc
      limit ?
    `,
      [TransactionStatus.COMPLETED, limit]
    )

    return result
  }
}
