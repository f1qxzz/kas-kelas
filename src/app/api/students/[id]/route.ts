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
    const { name, isActive } = await req.json()
    const student = await prisma.student.update({
      where: { id },
      data: { ...(name && { name }), ...(isActive !== undefined && { isActive }) },
    })
    return NextResponse.json(student)
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
    await prisma.student.update({ where: { id }, data: { isActive: false } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Gagal nonaktifkan" }, { status: 500 })
  }
}
