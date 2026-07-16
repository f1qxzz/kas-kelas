import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.transaction.deleteMany({})
  const userId = "bendahara"
  const cats = await prisma.category.findMany()
  const iuran = cats.find((c) => c.name === "Iuran" && c.type === "pemasukan")!.id
  const atk = cats.find((c) => c.name === "ATK" && c.type === "pengeluaran")!.id

  const samples = [
    { type: "pemasukan", amount: 200000, description: "Iuran kelas bulan ini", categoryId: iuran, userId, date: new Date(2026, 6, 5) },
    { type: "pemasukan", amount: 150000, description: "Hasil jualan snack kelas", categoryId: iuran, userId, date: new Date(2026, 6, 12) },
    { type: "pengeluaran", amount: 45000, description: "Beli spidol whiteboard 3 pcs", categoryId: atk, userId, date: new Date(2026, 6, 6) },
    { type: "pengeluaran", amount: 80000, description: "Snack buat rapat kelas", categoryId: cats.find((c) => c.name === "Kegiatan" && c.type === "pengeluaran")!.id, userId, date: new Date(2026, 6, 10) },
  ]

  for (const t of samples) await prisma.transaction.create({ data: t })
  console.log(`Reset. ${samples.length} sample transactions kept.`)
}

main().then(() => prisma.$disconnect())
