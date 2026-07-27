"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { LayoutDashboard, TrendingDown, TrendingUp, Users, LogOut, Wallet, FileText } from "lucide-react"

const menu = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Pengeluaran", icon: TrendingDown, href: "/outcome" },
  { label: "Pemasukan", icon: TrendingUp, href: "/income" },
  { label: "Status Bayar", icon: Users, href: "/status-bayar" },
  { label: "Laporan", icon: FileText, href: "/laporan" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-14 flex-col items-center border-r border-white/[0.06] bg-surface md:flex">
        <div className="flex h-14 items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-600/20">
            <Wallet size={14} className="text-white" />
          </div>
        </div>
        <nav className="mt-2 flex flex-1 flex-col items-center gap-0.5">
          {menu.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                  active
                    ? "bg-indigo-500/10 text-indigo-400"
                    : "text-gray-600 hover:bg-white/[0.04] hover:text-gray-400"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-indigo-500" />
                )}
                <item.icon size={18} />
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-white/[0.06] py-2">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Keluar"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:bg-white/[0.04] hover:text-red-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center border-t border-white/[0.06] bg-surface/95 backdrop-blur-lg md:hidden">
        {menu.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition-all duration-200 ${
                active ? "text-indigo-400" : "text-gray-500"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-indigo-500" />
              )}
              <item.icon size={20} />
              <span className="text-[9px] font-medium whitespace-nowrap tracking-wider uppercase">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 text-gray-500 transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="text-[9px] font-medium tracking-wider uppercase">Keluar</span>
        </button>
      </nav>
    </>
  )
}
