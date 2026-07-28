# Topinz API

Platform REST API modern & production-ready — Landing Page, Authentication, Dashboard User, Dashboard Admin, Dokumentasi API dinamis, dan Management Endpoint.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Framer Motion · Express.js · MongoDB (Mongoose)

## Fitur

- **Landing page** premium ala Stripe/Vercel — hero, stats, features, pricing, docs preview, FAQ
- **Authentication** — register (validasi email/username unik, nomor +62, password ≥ 8), login via email *atau* username, forgot/reset password, JWT
- **API Key otomatis** — format `Tpz-<username>`, bisa di-reset kapan saja
- **Role & limit** — Free (30 req/hari), Premium (5.000 req/hari), Admin; auto-downgrade saat premium kadaluarsa
- **Whitelist IP** — per user, `0.0.0.0` selalu diblok, request di luar whitelist → `403 Forbidden`
- **Dashboard User** — overview + chart pemakaian, API key, whitelist manager, request history (search/filter/pagination), settings
- **Dashboard Admin** — statistik platform, CRUD kategori (＋ reorder), CRUD endpoint (publish/unpublish), manajemen user, request logs, pricing editor, settings + audit log
- **Dokumentasi dinamis** — sidebar per kategori dari database, detail endpoint lengkap (params, headers, response codes), contoh kode **cURL / Axios / Fetch / Node.js / PHP / Python**, tombol copy
- **Public API** (`/api/v1/*`) — 9 endpoint berfungsi nyata + mock otomatis untuk endpoint terdokumentasi lainnya, semua melewati rantai API key → whitelist → premium check → daily limit → rate limit → request log
- **Status page** — uptime bars 90 hari per kategori, dihitung dari request logs
- **Keamanan** — JWT, bcrypt, Helmet, CORS, express-rate-limit, validasi zod, audit log
- Dark mode & light mode, font Geist, aksen `#2563eb`, responsive mobile-first

## Struktur

```
topinz-api/
├── frontend/          # Next.js 15 App Router (port 3000)
│   ├── app/           # (marketing), (auth), dashboard, admin, docs
│   ├── components/    # ui (shadcn), shared, marketing, dashboard, admin, docs
│   └── lib/           # api client, auth context, hooks, types
├── backend/           # Express + Mongoose (port 4000)
│   └── src/
│       ├── models/    # User, Category, Endpoint, RequestLog, Setting, AuditLog
│       ├── middleware/# auth (JWT), apiKeyAuth (chain), validate, rate limiters
│       ├── routes/    # auth, user, dashboard, categories, endpoint, admin, docs, api/v1 …
│       ├── seed.ts    # data demo (users, 10 kategori, ±24 endpoint, ±4000 logs)
│       └── smoke.ts   # end-to-end smoke test
└── CONTRACT.md        # kontrak API frontend ⇄ backend
```

## Menjalankan Secara Lokal

Prasyarat: **Node.js ≥ 20**. MongoDB opsional — tanpa `MONGODB_URI`, backend otomatis memakai `mongodb-memory-server` (data hilang saat restart; cocok untuk mencoba).

```bash
# 1. Install semua dependency (npm workspaces)
npm install

# 2. Salin env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 3. Seed data demo (admin, user contoh, kategori, endpoint, logs)
npm run seed

# 4. Jalankan backend (4000) + frontend (3000) sekaligus
npm run dev
```

Buka **http://localhost:3000**.

> Catatan: dengan memory-server, jalankan seed pada proses yang sama tidak memungkinkan — cara termudah: isi `MONGODB_URI` (lihat di bawah) lalu `npm run seed`, atau biarkan backend berjalan tanpa seed dan register akun baru dari UI. Untuk pengalaman penuh (dashboard admin berisi data), gunakan MongoDB nyata.

### Menggunakan MongoDB nyata (disarankan)

Gunakan [MongoDB Atlas](https://www.mongodb.com/atlas) gratis atau instance lokal, lalu di `backend/.env`:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/topinz
JWT_SECRET=ganti-dengan-string-acak-panjang
```

Jalankan `npm run seed` sekali, lalu `npm run dev`.

## Akun Demo (setelah seed)

| Role    | Email             | Username   | Password      |
| ------- | ----------------- | ---------- | ------------- |
| Admin   | admin@topinz.dev  | `admin`    | `Admin123!`   |
| Premium | dimas@example.com | `dimasdev` | `Premium123!` |
| Free    | sari@example.com  | `saricode` | `Freeuser123!`|

## Mencoba Public API

```bash
# API key dibuat otomatis saat register: Tpz-<username>
curl "http://localhost:4000/api/v1/tools/password?length=16" \
  -H "apikey: Tpz-saricode"
```

Respons:

```json
{
  "success": true,
  "creator": "Topinz API",
  "result": { "password": "…", "length": 16 }
}
```

Aturan akses:

- Tanpa/salah API key → `401`
- IP `0.0.0.0` → selalu `403`
- Whitelist IP terisi & IP tidak terdaftar → `403 Forbidden`
- Endpoint premium dengan akun Free → `403`
- Limit harian habis → `429`

## Skrip

| Perintah            | Deskripsi                                   |
| ------------------- | ------------------------------------------- |
| `npm run dev`       | Backend + frontend (concurrently)           |
| `npm run build`     | Build backend (tsc) + frontend (next build) |
| `npm run start`     | Jalankan hasil build                        |
| `npm run seed`      | Isi database dengan data demo               |
| `npx tsx src/smoke.ts` (di `backend/`) | Smoke test end-to-end   |

## Environment

**backend/.env**

| Variabel        | Default                 | Keterangan                              |
| --------------- | ----------------------- | --------------------------------------- |
| `PORT`          | `4000`                  | Port Express                            |
| `MONGODB_URI`   | *(kosong)*              | Kosong = mongodb-memory-server (dev)    |
| `JWT_SECRET`    | —                       | **Wajib diganti** di production          |
| `JWT_EXPIRES_IN`| `7d`                    | Masa berlaku token                      |
| `CORS_ORIGIN`   | `http://localhost:3000` | Origin frontend                         |

**frontend/.env.local**

| Variabel              | Default                 |
| --------------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` |

## Deploy

- **Frontend** → Vercel (set `NEXT_PUBLIC_API_URL` ke URL backend)
- **Backend** → Railway / Render / VPS (set `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN` ke domain frontend)
- **Database** → MongoDB Atlas

Checklist production: ganti `JWT_SECRET`, batasi `CORS_ORIGIN`, jalankan di belakang reverse proxy (agar `trust proxy` menghasilkan IP asli untuk whitelist), dan pertimbangkan memindahkan sesi ke httpOnly cookie.

## Lisensi

MIT
