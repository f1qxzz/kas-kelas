import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const students = [
  "Aulia","Abel","Aurel","Aurora","Ayla","Kezia","Bilqis","Tata","Puri","Cheisia",
  "Destiana","Dhea","Dian","Cita","Fariha","Felita","Feodora","Fiorella","Gaudya","Kartika",
  "Kharisma","Lutfiana","Marsya","Khalisa","Rizkya","Rosiana","Sagita","Septiani","Shovi","Shyfa",
  "Talita","Tiara","Vinsensia","Vion","Yuda","Zeva",
]

async function main() {
  await prisma.payment.deleteMany()
  await prisma.paymentPeriod.deleteMany()
  await prisma.student.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  await prisma.user.createMany({
    data: [
      { id: "usr_bendahara", name: "bendahara", password: "bendahara123", role: "bendahara" },
      { id: "usr_ketua", name: "ketua", password: "ketua123", role: "ketua" },
      { id: "usr_wali", name: "wali", password: "wali123", role: "wali" },
    ],
  })

  const studentData = students.map((name, i) => ({ name, classNumber: i + 1 }))
  await prisma.student.createMany({ data: studentData })
  const allStudents = await prisma.student.findMany()

  const categories = [
    { id: "inc_iuran", name: "Iuran", type: "pemasukan" },
    { id: "inc_lain", name: "Pemasukan Lain", type: "pemasukan" },
    { id: "exp_atk", name: "ATK", type: "pengeluaran" },
    { id: "exp_kegiatan", name: "Kegiatan", type: "pengeluaran" },
    { id: "exp_dekorasi", name: "Dekorasi", type: "pengeluaran" },
    { id: "exp_lain", name: "Pengeluaran Lain", type: "pengeluaran" },
  ]
  await prisma.category.createMany({ data: categories })

  const now = new Date()
  const periods = [
    { id: "w1", label: `Minggu 1`, startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: new Date(now.getFullYear(), now.getMonth(), 7) },
    { id: "w2", label: `Minggu 2`, startDate: new Date(now.getFullYear(), now.getMonth(), 8), endDate: new Date(now.getFullYear(), now.getMonth(), 14) },
    { id: "w3", label: `Minggu 3`, startDate: new Date(now.getFullYear(), now.getMonth(), 15), endDate: new Date(now.getFullYear(), now.getMonth(), 21) },
  ]
  await prisma.paymentPeriod.createMany({ data: periods })

  const iuran = 3000
  for (const student of allStudents) {
    for (const w of ["w1", "w2", "w3"]) {
      const paid = Math.random() > 0.35
      await prisma.payment.create({
        data: {
          studentId: student.id, periodId: w, amount: iuran,
          status: paid ? "LUNAS" : "BELUM",
          paidAt: paid ? new Date(now.getFullYear(), now.getMonth(), Math.floor(Math.random() * 21) + 1) : null,
        },
      })
    }
  }

  await prisma.transaction.create({
    data: { type: "pemasukan", amount: 50000, description: "Hasil jualan snack", categoryId: "inc_lain", date: new Date(now.getFullYear(), now.getMonth(), 10), userId: "usr_bendahara" },
  })

  const outcomes = [
    { amount: 45000, description: "Beli spidol whiteboard 3 pcs", categoryId: "exp_atk", date: new Date(now.getFullYear(), now.getMonth(), 3) },
    { amount: 25000, description: "Buku tulis 5 pcs", categoryId: "exp_atk", date: new Date(now.getFullYear(), now.getMonth(), 5) },
    { amount: 80000, description: "Snack rapat kelas", categoryId: "exp_kegiatan", date: new Date(now.getFullYear(), now.getMonth(), 8) },
    { amount: 60000, description: "Dekorasi ulang tahun kelas", categoryId: "exp_dekorasi", date: new Date(now.getFullYear(), now.getMonth(), 12) },
    { amount: 35000, description: "Kertas hvs 2 rim", categoryId: "exp_atk", date: new Date(now.getFullYear(), now.getMonth(), 15) },
  ]
  for (const o of outcomes) {
    await prisma.transaction.create({
      data: { ...o, type: "pengeluaran", userId: "usr_bendahara" },
    })
  }

  const totalPaid = await prisma.payment.count({ where: { status: "LUNAS" } })
  const totalOutcome = outcomes.reduce((s, o) => s + o.amount, 0)
  console.log(`✓ ${students.length} siswa, ${periods.length} periode, ${totalPaid} pembayaran, Rp${totalOutcome} pengeluaran`)
}

main().then(() => prisma.$disconnect())
