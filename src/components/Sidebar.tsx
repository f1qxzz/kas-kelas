"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Repeat, FileText, LogOut, Wallet } from "lucide-react"

const menu = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Riwayat", icon: Repeat, href: "/riwayat" },
  { label: "Laporan", icon: FileText, href: "/laporan" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-14 flex-col items-center border-r border-white/[0.06] bg-surface/80 backdrop-blur-xl md:flex">
        <div className="flex h-13 items-center pt-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-600/20">
            <Wallet size={14} className="text-white" />
          </div>
        </div>
        <nav className="mt-6 flex flex-1 flex-col items-center gap-1">
          {menu.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-indigo-500/10 text-indigo-400 shadow-sm shadow-indigo-500/10"
                    : "text-gray-600 hover:bg-white/[0.04] hover:text-gray-400"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-indigo-500" />
                )}
                <item.icon size={17} />
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-white/[0.06] py-2">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:bg-white/[0.04] hover:text-red-400"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/[0.06] bg-surface/90 backdrop-blur-xl px-1 py-1.5 md:hidden">
        {menu.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-5 py-2 transition-all duration-200 ${
                active ? "bg-indigo-500/10 text-indigo-400" : "text-gray-600"
              }`}
            >
              <item.icon size={18} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-col items-center gap-0.5 rounded-xl px-5 py-2 text-gray-600 transition-all duration-200 hover:text-red-400"
        >
          <LogOut size={18} />
          <span className="text-[10px] font-medium">Keluar</span>
        </button>
      </nav>
    </>
  )
}
