import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  type: z.enum(["pemasukan", "pengeluaran"]).optional(),
  amount: z.coerce.number().int().positive().optional(),
  categoryId: z.string().min(1).optional(),
  description: z.string().max(500).optional(),
  date: z.string().optional(),
})

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as { role?: string }).role !== "bendahara") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const data = parsed.data
    const tx = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        amount: data.amount !== undefined ? data.amount : undefined,
        date: data.date ? new Date(data.date) : undefined,
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
