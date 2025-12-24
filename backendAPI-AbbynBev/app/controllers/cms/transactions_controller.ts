// app/controllers/cms/transactions_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import { TransactionRepository } from '../../services/transaction/transaction_repository.js'
import { AdminTransactionService } from '../../services/transaction/admin_transaction_service.js'
import { toNumber, parseIds } from '../../utils/number.js'

export default class TransactionsController {
  private repo = new TransactionRepository()
  private adminTx = new AdminTransactionService()

  public async get({ response, request }: HttpContext) {
    try {
      const qs = request.qs()

      const pageNumber = isNaN(parseInt(qs.page)) ? 1 : parseInt(qs.page)
      const perPage = isNaN(parseInt(qs.per_page)) ? 10 : parseInt(qs.per_page)

      const dataTransaction = await this.repo.paginateCms(qs, pageNumber, perPage)

      return response.status(200).send({
        message: 'success',
        serve: {
          data: dataTransaction.toJSON().data,
          ...dataTransaction.toJSON().meta,
        },
      })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async show({ params, response }: HttpContext) {
    try {
      const id = toNumber(params.id, 0)
      if (!id) {
        return response.status(400).send({ message: 'Invalid id', serve: [] })
      }

      const tx = await this.repo.findCmsById(id)
      if (!tx) {
        return response.status(404).send({ message: 'Transaction not found', serve: [] })
      }

      return response.status(200).send({ message: 'success', serve: tx })
    } catch (error: any) {
      return response.status(500).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async confirmPaidOrder({ response, request }: HttpContext) {
    try {
      const transactionId = toNumber(request.input('transaction_id'), 0)
      if (!transactionId) {
        return response.status(400).send({ message: 'transaction_id wajib diisi', serve: [] })
      }

      const tx = await this.adminTx.confirmPaidOrder(transactionId)

      return response.status(200).send({
        message: 'Pesanan berhasil dikonfirmasi admin.',
        serve: tx,
      })
    } catch (error: any) {
      const status = error.httpStatus || 400
      return response.status(status).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async updateReceipt({ response, request }: HttpContext) {
    try {
      const transactionId = toNumber(request.input('transaction_id'), 0)
      if (!transactionId) {
        return response.status(400).send({ message: 'transaction_id wajib diisi', serve: [] })
      }

      const result = await this.adminTx.generateReceipt(transactionId)

      return response.status(200).send({
        message: result.message,
        serve: result.serve,
      })
    } catch (error: any) {
      const status = error.httpStatus || 400
      return response.status(status).send({
        message: error.message || 'Internal Server Error.',
        serve: [],
      })
    }
  }

  public async cancelTransactions({ request, response }: HttpContext) {
    try {
      const transactionIds = parseIds(request.input('transactionIds'))
      if (!transactionIds.length) {
        return response.status(400).json({ message: 'Invalid transaction IDs' })
      }

      await this.adminTx.cancelTransactions(transactionIds)

      return response.status(200).json({
        message: 'Transactions successfully canceled. Stock & voucher restored.',
      })
    } catch (error: any) {
      const status = error.httpStatus || 400
      return response.status(status).json({
        message: error.message || 'An error occurred while canceling transactions',
        error: error.message,
      })
    }
  }
}
