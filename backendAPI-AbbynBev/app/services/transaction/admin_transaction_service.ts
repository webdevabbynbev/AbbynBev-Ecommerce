import db from '@adonisjs/lucid/services/db'
import Transaction from '#models/transaction'
import ProductVariant from '#models/product_variant'
import Voucher from '#models/voucher'
import { TransactionStatus } from '../../enums/transaction_status.js'
import { TransactionStatusMachine } from './transaction_status_machine.js'
import { BiteshipOrderService } from '../shipping/biteship_order_service.js'
import NumberUtils from '../../utils/number.js'

import VoucherClaim, { VoucherClaimStatus } from '#models/voucher_claim'

export class AdminTransactionService {
  private status = new TransactionStatusMachine()
  private biteship = new BiteshipOrderService()

  async confirmPaidOrder(transactionId: number) {
    return db.transaction(async (trx) => {
      const transaction = await Transaction.query({ client: trx })
        .where('id', transactionId)
        .forUpdate()
        .first()

      if (!transaction) {
        const err: any = new Error('Transaction not found.')
        err.httpStatus = 404
        throw err
      }

      this.status.assertCanConfirmPaid(NumberUtils.toNumber(transaction.transactionStatus as any))
      transaction.transactionStatus = TransactionStatus.ON_PROCESS as any
      await transaction.useTransaction(trx).save()

      return transaction
    })
  }

  async generateReceipt(transactionId: number) {
    return db.transaction(async (trx) => {
      const transaction = await Transaction.query({ client: trx })
        .where('id', transactionId)
        .forUpdate()
        .preload('details', (detail) => {
          detail.preload('product')
          detail.preload('variant')
        })
        .preload('shipments')
        .preload('ecommerce', (ec) => {
          ec.preload('userAddress', (addr) => {
            addr.preload('provinceData')
            addr.preload('cityData')
            addr.preload('districtData')
            addr.preload('subDistrictData')
          })
          ec.preload('user')
        })
        .first()

      if (!transaction) {
        const err: any = new Error('Transaction not found.')
        err.httpStatus = 404
        throw err
      }

      this.status.assertCanGenerateReceipt(NumberUtils.toNumber(transaction.transactionStatus as any))
      return this.biteship.createReceiptForTransaction(trx, transaction)
    })
  }

  async cancelTransactions(transactionIds: number[]) {
    return db.transaction(async (trx) => {
      const transactions = await Transaction.query({ client: trx })
        .whereIn('id', transactionIds)
        .preload('details', (d) => d.preload('product'))
        .preload('ecommerce')

      if (transactions.length !== transactionIds.length) {
        const err: any = new Error('Ada transaksi yang tidak ditemukan.')
        err.httpStatus = 404
        throw err
      }

      for (const t of transactions) {
        this.status.assertCanCancel(NumberUtils.toNumber(t.transactionStatus as any), t.transactionNumber)
      }

      for (const t of transactions as any[]) {
        for (const detail of t.details) {
          if (!detail.productVariantId) continue

          const pv = await ProductVariant.query({ client: trx })
            .where('id', detail.productVariantId)
            .forUpdate()
            .first()

          if (pv) {
            pv.stock = NumberUtils.toNumber(pv.stock) + NumberUtils.toNumber(detail.qty)
            await pv.useTransaction(trx).save()
          }

          if (detail.product) {
            detail.product.popularity = Math.max(0, NumberUtils.toNumber(detail.product.popularity) - 1)
            await detail.product.useTransaction(trx).save()
          }
        }
        const voucherId = t.ecommerce?.voucherId
        if (voucherId) {
          const claim = await VoucherClaim.query({ client: trx })
            .where('transaction_id', t.id)
            .where('voucher_id', voucherId)
            .forUpdate()
            .first()

          const claimStatus = NumberUtils.toNumber(claim?.status, -1)

          if (
            claim &&
            (claimStatus === VoucherClaimStatus.RESERVED || claimStatus === VoucherClaimStatus.USED)
          ) {
            claim.status = VoucherClaimStatus.CLAIMED
            claim.transactionId = null
            claim.reservedAt = null
            claim.usedAt = null
            await claim.useTransaction(trx).save()
          } else {
            const v = await Voucher.query({ client: trx }).where('id', voucherId).forUpdate().first()
            if (v) {
              v.qty = NumberUtils.toNumber(v.qty) + 1
              await v.useTransaction(trx).save()
            }
          }
        }

        t.transactionStatus = TransactionStatus.FAILED as any
        await t.useTransaction(trx).save()
      }

      return { canceled: transactions.length }
    })
  }
}
