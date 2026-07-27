import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const periodId = req.nextUrl.searchParams.get("periodId")

  const periods = await prisma.paymentPeriod.findMany({ orderBy: { startDate: "asc" } })

  let payments = await prisma.payment.findMany({
    where: { status: "LUNAS" },
    include: { student: { select: { name: true } }, period: { select: { id: true, label: true, startDate: true } } },
    orderBy: { paidAt: "desc" },
  })

  const incomeTxns = await prisma.transaction.findMany({
    where: { type: "pemasukan" },
    include: { category: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  })

  const payTotal = (p: { amount: number }) => p.amount

  const totalIuran = payments.reduce((s, p) => s + payTotal(p), 0)
  const totalNonIuran = incomeTxns.reduce((s, t) => s + t.amount, 0)

  if (periodId) {
    payments = payments.filter((p) => p.period.id === periodId)
  }

  const paymentsByPeriod = new Map<string, { label: string; items: typeof payments; total: number }>()
  for (const p of payments) {
    if (!p.paidAt) continue
    const pid = p.period.id
    if (!paymentsByPeriod.has(pid)) {
      paymentsByPeriod.set(pid, { label: p.period.label, items: [], total: 0 })
    }
    const w = paymentsByPeriod.get(pid)!
    w.items.push(p)
    w.total += payTotal(p)
  }

  return NextResponse.json({
    periods,
    selectedIuran: periodId
      ? paymentsByPeriod.get(periodId) || null
      : (paymentsByPeriod.values().next().value || null),
    nonIuranIncome: incomeTxns,
    totalIncome: totalIuran + totalNonIuran,
  })
}
