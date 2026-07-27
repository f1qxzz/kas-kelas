import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth()))
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))

  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  const transactions = await prisma.transaction.findMany({
    where: { type: "pengeluaran", date: { gte: start, lte: end } },
    include: { category: { select: { name: true } } },
    orderBy: { date: "desc" },
  })

  const totalBulanIni = transactions.reduce((s, t) => s + t.amount, 0)

  return NextResponse.json({ transactions, totalBulanIni })
}
