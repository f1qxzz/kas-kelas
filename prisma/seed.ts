import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const students = [
  "Aulia","Abel","Aurel","Aurora","Ayla","Kezia","Bilqis","Tata","Puri","Cheisia",
  "Destiana","Dhea","Dian","Cita","Fariha","Felita","Feodora","Fiorella","Gaudya","Kartika",
  "Kharisma","Lutfiana","Marsya","Khalisa","Rizkya","Rosiana","Sagita","Septiani","Shovi","Shyfa",
  "Talita","Tiara","Vinsensia","Vion","Yuda","Zeva",
]

const week1Paid = 36
const week2Paid = 36
const week3Paid = 32

async function main() {
  await prisma.payment.deleteMany()
  await prisma.paymentPeriod.deleteMany()
  await prisma.student.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  const hash = (pw: string) => bcrypt.hashSync(pw, 10)

  await prisma.user.createMany({
    data: [
      { id: "usr_bendahara", name: "bendahara", password: hash("bendahara123"), role: "bendahara" },
      { id: "usr_user", name: "user", password: hash("user123"), role: "user" },
      { id: "usr_wali", name: "wali", password: hash("wali123"), role: "wali" },
    ],
  })

  const categories = [
    { id: "inc_iuran", name: "Iuran", type: "pemasukan" },
    { id: "inc_lain", name: "Lainnya", type: "pemasukan" },
    { id: "exp_lain", name: "Lain-lain", type: "pengeluaran" },
  ]
  await prisma.category.createMany({ data: categories })

  const studentData = students.map((name, i) => ({ name, classNumber: i + 1 }))
  await prisma.student.createMany({ data: studentData })
  const allStudents = await prisma.student.findMany()

  const periods = [
    { id: "w1", label: "Minggu 1", startDate: new Date("2026-07-01"), endDate: new Date("2026-07-07") },
    { id: "w2", label: "Minggu 2", startDate: new Date("2026-07-08"), endDate: new Date("2026-07-14") },
    { id: "w3", label: "Minggu 3", startDate: new Date("2026-07-15"), endDate: new Date("2026-07-21") },
  ]
  await prisma.paymentPeriod.createMany({ data: periods })

  const iuran = 3000
  const week3Students = allStudents.slice(0, week3Paid)

  for (const student of allStudents) {
    await prisma.payment.create({
      data: { studentId: student.id, periodId: "w1", amount: iuran, status: "LUNAS", paidAt: new Date("2026-07-05") },
    })
    await prisma.payment.create({
      data: { studentId: student.id, periodId: "w2", amount: iuran, status: "LUNAS", paidAt: new Date("2026-07-12") },
    })
    if (week3Students.some(s => s.id === student.id)) {
      await prisma.payment.create({
        data: { studentId: student.id, periodId: "w3", amount: iuran, status: "LUNAS", paidAt: new Date("2026-07-19") },
      })
    } else {
      await prisma.payment.create({
        data: { studentId: student.id, periodId: "w3", amount: iuran, status: "BELUM" },
      })
    }
  }

  await prisma.transaction.create({
    data: { type: "pemasukan", amount: 108000, description: "Iuran kelas minggu 1 (36 siswa)", categoryId: "inc_iuran", date: new Date("2026-07-05"), userId: "usr_bendahara" },
  })
  await prisma.transaction.create({
    data: { type: "pemasukan", amount: 108000, description: "Iuran kelas minggu 2 (36 siswa)", categoryId: "inc_iuran", date: new Date("2026-07-12"), userId: "usr_bendahara" },
  })
  await prisma.transaction.create({
    data: { type: "pemasukan", amount: 96000, description: "Iuran kelas minggu 3 (32 siswa)", categoryId: "inc_iuran", date: new Date("2026-07-19"), userId: "usr_bendahara" },
  })

  const otherIncome = [
    { amount: 100000, description: "Donasi dari wali kelas", date: "2026-07-15" },
    { amount: 150000, description: "Hasil jualan snack kelas", date: "2026-07-12" },
    { amount: 50000, description: "Iuran tambahan acara kelas", date: "2026-07-08" },
    { amount: 200000, description: "Donasi orang tua siswa", date: "2026-07-10" },
    { amount: 167000, description: "Hasil jualan kue kelas", date: "2026-07-17" },
    { amount: 200000, description: "Iuran tambahan kelas", date: "2026-07-20" },
    { amount: 200000, description: "Donasi kelas", date: "2026-07-22" },
  ]
  for (const inc of otherIncome) {
    await prisma.transaction.create({
      data: { type: "pemasukan", amount: inc.amount, description: inc.description, categoryId: "inc_lain", date: new Date(inc.date), userId: "usr_bendahara" },
    })
  }

  const expenses = [
    { amount: 52950, description: "Beli sabun, tissue, masako, dll", date: "2026-07-02" },
    { amount: 12000, description: "Plastik", date: "2026-07-03" },
    { amount: 91600, description: "Obat-obatan", date: "2026-07-04" },
    { amount: 24000, description: "Buku kas kelas 12", date: "2026-07-05" },
    { amount: 4700, description: "Isi sabun cling", date: "2026-07-06" },
    { amount: 22900, description: "Saos & wadah", date: "2026-07-07" },
    { amount: 14000, description: "Baterai ABC", date: "2026-07-08" },
    { amount: 11075, description: "Beli wadah semprotan kaca", date: "2026-07-09" },
    { amount: 48000, description: "FC HVS BB", date: "2026-07-10" },
    { amount: 20000, description: "Thinner", date: "2026-07-11" },
    { amount: 17000, description: "Sapu 1", date: "2026-07-12" },
    { amount: 14500, description: "Saos 1kg", date: "2026-07-13" },
    { amount: 23500, description: "FC english", date: "2026-07-14" },
    { amount: 7000, description: "Tissue jolly 200 pcs", date: "2026-07-18" },
    { amount: 9500, description: "Tissue Vinda 320 pcs", date: "2026-07-19" },
    { amount: 50000, description: "Treat Gift (Dhea)", date: "2026-08-01" },
  ]
  for (const exp of expenses) {
    await prisma.transaction.create({
      data: { type: "pengeluaran", amount: exp.amount, description: exp.description, categoryId: "exp_lain", date: new Date(exp.date), userId: "usr_bendahara" },
    })
  }

  const totalIncome = 312000 + otherIncome.reduce((s, i) => s + i.amount, 0)
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0)
  const balance = totalIncome - totalExpense
  console.log(`✓ Seed complete:`)
  console.log(`  Siswa: ${students.length}`)
  console.log(`  Pemasukan: Rp ${totalIncome.toLocaleString("id-ID")}`)
  console.log(`  Pengeluaran: Rp ${totalExpense.toLocaleString("id-ID")}`)
  console.log(`  Saldo: Rp ${balance.toLocaleString("id-ID")}`)
}

main().then(() => prisma.$disconnect())
