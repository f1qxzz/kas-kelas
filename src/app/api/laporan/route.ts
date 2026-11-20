import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || (role !== "bendahara" && role !== "wali")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [payments, incomeTxns, outcomeTxns, periods, categories, studentStats] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "LUNAS" },
      select: { amount: true, studentId: true, periodId: true, paidAt: true },
      orderBy: { paidAt: "asc" },
    }),
    prisma.transaction.findMany({
      where: { type: "pemasukan" },
      select: { amount: true, categoryId: true, date: true, category: { select: { name: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.transaction.findMany({
      where: { type: "pengeluaran" },
      select: { id: true, amount: true, categoryId: true, date: true, description: true, category: { select: { name: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.paymentPeriod.findMany({ select: { id: true, label: true, startDate: true }, orderBy: { startDate: "asc" } }),
    prisma.category.findMany({ select: { id: true, name: true, type: true } }),
    prisma.student.aggregate({
      _count: { _all: true, isActive: true },
      where: { isActive: true },
    }),
  ])

  const incomeFromIuran = payments.reduce((s, p) => s + p.amount, 0)
  const incomeFromOther = incomeTxns.reduce((s, t) => s + t.amount, 0)
  const totalIncome = incomeFromIuran + incomeFromOther
  const totalOutcome = outcomeTxns.reduce((s, t) => s + t.amount, 0)
  const saldo = totalIncome - totalOutcome

  const periodMap = new Map(periods.map((p) => [p.id, p]))
  const incomeByPeriod = periods.map((p) => {
    const pms = payments.filter((pm) => pm.periodId === p.id)
    return { label: p.label, total: pms.reduce((s, pm) => s + pm.amount, 0), count: pms.length }
  })

  const outcomeByCategory = categories
    .filter((c) => c.type === "pengeluaran")
    .map((c) => {
      const txns = outcomeTxns.filter((t) => t.categoryId === c.id)
      return { category: c.name, total: txns.reduce((s, t) => s + t.amount, 0), count: txns.length }
    })

  const outcomeByMonth: { label: string; total: number; items: { id: string; description: string | null; amount: number; date: Date; category: { name: string } }[] }[] = []
  for (const t of outcomeTxns) {
    const key = `${t.date.getFullYear()}-${t.date.getMonth()}`
    let bucket = outcomeByMonth.find((b) => `${b.items[0]?.date.getFullYear()}-${b.items[0]?.date.getMonth()}` === key)
    if (!bucket) {
      const d = new Date(t.date.getFullYear(), t.date.getMonth())
      bucket = {
        label: d.toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
        total: 0,
        items: [],
      }
      outcomeByMonth.push(bucket)
    }
    bucket.items.push({ id: t.id, description: t.description, amount: t.amount, date: t.date, category: t.category as { name: string } })
    bucket.total += t.amount
  }

  const totalStudents = await prisma.student.count()
  const activeStudents = studentStats._count.isActive
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