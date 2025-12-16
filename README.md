# Abby n Bev — Omnichannel Beauty Commerce Platform

Abby n Bev Web Repository adalah ekosistem digital untuk E-commerce dan Transaksi secara Offline dari brand Abby n Bev yang menggabungkan **E-commerce Website**, **CMS Admin**, dan **Point of Sales (POS)** dalam satu platform terintegrasi. Dibangun dengan arsitektur modern menggunakan **Next.js**, **AdonisJS**, dan **React (Vite)**.

---

## Table of Contents
- [Overview](#overview)
- [Tech Stack Overview](#tech-stack-overview)
- [Technology Breakdown](#technology-breakdown)
  - [Backend API (AdonisJS)](#backend-api-adonisjs)
  - [Frontend E-Commerce (Nextjs)](#frontend-e-commerce-nextjs)
  - [CMS Admin (React--ant-design)](#cms-admin-react--ant-design)
- [Installation Guide](#installation-guide)
- [Contributors](#contributors)
- [Copyright & License](#copyright--license)

---

## Overview

Abby n Bev merupakan platform omnichannel yang mendukung:
- Penjualan online melalui website e-commerce
- Pengelolaan produk, order, dan user melalui CMS Admin
- Transaksi toko offline melalui sistem POS yang terintegrasi API

---

## Tech Stack Overview

| Layer | Stack |
|--------|--------|
| **Frontend** | Next.js 15, React 19, TailwindCSS 4, Radix UI | E-commerce modern dan SEO optimized |
| **CMS Admin** | React 18, Ant Design 5, Vite | Dashboard pengelolaan produk & order |
| **Backend API** | AdonisJS 6, TypeScript, Lucid ORM | API & bisnis logic utama |
| **Database** | MySQL 8.x | Relational DB untuk seluruh sistem |
| **Payment** | Midtrans Client | Gateway pembayaran online |
| **Shipping** | Komerce Raja Ongkir | Cost Calculate & Shipping Delivery |
| **AI Tools** | OpenAI API | Otomatisasi deskripsi & insight produk |
| **Storage** | Adonis Drive (S3 / Cloud) | Manajemen file dan gambar produk |
| **Security** | JWT, reCAPTCHA, CORS, Rate Limiter | Proteksi API & akses admin |

---

## Technology Breakdown

### Backend API (AdonisJS)
**Folder:** `backendAPI-AbbynBev`  
**Core Tech:** AdonisJS 6 + TypeScript + ESM  

Abby n Bev Backend API adalah pusat logika bisnis utama yang menangani semua data dari e-commerce dan CMS.  
Dibangun menggunakan **AdonisJS v6**, sistem ini menawarkan keamanan tinggi, performa cepat, dan struktur modular berbasis TypeScript.

**Key Highlights:**
- RESTful API berbasis AdonisJS Router
- Lucid ORM untuk relasi produk, user, dan transaksi
- JWT & Social Auth (Google)
- Integrasi Midtrans Payment
- OpenAI Content Generator
- Mailer (SMTP) & File Storage (S3)
- Middleware validation + Rate limiter

---

### Frontend E-Commerce (Next.js)
**Folder:** `frontendcommerce-AB`  
**Core Tech:** Next.js 15 + React 19 + TailwindCSS 4 + Radix UI  

Abby n Bev E-Commerce adalah website utama untuk pelanggan, dirancang dengan **Next.js App Router** dan **TailwindCSS 4**.  
Mengutamakan performa, SEO, serta pengalaman interaktif dan modern bagi pengguna.

**Key Highlights:**
- SSR & SSG untuk SEO dan kecepatan optimal
- Login via Google OAuth
- Filtering dinamis berdasarkan kategori & concern
- Carousel & interaksi visual (Swiper + Framer Motion)
- Sistem tema (Light/Dark Mode)
- Aksesibilitas dengan Radix UI
- Integrasi API langsung dengan AdonisJS Backend
- Responsive design untuk semua device

---

### CMS Admin (React + Ant Design)
**Folder:** `cmsadmin-ab`  
**Core Tech:** React 18 + TypeScript + Vite + Ant Design 5  

CMS Admin adalah dashboard internal untuk mengelola produk, pengguna, stok, banner, dan transaksi Abby n Bev.  
Dibangun dengan **Vite** untuk performa build cepat dan menggunakan **Ant Design** agar konsisten, profesional, dan mudah digunakan.

**Key Highlights:**
- CRUD data produk & kategori
- Dashboard analitik penjualan (Recharts)
- Editor teks dinamis (Tiptap & Quill)
- Export laporan ke PDF & Excel
- Integrasi login & autentikasi JWT
- Role management berbasis state (Zustand)
- Ant Design UI Components
- Hot Module Reloading (Vite HMR)
---

## Installation Guide
### Clone Repository
Install Git dan Github Desktop
- Git Install  
[Install Git](https://git-scm.com/install/)
- Github Desktop  
[Install Github Desktop](https://desktop.github.com/download/)

How to Clone Repository:  
Tutorial: [Cara Clone Repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)

> Silahkan untuk clone repository pertama clone project nya dari branch development.

Documentation API: [Documentation API](https://documenter.getpostman.com/view/29732486/2sB3HeuixG)

---
## Backend Setup (AdonisJS API)

### Step 1 — Masuk ke Folder Backend API
```bash
cd backendAPI-abbynbev
```

### Step 2 — Install Dependencies
```bash
npm install
```

### Step 3 — Salin File Konfigurasi Environment
```bash
cp .env.example .env
```

### Step 4 — Generate Unique APP_KEY untuk Enkripsi
```bash
node ace generate:key
```

### Step 5 — Jalankan Migrasi Database
node ace migration:run
```bash
node ace migration:run
```

### Step 6 — (Opsional) Seed Data Awal ke Database
node ace db:seed
```bash
node ace db:seed
```

### Step 7 — Jalankan Server API
```bash
npm run dev
```

---

## Frontend CMS Admin Setup
### Step 1 - Masuk ke Folder Frontend CMS Admin
```bash
cd cmsadmin-ab
```
### Step 2 - Install Depedencies
```bash
npm install
```

### Step 3 - Salin file Konfigurasi Environment
```bash
cp .env.example .env
```

### Step 4 - Run Project
```bash
npm run dev
```

---
## E-commerce Setup
### Step 1 - Masuk ke Folder Frontend CMS Admin
```bash
cd frontendcommerce-AB
```
### Step 2 - Install Depedencies
```bash
npm install
```

### Step 3 - Salin File Konfigurasi Environment
```bash
cp .env.example .env
```

### Step 4 - Run Project
```bash
npm run dev
```

---

## Contributors
| Name                    | Role                         | GitHub                                       |
| ----------------------- | ---------------------------- | -------------------------------------------- |
| **Asep Sutrisna Suhada Putra** | Full-stack Developer         | [@AxsevSutrisna](https://github.com/AxsevSutrisna) |
| **Iqbal**   | UI/UX Designer & Front-end Developer       | [@iqbaliie](https://github.com/iqbaliie) |

---

## Copyright & License
Copyright © 2025 Abby n Bev - CV. Gaya Beauty Utama, All Right Reserved.
