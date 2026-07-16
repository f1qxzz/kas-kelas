import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const userSelect = { select: { id: true, name: true, role: true } }

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get("categoryId")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const search = searchParams.get("search")

  const where: Record<string, unknown> = {}
  if (categoryId) where.categoryId = categoryId
  if (startDate) where.date = { ...(where.date as object || {}), gte: new Date(startDate) }
  if (endDate) where.date = { ...(where.date as object || {}), lte: new Date(endDate) }
  if (search) where.description = { contains: search }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true, user: userSelect },
    orderBy: { date: "desc" },
  })
  return NextResponse.json(transactions)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as { role?: string }).role !== "bendahara") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { type, amount, categoryId, description, date } = await req.json()
    const tx = await prisma.transaction.create({
      data: {
        type,
        amount: parseInt(amount),
        categoryId,
        description: description || "",
        date: date ? new Date(date) : new Date(),
        userId: (session.user as { id?: string }).id!,
      },
      include: { category: true, user: userSelect },
    })
    return NextResponse.json(tx)
  } catch (e) {
    return NextResponse.json({ error: "Gagal menyimpan transaksi" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as { role?: string }).role !== "bendahara") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  try {
    await prisma.transaction.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 })
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as { role?: string }).role !== "bendahara") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { id, type, amount, categoryId, description, date } = await req.json()
    const tx = await prisma.transaction.update({
      where: { id },
      data: {
        type,
        amount: parseInt(amount),
        categoryId,
        description: description || "",
        date: date ? new Date(date) : new Date(),
      },
      include: { category: true },
    })
    return NextResponse.json(tx)
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate transaksi" }, { status: 500 })
  }
}
