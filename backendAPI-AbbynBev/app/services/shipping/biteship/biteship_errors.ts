export function normalizeBiteshipError(error: any) {
  const status = error?.response?.status
  const data = error?.response?.data
  const message =
    data?.message ||
    data?.error?.message ||
    error?.message ||
    'Biteship request failed'

  return {
    status: status ?? 500,
    message,
    raw: data ?? null,
  }
}
