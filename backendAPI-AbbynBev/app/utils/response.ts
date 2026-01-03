import type { HttpContext } from '@adonisjs/core/http'

/**
 * Response helper biar payload konsisten.
 * NOTE: Bentuk payload & status code dijaga sama seperti sebelumnya.
 */
export function badRequest(response: HttpContext['response'], message: string) {
  return response.badRequest({ message, serve: null })
}

export function badRequest400(response: HttpContext['response'], message: string) {
  return response.status(400).send({ message, serve: null })
}

export function internalError(response: HttpContext['response'], error: any) {
  return response.status(500).send({
    message: error?.message || 'Internal Server Error',
    serve: null,
  })
}
