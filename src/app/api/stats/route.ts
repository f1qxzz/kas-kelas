import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [payments, outcomeTxns, incomeTxns] = await Promise.all([
    prisma.payment.findMany({ where: { status: "LUNAS" }, select: { amount: true, paidAt: true } }),
    prisma.transaction.findMany({ where: { type: "pengeluaran" }, select: { amount: true, date: true } }),
    prisma.transaction.findMany({ where: { type: "pemasukan" }, select: { amount: true, date: true } }),
  ])

  const payTotal = (p: { amount: number }) => p.amount

  const totalIncome = payments.reduce((s, p) => s + payTotal(p), 0) + incomeTxns.reduce((s, t) => s + t.amount, 0)
  const totalOutcome = outcomeTxns.reduce((s, t) => s + t.amount, 0)
  const saldo = totalIncome - totalOutcome

  const monthIuran = payments.filter((p) => p.paidAt && p.paidAt >= startOfMonth).reduce((s, p) => s + payTotal(p), 0)
  const monthLain = incomeTxns.filter((t) => t.date >= startOfMonth).reduce((s, t) => s + t.amount, 0)
  const monthIncome = monthIuran + monthLain
  const monthOutcome = outcomeTxns.filter((t) => t.date >= startOfMonth).reduce((s, t) => s + t.amount, 0)

  const yearIncome = payments.filter((p) => p.paidAt && p.paidAt >= startOfYear).reduce((s, p) => s + payTotal(p), 0)
    + incomeTxns.filter((t) => t.date >= startOfYear).reduce((s, t) => s + t.amount, 0)
  const yearOutcome = outcomeTxns.filter((t) => t.date >= startOfYear).reduce((s, t) => s + t.amount, 0)

  const last7: { date: string; income: number; outcome: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const dayEnd = new Date(dayStart.getTime() + 86400000)
    const dayIncome = payments.filter((p) => p.paidAt && p.paidAt >= dayStart && p.paidAt < dayEnd).reduce((s, p) => s + payTotal(p), 0)
      + incomeTxns.filter((t) => t.date >= dayStart && t.date < dayEnd).reduce((s, t) => s + t.amount, 0)
    const dayOutcome = outcomeTxns.filter((t) => t.date >= dayStart && t.date < dayEnd).reduce((s, t) => s + t.amount, 0)
    last7.push({ date: d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric" }), income: dayIncome, outcome: dayOutcome })
  }

  const allDates = [...payments.filter((p) => p.paidAt).map((p) => p.paidAt!), ...incomeTxns.map((t) => t.date), ...outcomeTxns.map((t) => t.date)]
  const lastUpdated = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => d.getTime()))).toISOString() : now.toISOString()

  return NextResponse.json({ saldo, month: { income: monthIncome, outcome: monthOutcome }, year: { income: yearIncome, outcome: yearOutcome }, chart: last7, lastUpdated, monthIncomeBreakdown: { iuran: monthIuran, lainnya: monthLain } })
}
