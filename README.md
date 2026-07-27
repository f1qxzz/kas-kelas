# Kas Kelas

Aplikasi kas kelas berbasis web untuk mengelola keuangan kas siswa. Built dengan **Next.js 15**, **Supabase PostgreSQL**, **Prisma**, dan **Tailwind CSS**.

---

## Demo
---

## Akun Login

| Role | Nama | Password |
|------|------|----------|
| **Bendahara** | `bendahara` | `bendahara123` |
| **Ketua** | `ketua` | `ketua123` |
| **Wali Kelas** | `wali` | `wali123` |

> **Bendahara** = bisa tambah/edit/hapus transaksi, kelola siswa, buat periode baru.
> **Ketua & Wali Kelas** = read-only, hanya bisa melihat data.

---

## Fitur

### Dashboard
- Saldo kas total (nampak merah kalo minus)
- Ringkasan pemasukan & pengeluaran bulan ini
- Grafik area pemasukan vs pengeluaran 7 hari terakhir
- Tombol refresh buat update data

### Status Bayar
- Kelola pembayaran iuran per periode (per minggu)
- Progress bar: berapa % siswa udah lunas
- Klik nama siswa buat toggle **Lunas ↔ Belum**
- Filter: Semua / Lunas / Belum
- Tombol **Bayar Semua** — centang semua yang belum lunas dalam 1 klik
- Modal **Kelola Siswa**: tambah, edit, nonaktifkan siswa
- Iuran: **Rp3.000/siswa/minggu** (otomatis)

### Pemasukan
- Iuran per minggu dengan navigasi panah kiri/kanan
- Daftar siswa yang sudah bayar + tanggal
- **Pemasukan Lainnya** (Kas Harian, Kas Kegiatan, Kas Kebersihan, Lain-lain)
- Bendahara: tambah / edit / hapus transaksi
- Toast sukses setiap selesai action

### Pengeluaran
- Navigasi per bulan
- Kategori: Konsumsi, Alat Tulis, Dokumen, Lainnya
- Bendahara: tambah / edit / hapus transaksi
- Peringatan otomatis kalo saldo minus

### Laporan
- Tab **Laporan Keuangan**: ringkasan, tabel pemasukan per periode, pengeluaran per kategori
- Tab **Rekap Pembayaran**: status per siswa per periode
- Tombol **Cetak / PDF** — print-friendly (cetak langsung dari browser)
- Tombol **CSV** — download Excel-friendly

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Database | Supabase PostgreSQL (via Prisma) |
| ORM | Prisma |
| Auth | NextAuth.js (credentials) |
| UI | Tailwind CSS + Lucide Icons + Motion |
| Charts | Recharts |
| Deployment | Vercel |

---

## Local Development

### Prerequisites
- Node.js 18+
- Supabase PostgreSQL project

### Setup

```bash
# Clone repo
git clone <repo-url>
cd kas-kelas

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env — isi DATABASE_URL dengan connection string Supabase

# Generate Prisma Client
npx prisma generate

# Push schema ke database
npx prisma db push

# (Optional) Seed data
npx prisma db seed

# Run dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

### Environment Variables

```env
DATABASE_URL="postgresql://postgres:<password>@<host>:<port>/postgres?pgbouncer=true"
NEXTAUTH_SECRET="<random-secret-string>"
NEXTAUTH_URL="http://localhost:3000"
```

### Database Schema

```
Student          — siswa (id, name, classNumber, isActive)
PaymentPeriod    — periode mingguan (id, label, startDate, endDate)
Payment         — pembayaran iuran (studentId, periodId, amount, status, paidAt)
Transaction     — transaksi non-iuran (pemasukan & pengeluaran)
Category        — kategori transaksi
```

---

## Deployment ke Vercel

```bash
# Login Vercel
npx vercel login

# Deploy (dev)
npx vercel

# Deploy production
npx vercel --prod
```

Pastikan env vars berikut diset di Vercel Dashboard:
- `DATABASE_URL` — Supabase connection string dengan Supavisor pooler
- `NEXTAUTH_SECRET` — random string buat encrypt session
- `NEXTAUTH_URL` — URL production (contoh: `https://kas-kelas-three.vercel.app`)

---

## Struktur Halaman

| Route | Halaman |
|-------|---------|
| `/` | Dashboard |
| `/income` | Pemasukan |
| `/outcome` | Pengeluaran |
| `/status-bayar` | Status Bayar |
| `/laporan` | Laporan & Export |
| `/login` | Login |

---

## Catatan Penting

- **Password plain text** — auth menggunakan perbandingan plain text, bukan bcrypt. Untuk production, perlu di-hash.
- **Iuran Rp3.000** — hardcoded di `api/periods/route.ts`. Ganti di sana kalo nominal berubah.
- **Database region** — Supabase pooler menggunakan region ap-northeast-1 (Tokyo). Pastikan connection string sesuai.

---

## Lisensi

MIT