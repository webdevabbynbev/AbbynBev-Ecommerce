
import type { HttpContext } from '@adonisjs/core/http'
import { TransactionRepository } from '#services/transaction/transaction_repository'
import { AdminFulfillmentService } from '#services/transaction/admin_fulfillment_service'
import NumberUtils from '#utils/number'

export default class TransactionsController {
  private repo = new TransactionRepository()
  private fulfill = new AdminFulfillmentService()

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
      const id = NumberUtils.toNumber(params.id, 0)
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
      const transactionId = NumberUtils.toNumber(request.input('transaction_id'), 0)
      if (!transactionId) {
        return response.status(400).send({ message: 'transaction_id wajib diisi', serve: [] })
      }

      const tx = await this.fulfill.confirmPaidOrder(transactionId)

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
      const transactionId = NumberUtils.toNumber(request.input('transaction_id'), 0)
      if (!transactionId) {
        return response.status(400).send({ message: 'transaction_id wajib diisi', serve: [] })
      }

      const result = await this.fulfill.generateReceipt(transactionId)

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

  public async refreshTracking({ response, request }: HttpContext) {
    try {
      const transactionId = NumberUtils.toNumber(request.input('transaction_id'), 0)
      if (!transactionId) {
        return response.status(400).send({ message: 'transaction_id wajib diisi', serve: [] })
      }

      const tx = await this.fulfill.refreshTracking(transactionId)

      return response.status(200).send({
        message: 'Tracking berhasil disinkronkan.',
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

  public async completeOrder({ response, request }: HttpContext) {
    try {
      const transactionId = NumberUtils.toNumber(request.input('transaction_id'), 0)
      if (!transactionId) {
        return response.status(400).send({ message: 'transaction_id wajib diisi', serve: [] })
      }

      const tx = await this.fulfill.completeOrder(transactionId)

      return response.status(200).send({
        message: 'Pesanan berhasil diselesaikan.',
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

  public async cancelTransactions({ request, response }: HttpContext) {
    try {
      const transactionIds = NumberUtils.parseIds(request.input('transactionIds'))
      if (!transactionIds.length) {
        return response.status(400).json({ message: 'Invalid transaction IDs' })
      }

      await this.fulfill.cancelTransactions(transactionIds)

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
