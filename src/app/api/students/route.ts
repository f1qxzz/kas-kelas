import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const dynamic = "force-dynamic"

const createSchema = z.object({
  name: z.string().min(1).max(100).trim(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const students = await prisma.student.findMany({ orderBy: { classNumber: "asc" } })
  return NextResponse.json(students)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as { role?: string }).role !== "bendahara") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Nama harus diisi" }, { status: 400 })
    }
    const last = await prisma.student.findFirst({ orderBy: { classNumber: "desc" } })
    const student = await prisma.student.create({
      data: { name: parsed.data.name, classNumber: (last?.classNumber || 0) + 1 },
    })
    return NextResponse.json(student)
  } catch {
    return NextResponse.json({ error: "Gagal tambah siswa" }, { status: 500 })
  }
}
