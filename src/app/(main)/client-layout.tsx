"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/Sidebar"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status !== "loading" && !session) router.push("/login")
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div suppressHydrationWarning className="flex h-screen items-center justify-center bg-surface">
        <div suppressHydrationWarning className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  if (!session) {
    if (typeof window !== "undefined") router.push("/login")
    return (
      <div suppressHydrationWarning className="flex h-screen items-center justify-center bg-surface">
        <div suppressHydrationWarning className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      <main className="p-4 md:ml-14 md:pr-8 md:py-6 max-md:pb-[68px]">
        {children}
      </main>
    </div>
  )
}
