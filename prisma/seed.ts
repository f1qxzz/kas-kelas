import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const categories = [
  { name: "Iuran", type: "pemasukan" },
  { name: "ATK", type: "pengeluaran" },
  { name: "Kegiatan", type: "pengeluaran" },
  { name: "Dekorasi", type: "pengeluaran" },
  { name: "Lainnya", type: "pemasukan" },
  { name: "Lainnya", type: "pengeluaran" },
]

async function main() {
  const bendahara = await prisma.user.upsert({
    where: { id: "bendahara" },
    update: {},
    create: { id: "bendahara", name: "bendahara", password: "bendahara123", role: "bendahara" },
  })
  await prisma.user.upsert({
    where: { id: "ketua" },
    update: {},
    create: { id: "ketua", name: "ketua", password: "ketua123", role: "ketua" },
  })
  await prisma.user.upsert({
    where: { id: "wali" },
    update: {},
    create: { id: "wali", name: "wali", password: "wali123", role: "wali" },
  })

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { id: cat.name + cat.type },
      update: {},
      create: { id: cat.name + cat.type, name: cat.name, type: cat.type },
    })
  }
}

main().then(() => {
  console.log("Seed done")
  prisma.$disconnect()
})
