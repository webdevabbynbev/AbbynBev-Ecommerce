import db from '@adonisjs/lucid/services/db'
import Transaction from '#models/transaction'
import TransactionEcommerce from '#models/transaction_ecommerce'
import { TransactionStatus } from '../../enums/transaction_status.js'

import { MidtransService } from './midtrans_service.js'
import { StockService } from './stock_service.js'
import { VoucherCalculator } from './voucher_calculator.js'

import NumberUtils from '../../utils/number.js'
import { DateTime } from 'luxon'
import VoucherClaim, { VoucherClaimStatus } from '#models/voucher_claim'

export class EcommerceWebhookService {
  private midtrans = new MidtransService()
  private stock = new StockService()
  private voucher = new VoucherCalculator()

  async handleMidtransWebhook(payload: any) {
    return db.transaction(async (trx) => {
      if (!this.midtrans.verifySignature(payload)) {
        const err: any = new Error('Invalid signature')
        err.httpStatus = 401
        throw err
      }

      const orderId = String(payload.order_id || '')
      const transaction = await Transaction.query({ client: trx })
        .where('transaction_number', orderId)
        .first()

      if (!transaction) {
        return { ok: true }
      }

      const transactionEcommerce = await TransactionEcommerce.query({ client: trx })
        .where('transaction_id', transaction.id)
        .first()

      const transactionStatus = this.midtrans.normalizeStatus(payload.transaction_status)
      const fraudStatus = this.midtrans.normalizeStatus(payload.fraud_status)

      if (transactionEcommerce) {
        transactionEcommerce.paymentMethod = payload.payment_type || null
        transactionEcommerce.receipt = this.midtrans.pickReceipt(payload) || null
        await transactionEcommerce.useTransaction(trx).save()
      }

      const current = String(transaction.transactionStatus || '')
      if (current === TransactionStatus.FAILED.toString()) {
        return { ok: true }
      }

      const isFinal =
        current === TransactionStatus.ON_PROCESS.toString() ||
        current === TransactionStatus.ON_DELIVERY.toString() ||
        current === TransactionStatus.COMPLETED.toString()

      let nextStatus: string | null = null
      if (transactionStatus === 'capture' && fraudStatus === 'accept') {
        nextStatus = TransactionStatus.PAID_WAITING_ADMIN.toString()
      } else if (transactionStatus === 'settlement') {
        nextStatus = TransactionStatus.PAID_WAITING_ADMIN.toString()
      } else if (transactionStatus === 'pending') {
        nextStatus = TransactionStatus.WAITING_PAYMENT.toString()
      } else if (['deny', 'cancel', 'expire', 'failure'].includes(transactionStatus)) {
        nextStatus = TransactionStatus.FAILED.toString()
      }

      const isDowngrade =
        current === TransactionStatus.PAID_WAITING_ADMIN.toString() &&
        nextStatus === TransactionStatus.WAITING_PAYMENT.toString()

      const prevStatus = current
      let changed = false

      if (nextStatus && !isFinal && !isDowngrade && prevStatus !== nextStatus) {
        transaction.transactionStatus = nextStatus
        await transaction.useTransaction(trx).save()
        changed = true
      }

      if (
        changed &&
        nextStatus === TransactionStatus.FAILED.toString() &&
        prevStatus !== TransactionStatus.FAILED.toString()
      ) {
        const voucherId = transactionEcommerce?.voucherId ?? null

        await this.stock.restoreFromTransaction(trx, transaction.id)

        if (voucherId) {
          const claim = await VoucherClaim.query({ client: trx })
            .where('transaction_id', transaction.id)
            .where('voucher_id', voucherId)
            .forUpdate()
            .first()

          if (claim && NumberUtils.toNumber(claim.status) === VoucherClaimStatus.RESERVED) {
            claim.status = VoucherClaimStatus.CLAIMED
            claim.transactionId = null
            claim.reservedAt = null
            await claim.useTransaction(trx).save()
          } else {
            await this.voucher.restoreVoucher(trx, voucherId)
          }
        }
      }

      if (
        changed &&
        nextStatus === TransactionStatus.PAID_WAITING_ADMIN.toString()
      ) {
        const voucherId = transactionEcommerce?.voucherId ?? null
        if (voucherId) {
          const claim = await VoucherClaim.query({ client: trx })
            .where('transaction_id', transaction.id)
            .where('voucher_id', voucherId)
            .forUpdate()
            .first()

          if (claim && NumberUtils.toNumber(claim.status) === VoucherClaimStatus.RESERVED) {
            claim.status = VoucherClaimStatus.USED
            claim.usedAt = DateTime.now().setZone('Asia/Jakarta')
            await claim.useTransaction(trx).save()
          }
        }
      }

      return { ok: true }
    })
  }
}
