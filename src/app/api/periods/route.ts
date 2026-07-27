import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
const IURAN = 3000

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const periods = await prisma.paymentPeriod.findMany({ orderBy: { startDate: "desc" } })
  return NextResponse.json(periods)
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as { role?: string }).role !== "bendahara") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const last = await prisma.paymentPeriod.findFirst({ orderBy: { startDate: "desc" } })
  const lastEnd = last?.endDate || new Date()
  const weekNum = last ? parseInt(last.label.replace(/\D/g, "")) + 1 : 1
  const startDate = new Date(lastEnd.getTime() + 86400000)
  const endDate = new Date(startDate.getTime() + 6 * 86400000)

  const period = await prisma.paymentPeriod.create({
    data: { label: `Minggu ${weekNum}`, startDate, endDate },
  })

  const students = await prisma.student.findMany({ where: { isActive: true } })

  await prisma.payment.createMany({
    data: students.map((s) => ({
      studentId: s.id, periodId: period.id,
      amount: IURAN, status: "BELUM",
    })),
  })

  return NextResponse.json(period)
}
