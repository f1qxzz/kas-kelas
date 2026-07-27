import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as { role?: string }).role !== "bendahara") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { type, amount, categoryId, description, date } = await req.json()
    const tx = await prisma.transaction.create({
      data: {
        type,
        amount: parseInt(amount),
        categoryId,
        description: description || "",
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
