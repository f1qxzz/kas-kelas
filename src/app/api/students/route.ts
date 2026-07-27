import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

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
    const { name } = await req.json()
    const last = await prisma.student.findFirst({ orderBy: { classNumber: "desc" } })
    const student = await prisma.student.create({
      data: { name, classNumber: (last?.classNumber || 0) + 1 },
    })
    return NextResponse.json(student)
  } catch {
    return NextResponse.json({ error: "Gagal tambah siswa" }, { status: 500 })
  }
}
