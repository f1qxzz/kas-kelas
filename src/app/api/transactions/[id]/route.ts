import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as { role?: string }).role !== "bendahara") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const { id } = await params
    const { type, amount, categoryId, description, date } = await req.json()
    const tx = await prisma.transaction.update({
      where: { id },
      data: {
        type, amount: parseInt(amount), categoryId,
        description: description || "",
        date: date ? new Date(date) : undefined,
      },
      include: { category: true },
    })
    return NextResponse.json(tx)
  } catch {
    return NextResponse.json({ error: "Gagal update" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as { role?: string }).role !== "bendahara") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const { id } = await params
    await prisma.transaction.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Gagal hapus" }, { status: 500 })
  }
}
