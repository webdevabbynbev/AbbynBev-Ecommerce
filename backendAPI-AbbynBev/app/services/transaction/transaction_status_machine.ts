// app/services/transaction/transaction_status_machine.ts
import { TransactionStatus } from '../../enums/transaction_status.js'

export class TransactionStatusMachine {
  assertCanConfirmPaid(current: number) {
    if (current !== TransactionStatus.PAID_WAITING_ADMIN) {
      throw new Error('Transaksi belum dibayar / tidak dalam status menunggu konfirmasi admin.')
    }
  }

  assertCanGenerateReceipt(current: number) {
    if (current !== TransactionStatus.ON_PROCESS) {
      throw new Error('Order harus dikonfirmasi admin dulu sebelum generate resi.')
    }
  }

  assertCanRefreshTracking(current: number) {
    const ok = current === TransactionStatus.ON_PROCESS || current === TransactionStatus.ON_DELIVERY
    if (!ok) {
      throw new Error('Tracking hanya bisa di-refresh saat order ON_PROCESS / ON_DELIVERY.')
    }
  }

  assertCanComplete(current: number) {
    if (current !== TransactionStatus.ON_DELIVERY) {
      throw new Error('Pesanan belum dalam pengiriman, belum bisa diselesaikan.')
    }
  }

  assertCanCancel(current: number, txNumber?: string) {
    const ok =
      current === TransactionStatus.WAITING_PAYMENT ||
      current === TransactionStatus.PAID_WAITING_ADMIN

    if (!ok) {
      throw new Error(`Transaksi ${txNumber || ''} tidak bisa dicancel karena statusnya tidak valid.`.trim())
    }
  }
}
