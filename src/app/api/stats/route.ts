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
  const dayAgo = new Date(now.getTime() - 7 * 86400000)

  const [paidPayments, monthPayments, outcomeTxns, monthOutcomeTxns, incomeTxns, monthIncomeTxns] = await Promise.all([
    prisma.payment.findMany({ where: { status: "LUNAS", paidAt: { gte: dayAgo } }, select: { amount: true, paidAt: true } }),
    prisma.payment.findMany({ where: { status: "LUNAS", paidAt: { gte: startOfMonth } }, select: { amount: true, paidAt: true } }),
    prisma.transaction.findMany({ where: { type: "pengeluaran", date: { gte: dayAgo } }, select: { amount: true, date: true } }),
    prisma.transaction.findMany({ where: { type: "pengeluaran", date: { gte: startOfMonth } }, select: { amount: true, date: true } }),
    prisma.transaction.findMany({ where: { type: "pemasukan", date: { gte: dayAgo } }, select: { amount: true, date: true } }),
    prisma.transaction.findMany({ where: { type: "pemasukan", date: { gte: startOfMonth } }, select: { amount: true, date: true } }),
  ])

  // Total saldo: use aggregate for all-time
  const [totalPaid, totalIncome, totalOutcome] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "LUNAS" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "pemasukan" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { type: "pengeluaran" }, _sum: { amount: true } }),
  ])

  const saldo = (totalPaid._sum.amount ?? 0) + (totalIncome._sum.amount ?? 0) - (totalOutcome._sum.amount ?? 0)

  const monthIuran = monthPayments.reduce((s, p) => s + p.amount, 0)
  const monthLain = monthIncomeTxns.reduce((s, t) => s + t.amount, 0)
  const monthIncome = monthIuran + monthLain
  const monthOutcome = monthOutcomeTxns.reduce((s, t) => s + t.amount, 0)

  // Last 7 days chart
  const last7: { date: string; income: number; outcome: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const dayEnd = new Date(dayStart.getTime() + 86400000)
    const dayIncome = paidPayments.filter((p) => p.paidAt! >= dayStart && p.paidAt! < dayEnd).reduce((s, p) => s + p.amount, 0)
      + incomeTxns.filter((t) => t.date >= dayStart && t.date < dayEnd).reduce((s, t) => s + t.amount, 0)
    const dayOutcome = outcomeTxns.filter((t) => t.date >= dayStart && t.date < dayEnd).reduce((s, t) => s + t.amount, 0)
    last7.push({ date: d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric" }), income: dayIncome, outcome: dayOutcome })
  }

  const allDates = [...paidPayments.map((p) => p.paidAt!), ...incomeTxns.map((t) => t.date), ...outcomeTxns.map((t) => t.date)]
  const lastUpdated = allDates.length > 0 ? new Date(Math.max(...allDates.map((d) => d.getTime()))).toISOString() : now.toISOString()

  return NextResponse.json({ saldo, month: { income: monthIncome, outcome: monthOutcome }, chart: last7, lastUpdated, monthIncomeBreakdown: { iuran: monthIuran, lainnya: monthLain } })
}
