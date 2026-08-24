import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  type: z.enum(["pemasukan", "pengeluaran"]),
  amount: z.coerce.number().int().positive(),
  categoryId: z.string().min(1),
  description: z.string().max(500).optional().default(""),
  date: z.string().optional(),
})

const updateSchema = createSchema.partial()

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as { role?: string }).role !== "bendahara") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { type, amount, categoryId, description, date } = parsed.data
    const tx = await prisma.transaction.create({
      data: {
        type, amount, categoryId, description,
        date: date ? new Date(date) : new Date(),
        userId: (session.user as { id?: string }).id!,
      },
      include: { category: true },
    })
    return NextResponse.json(tx)
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 })
  }
}
