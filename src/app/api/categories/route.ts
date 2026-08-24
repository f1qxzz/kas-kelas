import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  type: z.enum(["pemasukan", "pengeluaran"]),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const categories = await prisma.category.findMany()
  return NextResponse.json(categories)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "bendahara")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid" }, { status: 400 })
    }
    const cat = await prisma.category.create({ data: parsed.data })
    return NextResponse.json(cat)
  } catch {
    return NextResponse.json({ error: "Gagal membuat kategori" }, { status: 500 })
  }
}
