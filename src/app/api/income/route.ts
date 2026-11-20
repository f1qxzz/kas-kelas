import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 30

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || (role !== "bendahara" && role !== "wali")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const periodId = req.nextUrl.searchParams.get("periodId")

  const [periods, payments, incomeTxns] = await Promise.all([
    prisma.paymentPeriod.findMany({ select: { id: true, label: true, startDate: true }, orderBy: { startDate: "asc" } }),
    prisma.payment.findMany({
      where: { status: "LUNAS" },
      select: { amount: true, paidAt: true, student: { select: { name: true } }, period: { select: { id: true, label: true, startDate: true } } },
      orderBy: { paidAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: { type: "pemasukan" },
      select: { id: true, amount: true, categoryId: true, date: true, description: true, category: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
    }),
  ])

  const totalIuran = payments.reduce((s, p) => s + p.amount, 0)
  const totalNonIuran = incomeTxns.reduce((s, t) => s + t.amount, 0)

  let filteredPayments = payments
  if (periodId) {
    filteredPayments = payments.filter((p) => p.period.id === periodId)
  }

  const paymentsByPeriod = new Map<string, { label: string; items: typeof filteredPayments; total: number }>()
  for (const p of filteredPayments) {
    if (!p.paidAt) continue
    const pid = p.period.id
    if (!paymentsByPeriod.has(pid)) {
      paymentsByPeriod.set(pid, { label: p.period.label, items: [], total: 0 })
    }
    const w = paymentsByPeriod.get(pid)!
    w.items.push(p)
    w.total += p.amount
  }

  return NextResponse.json(
    {
      periods,
      selectedIuran: periodId
        ? paymentsByPeriod.get(periodId) || null
        : (paymentsByPeriod.values().next().value || null),
      nonIuranIncome: incomeTxns,
      totalIncome: totalIuran + totalNonIuran,
    },
    { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } }
  )
}