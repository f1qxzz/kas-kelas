import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 30

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const role = (session?.user as { role?: string } | undefined)?.role
  if (!session?.user || (role !== "bendahara" && role !== "wali")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth()))
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))

  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  const transactions = await prisma.transaction.findMany({
    where: { type: "pengeluaran", date: { gte: start, lte: end } },
    select: { id: true, amount: true, date: true, description: true, category: { select: { name: true } } },
    orderBy: { date: "desc" },
  })

  const totalBulanIni = transactions.reduce((s, t) => s + t.amount, 0)

  return NextResponse.json(
    { transactions, totalBulanIni },
    { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } }
  )
}