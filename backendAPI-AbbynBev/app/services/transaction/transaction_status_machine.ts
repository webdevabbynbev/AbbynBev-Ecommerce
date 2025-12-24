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

  assertCanCancel(current: number, txNumber?: string) {
    const ok =
      current === TransactionStatus.WAITING_PAYMENT ||
      current === TransactionStatus.PAID_WAITING_ADMIN

    if (!ok) {
      throw new Error(`Transaksi ${txNumber || ''} tidak bisa dicancel karena statusnya tidak valid.`.trim())
    }
  }
}
