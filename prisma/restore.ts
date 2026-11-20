import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const catMap: Record<string, string> = {
  Iuran: "inc_iuran",
  Lainnya: "inc_lain",
  ATK: "exp_atk",
  Kegiatan: "exp_kegiatan",
  Dekorasi: "exp_dekorasi",
}

const rows = [
  ["20/7/2026", "pengeluaran", "Dekorasi", "Dekorasi 17 Agustus", 120000],
  ["15/7/2026", "pemasukan", "Lainnya", "Donasi dari wali kelas", 100000],
  ["12/7/2026", "pemasukan", "Lainnya", "Hasil jualan snack kelas", 150000],
  ["10/7/2026", "pengeluaran", "Kegiatan", "Snack buat rapat kelas", 80000],
  ["8/7/2026", "pemasukan", "Iuran", "Iuran tambahan acara kelas", 50000],
  ["6/7/2026", "pengeluaran", "ATK", "Beli spidol whiteboard 3 pcs", 45000],
  ["6/7/2026", "pengeluaran", "ATK", "Beli buku catatan kelas", 25000],
  ["5/7/2026", "pemasukan", "Iuran", "Iuran kelas bulan Juli", 200000],
] as const

async function main() {
  const fakeTx = await prisma.transaction.deleteMany({})
  const count = 0
  for (const [date, type, cat, desc, amount] of rows) {
    const [d, m, y] = date.split("/").map(Number)
    await prisma.transaction.create({
      data: {
        type,
        amount,
        description: desc,
        categoryId: catMap[cat],
        date: new Date(y, m - 1, d),
        userId: "usr_bendahara",
      },
    })
  }
  console.log(`hapus ${fakeTx.count} transaksi seed, insert ${rows.length} transaksi asli`)
}

main().then(() => prisma.$disconnect())