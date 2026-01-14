import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import axios from 'axios'

export default class ChatkitController {
  public async run({ request, response }: HttpContext) {
    try {
      const forwardUrl = String(env.get('CHATKIT_FORWARD_URL') || '').trim()
      if (!forwardUrl) {
        return response.status(500).send({
          message: 'CHATKIT_FORWARD_URL belum dikonfigurasi.',
          serve: null,
        })
      }

      const message = String(request.input('message') || '').trim()
      const sessionId = String(request.input('session_id') || '').trim()
      const metadata = request.input('metadata') || null
      if (!message) {
        return response.status(400).send({
          message: 'Message is required.',
          serve: null,
        })
      }

      const result = await axios.post(
        forwardUrl,
        { message, session_id: sessionId || undefined, metadata },
        { timeout: 60000 }
      )
      return response.status(200).send({
        output_text: result.data?.output_text || '',
        category: result.data?.category || null,
      })
    } catch (error) {
      return response.status(500).send({
        message: error.message || 'Chatkit API error',
        serve: null,
      })
    }
  }
}
