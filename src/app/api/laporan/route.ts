import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [payments, incomeTxns, outcomeTxns, periods, categories] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "LUNAS" },
      include: { student: { select: { name: true, classNumber: true, isActive: true } }, period: { select: { id: true, label: true, startDate: true } } },
      orderBy: { paidAt: "asc" },
    }),
    prisma.transaction.findMany({ where: { type: "pemasukan" }, include: { category: { select: { name: true } } }, orderBy: { date: "asc" } }),
    prisma.transaction.findMany({ where: { type: "pengeluaran" }, include: { category: { select: { name: true } } }, orderBy: { date: "asc" } }),
    prisma.paymentPeriod.findMany({ orderBy: { startDate: "asc" } }),
    prisma.category.findMany(),
  ])

  const incomeFromIuran = payments.reduce((s, p) => s + p.amount, 0)
  const incomeFromOther = incomeTxns.reduce((s, t) => s + t.amount, 0)
  const totalIncome = incomeFromIuran + incomeFromOther
  const totalOutcome = outcomeTxns.reduce((s, t) => s + t.amount, 0)
  const saldo = totalIncome - totalOutcome

  const incomeByPeriod = periods.map((p) => {
    const pms = payments.filter((pm) => pm.period.id === p.id)
    return { label: p.label, total: pms.reduce((s, pm) => s + pm.amount, 0), count: pms.length, items: pms }
  })

  const outcomeByCategory = categories.filter((c) => c.type === "pengeluaran").map((c) => {
    const txns = outcomeTxns.filter((t) => t.categoryId === c.id)
    return { category: c.name, total: txns.reduce((s, t) => s + t.amount, 0), count: txns.length, items: txns }
  })

  const outcomeByMonth: { month: number; year: number; label: string; total: number; items: typeof outcomeTxns }[] = []
  for (const t of outcomeTxns) {
    const key = `${t.date.getFullYear()}-${t.date.getMonth()}`
    let bucket = outcomeByMonth.find((b) => `${b.year}-${b.month}` === key)
    if (!bucket) {
      bucket = { month: t.date.getMonth(), year: t.date.getFullYear(), label: new Date(t.date.getFullYear(), t.date.getMonth()).toLocaleDateString("id-ID", { month: "long", year: "numeric" }), total: 0, items: [] }
      outcomeByMonth.push(bucket)
    }
    bucket.items.push(t)
    bucket.total += t.amount
  }

  const totalStudents = await prisma.student.count()
  const activeStudents = await prisma.student.count({ where: { isActive: true } })
  const totalPaymentsLunas = await prisma.payment.count({ where: { status: "LUNAS" } })
  const totalPaymentsBelum = await prisma.payment.count({ where: { status: "BELUM" } })

  return NextResponse.json({
    summary: { totalIncome, totalOutcome, saldo, incomeFromIuran, incomeFromOther },
    incomeByPeriod,
    outcomeByCategory,
    outcomeByMonth,
    periods,
    studentStats: { totalStudents, activeStudents, totalPaymentsLunas, totalPaymentsBelum },
  })
}
