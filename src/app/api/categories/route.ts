import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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

  const { name, type } = await req.json()
  if (!name || !type) return NextResponse.json({ error: "name and type required" }, { status: 400 })

  try {
    const cat = await prisma.category.create({ data: { name, type } })
    return NextResponse.json(cat)
  } catch {
    return NextResponse.json({ error: "Gagal membuat kategori" }, { status: 500 })
  }
}
