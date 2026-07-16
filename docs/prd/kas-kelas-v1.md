# PRD: Kas Kelas — Aplikasi Pencatatan Keuangan Kelas

## 1. Ringkasan Eksekutif
- **Nama:** Kas Kelas
- **Tujuan (1 kalimat):** Aplikasi web simpel buat bendahara kelas nyatetin pemasukan & pengeluaran uang kas secara real-time.
- **Target rilis:** 2 hari
- **Status:** Draft → In Review

## 2. Latar Belakang
- Selama ini catatan uang kas kelas masih pake buku/catatan manual — gampang ilang, susah dilacak, dan ga real-time.
- Bendahara perlu tau saldo terkini kapan aja tanpa nunggu rekap manual.
- Guru/wali kelas juga perlu liat transparansi keuangan kelas.

## 3. Target User
- **Bendahara kelas** — user utama, yang nambahin transaksi tiap hari
- **Ketua kelas / Sekretaris** — bisa liat dan verifikasi
- **Wali kelas** — liat aja (read-only)

Semua user dalam **satu kelas yang sama**.

## 4. Fitur & Scope

### Must Have (P0)
- [ ] Login multi-user (role: bendahara, ketua, wali kelas)
- [ ] Catat pemasukan (jumlah, tanggal, kategori, keterangan)
- [ ] Catat pengeluaran (jumlah, tanggal, kategori, keterangan)
- [ ] Kategori transaksi (Iuran, ATK, Kegiatan, Dll)
- [ ] Dashboard saldo otomatis (saldo = total masuk - total keluar)
- [ ] Riwayat transaksi (tabel urut berdasarkan tanggal)
- [ ] Export laporan PDF/Excel

### Should Have (P1)
- [ ] Filter transaksi per kategori
- [ ] Filter transaksi per rentang tanggal
- [ ] Hapus/edit transaksi

### Nice to Have (P2)
- [ ] Cetak laporan bulanan
- [ ] Grafik pemasukan vs pengeluaran
- [ ] Notifikasi saldo menipis

## 5. Desain UI/UX

