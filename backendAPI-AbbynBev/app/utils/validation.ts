/**
 * Helper untuk merapikan pesan error dari VineJS.
 * Dipakai supaya controller tidak mengulang mapping err.messages.
 */
export function vineMessagesToString(err: any, fallback = 'Validation error.') {
  const msgs = err?.messages
  if (Array.isArray(msgs) && msgs.length > 0) {
    return msgs.map((v: { message: string }) => v.message).join(',')
  }

  // fallback terakhir
  return err?.message || fallback
}
