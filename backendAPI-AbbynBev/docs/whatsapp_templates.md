# WhatsApp Template Setup (Meta Cloud API)

Dokumen ini berisi contoh template WhatsApp yang **wajib** dibuat di Meta
agar notifikasi OTP, registrasi berhasil, dan transaksi sukses bisa dikirim
dari backend Abby n Bev.

> **Penting:** Nama template harus **sama persis** dengan yang dipanggil di code:
> `otp_code`, `register_success`, `transaction_success`.

## 1) Template OTP

**Template name:** `otp_code`  
**Category:** Authentication / Utility  
**Language:** `en`  

**Body (1 parameter):**
```
Your Abby n Bev OTP is {{1}}. Please do not share this code with anyone.
```

**Buttons (optional, 1 URL button):**
- **Type:** URL  
- **Text:** Verify  
- **URL:** `https://abby-n-bev.com/verify/{{1}}`

> Backend saat ini mengirim **body parameter** `{{1}} = otp` dan
> **button parameter** `{{1}} = otp`.

---

## 2) Template Welcome / Registration Success

**Template name:** `register_success`  
**Category:** Utility  
**Language:** `en`  

**Body (1 parameter):**
```
Hi {{1}}, welcome to Abby n Bev! Your account has been created successfully.
```

> Backend mengirim **body parameter** `{{1}} = nama user`.

---

## 3) Template Transaction Success

**Template name:** `transaction_success`  
**Category:** Utility  
**Language:** `en`  

**Body (1 parameter):**
```
Thank you for your purchase! Your transaction {{1}} has been completed successfully.
```

> Backend mengirim **body parameter** `{{1}} = transaction_number`.

---

## Catatan Teknis

- Language code di backend diset ke `en`.
- Jika template tidak ditemukan / tidak approved, backend akan
  fallback ke email.
- Untuk mengganti bahasa atau format template, pastikan:
  - nama template tetap sama
  - jumlah/urutan parameter sama