### 5.1 Tema & Visual Style
- **Mode:** Dark mode sebagai default
- **Palette:** Background dark (#0a0a0f), surface (#1a1a2e), card (#25253d), accent hijau (#22c55e) untuk pemasukan, accent merah (#ef4444) untuk pengeluaran
- **Typografi:** Font sans-serif modern (Inter), ukuran konsisten, weight bold di angka saldo
- **Icon:** Pake lucide-react (icon simpel, open source)
- **Tone:** Minimalist, bersih, ga ramai — fokus di angka dan data

### 5.2 Layout & Navigasi
```
+------------------+------------------------------------+
|                  |                                    |
|   SIDEBAR KIRI   |         CONTENT AREA               |
|   (240px)        |                                    |
|                  |                                    |
|  [Logo Kas]      |  (Halaman aktif sesuai menu)      |
|                  |                                    |
|  ● Dashboard     |                                    |
|  ● Riwayat       |                                    |
|  ● Laporan       |                                    |
|                  |                                    |
|  ---             |                                    |
|  👤 User name    |                                    |
|  ⚙️ Pengaturan   |                                    |
|  🚪 Logout       |                                    |
+------------------+------------------------------------+
```

- **Sidebar kiri** tetap (fixed), background agak beda dari konten
- Menu aktif di-highlight
- Sidebar auto-collapse di layar kecil (jadi hamburger icon)

### 5.3 Halaman & Komponen

#### A. Halaman Login
- Card di tengah layar (centered)
- Input: Nama pengguna + Password
- Tombol "Masuk" full width
- Background: gradient subtle atau ilustrasi simpel
- Ga ada registrasi — akun udah di-seed dari awal

#### B. Halaman Dashboard (Halaman Utama)
Layout:
```
+----------------------------------------------+
| 💰 Saldo Saat Ini                            |
|  Rp 1.250.000                [Tambah Transaksi] |
+----------------------------------------------+
| Pemasukan Bulan Ini  | Pengeluaran Bulan Ini |
| Rp 500.000           | Rp 250.000            |
+----------------------------------------------+
|                                              |
| Transaksi Terakhir (5 baris)                 |
| ┌────────┬────────┬──────────┬────────┐     |
| │ Tanggal│ Jenis  │ Kategori │ Jumlah │     |
| ├────────┼────────┼──────────┼────────┤     |
| │ 15/07  │ Masuk  │ Iuran    │ 50.000 │     |
| │ 14/07  │ Keluar │ ATK      │ 20.000 │     |
| └────────┴────────┴──────────┴────────┘     |
| [Lihat Semua →]                               |
+----------------------------------------------+
```

- **Card Saldo:** Paling atas, angka besar, hijau kalo saldo positif, merah kalo negatif
- **Stat Bulanan:** 2 card kecil (pemasukan/pengeluaran) di samping
- **Tabel Transaksi Terakhir:** 5 baris, dengan link ke halaman riwayat
- **Tombol "Tambah Transaksi":** Floating / di kanan atas — prominent

#### C. Modal Tambah Transaksi
Popup/modal di atas halaman manapun:
```
┌─ Tambah Transaksi ──────────────────────┐
│                                         │
│  ○ Pemasukan   ● Pengeluaran            │
│                                         │
│  Jumlah        [ Rp ___________ ]       │
│                                         │
│  Kategori      [ ▼ Pilih kategori ]     │
│                                         │
│  Tanggal       [ 16/07/2026 ☐ ]        │
│                                         │
│  Keterangan    [ _________________ ]    │
│                                         │
│         [Batal]     [Simpan]            │
└─────────────────────────────────────────┘
```

- Radio button Pemasukan/Pengeluaran (pengeluaran default)
- Input jumlah pake format rupiah otomatis (tambah titik setiap 3 digit)
- Dropdown kategori (isi dinamis dari DB)
- Date picker (default: hari ini)
- Keterangan opsional
- Validasi: jumlah harus diisi & > 0

#### D. Halaman Riwayat
- Tabel full dengan pagination (10-20 per halaman)
- Kolom: Tanggal, Jenis (label hijau/merah), Kategori, Jumlah, Keterangan, Aksi
- Filter: dropdown kategori + date range picker + tombol "Terapkan"
- Search: search box berdasarkan keterangan
- Sorting: klik header kolom

#### E. Halaman Laporan
- Preview laporan bulanan (mirip tabel riwayat tapi per bulan)
- 2 tombol export: [Download PDF] [Download Excel]
- Total pemasukan, pengeluaran, saldo akhir per periode

### 5.4 Komponen UI Reusable
- **Button** — solid (primary), outline, danger (merah buat hapus)
- **Card** — surface dark, border subtle, padding konsisten
- **Modal** — backdrop blur, animasi fade-in
- **Table** — striped atau no-stripe, header sticky
- **Badge** — label "Masuk" (hijau) / "Keluar" (merah)
- **Input** — dark input field, border tipis, focus glow
- **Dropdown** — custom, style sesuai tema
- **Toast** — notifikasi sukses/gagal setelah aksi

### 5.5 Responsive Behavior
- **Desktop (>768px):** Sidebar kiri full, konten di samping
- **Mobile (<768px):** Sidebar collapse jadi hamburger, tabel jadi card view
- Modal tetap di tengah di semua ukuran layar

### 5.6 Role-based UI
| Role | Dashboard | Tambah Transaksi | Edit/Hapus | Export |
|------|-----------|-----------------|------------|--------|
| Bendahara | ✅ Full | ✅ | ✅ | ✅ |
| Ketua | ✅ Read-only | ❌ | ❌ | ✅ |
| Wali Kelas | ✅ Read-only | ❌ | ❌ | ✅ |

- Tombol "Tambah Transaksi" dan aksi edit/hapus cuma muncul kalo user adalah bendahara
- Ketua & Wali Kelas cuma bisa liat data

## 6. User Flow

**Bendahara:**
1. Login → Dashboard (saldo + 5 transaksi terakhir)
2. Klik "Tambah Transaksi" → pilih jenis (masuk/keluar) → isi jumlah, kategori, keterangan → simpan
3. Saldo otomatis update
4. Bisa liat & export laporan kapan aja

**Ketua / Wali Kelas:**
1. Login → Dashboard (saldo + riwayat transaksi — read only)

## 6. Success Metrics
- **Primary metric:** Transaksi berhasil dicatat dalam < 30 detik
- **Target:** Bisa dipake hari pertama sekolah
- **How to measure:** Manual testing

## 7. Constraints
- **Timeline:** 2 hari
- **Teknis:** App harus jalan tanpa config ribet (no Docker, no cloud DB)
- **Data:** Pake SQLite lokal — gampang backup pake kopi file aja

## 8. Open Questions
- [ ] Auth pake apa? (NextAuth / session sederhana) — *Decision: pake session sederhana via NextAuth*

## 9. Dependencies
- Next.js 14+
- Prisma + SQLite (better-sqlite3)
- NextAuth.js (buat login)
- Tailwind CSS
- recharts / export-to-csv

---

Dibuat: 16 Juli 2026
Status: Draft
