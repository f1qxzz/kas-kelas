import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const dynamic = "force-dynamic"

const paymentSchema = z.object({
  studentId: z.string().min(1),
  periodId: z.string().min(1),
  amount: z.coerce.number().int().positive(),
  status: z.enum(["LUNAS", "BELUM"]),
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const periodId = searchParams.get("periodId")
  if (!periodId) return NextResponse.json({ error: "periodId required" }, { status: 400 })

  const [students, payments, period] = await Promise.all([
    prisma.student.findMany({ orderBy: { classNumber: "asc" } }),
    prisma.payment.findMany({ where: { periodId } }),
    prisma.paymentPeriod.findUnique({ where: { id: periodId } }),
  ])

  const statusMap = new Map(payments.map((p) => [p.studentId, p]))

  const data = students.map((s) => ({
    id: s.id,
    name: s.name,
    classNumber: s.classNumber,
    isActive: s.isActive,
    payment: statusMap.get(s.id) ? { ...statusMap.get(s.id)!, paidAt: statusMap.get(s.id)!.paidAt?.toISOString() } : null,
  }))

  return NextResponse.json({ data, period })
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as { role?: string }).role !== "bendahara") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const parsed = paymentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Input tidak valid" }, { status: 400 })
    }
    const { studentId, periodId, amount, status } = parsed.data

    const existing = await prisma.payment.findUnique({ where: { studentId_periodId: { studentId, periodId } } })

    if (existing) {
      const updated = await prisma.payment.update({
        where: { id: existing.id },
        data: { amount: status === "LUNAS" ? amount : existing.amount, status, paidAt: status === "LUNAS" ? new Date() : null },
      })
      return NextResponse.json(updated)
    }

    const created = await prisma.payment.create({
      data: { studentId, periodId, amount, status: "LUNAS", paidAt: new Date() },
    })
    return NextResponse.json(created)
  } catch {
    return NextResponse.json({ error: "Gagal update pembayaran" }, { status: 500 })
  }
}
