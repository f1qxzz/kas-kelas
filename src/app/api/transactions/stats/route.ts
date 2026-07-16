import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [allTxns, monthTxns, yearTxns, categories] = await Promise.all([
    prisma.transaction.findMany({ select: { type: true, amount: true } }),
    prisma.transaction.findMany({ where: { date: { gte: startOfMonth } }, select: { type: true, amount: true } }),
    prisma.transaction.findMany({ where: { date: { gte: startOfYear } }, select: { type: true, amount: true } }),
    prisma.category.findMany(),
  ])

  const sum = (txns: { type: string; amount: number }[]) => ({
    pemasukan: txns.filter((t) => t.type === "pemasukan").reduce((s, t) => s + t.amount, 0),
    pengeluaran: txns.filter((t) => t.type === "pengeluaran").reduce((s, t) => s + t.amount, 0),
  })

  const all = sum(allTxns)
  return NextResponse.json({
    saldo: all.pemasukan - all.pengeluaran,
    month: sum(monthTxns),
    year: sum(yearTxns),
    categories,
  })
}
