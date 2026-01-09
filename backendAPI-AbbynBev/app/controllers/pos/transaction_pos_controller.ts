import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Transaction from '#models/transaction'
import TransactionDetail from '#models/transaction_detail'
import TransactionPos from '#models/transaction_pos'
import ProductVariant from '#models/product_variant'
import User from '#models/user'
import { cuid } from '@adonisjs/core/helpers'

export default class TransactionPosController {
  public async store({ request, response, auth }: HttpContext) {
    const trx = await db.transaction()
    try {
      const { products, payment_method, received_amount } = request.only([
        'products',
        'payment_method',
        'received_amount',
      ])

      const cashier_id = auth.user!.id
      const cashier = await User.find(cashier_id)

      if (!cashier) {
        await trx.rollback()
        return response.status(404).send({ message: 'Cashier not found' })
      }

      if (![6, 7].includes(Number(cashier.role))) {
        await trx.rollback()
        return response.status(403).send({ message: 'Only cashier can create POS transaction' })
      }

      if (!products || products.length === 0) {
        await trx.rollback()
        return response.status(400).send({ message: 'Products are required' })
      }

      let subTotal = 0
      const transactionDetails: TransactionDetail[] = []

      for (const item of products) {
        const variant = await ProductVariant.query({ client: trx })
          .where('barcode', item.barcode)
          .forUpdate()
          .preload('product')
          .first()

        if (!variant) {
          await trx.rollback()
          return response.status(404).send({
            message: `Product with barcode ${item.barcode} not found`,
          })
        }

        const price = Number(variant.price)
        const qty = Number(item.qty)
        const amount = price * qty
        subTotal += amount

        if (variant.stock < qty) {
          await trx.rollback()
          return response.status(400).send({
            message: `Insufficient stock for product ${variant.product.name}`,
          })
        }

        await variant.adjustStock(-qty, 'sale', undefined, 'POS sale', trx)

        const detail = new TransactionDetail()
        detail.productId = variant.productId
        detail.productVariantId = variant.id
        detail.qty = qty
        detail.price = price
        detail.amount = amount.toString()
        transactionDetails.push(detail)
      }

      if (received_amount < subTotal) {
        await trx.rollback()
        return response.status(400).send({
          message: 'Received amount is less than total price',
        })
      }

      const transaction = new Transaction()
      transaction.transactionNumber = `STOREAB-${cuid()}`
      transaction.amount = subTotal
      transaction.discount = 0
      transaction.discountType = 0
      transaction.subTotal = subTotal
      transaction.grandTotal = subTotal
      transaction.channel = 'pos'
      transaction.userId = cashier_id
      await transaction.useTransaction(trx).save()

      for (const detail of transactionDetails) {
        detail.transactionId = transaction.id
        await detail.useTransaction(trx).save()
      }

      const changeAmount = received_amount - subTotal

      const transactionPos = new TransactionPos()
      transactionPos.transactionId = transaction.id
      transactionPos.cashierId = cashier_id
      transactionPos.paymentMethod = payment_method
      transactionPos.receivedAmount = received_amount
      transactionPos.changeAmount = changeAmount
      await transactionPos.useTransaction(trx).save()

      await trx.commit()

      return response.status(201).send({
        message: 'POS Transaction created successfully',
        data: {
          transaction: {
            number: transaction.transactionNumber,
            subtotal: transaction.subTotal,
            grandTotal: transaction.grandTotal,
            paymentMethod: transactionPos.paymentMethod,
            receivedAmount: transactionPos.receivedAmount,
            changeAmount: transactionPos.changeAmount,
          },
          cashier: { id: cashier.id, name: cashier.name },
          items: transactionDetails.map((d) => ({
            productId: d.productId,
            productVariantId: d.productVariantId,
            qty: d.qty,
            price: d.price,
            amount: d.amount,
          })),
        },
      })
    } catch (error) {
      await trx.rollback()
      return response.status(500).send({ message: error.message || 'Internal Server Error' })
    }
  }
}
