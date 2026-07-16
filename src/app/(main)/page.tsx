"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { TrendingUp, TrendingDown, Plus, Wallet, Pencil, Trash2 } from "lucide-react"
import { useSession } from "next-auth/react"
import { ModalTransaksi } from "@/components/ModalTransaksi"

interface Transaction {
  id: string; type: string; amount: number; description: string; date: string
  category: { id: string; name: string; type: string }; user: { name: string }
}

interface Stats {
  saldo: number
  month: { pemasukan: number; pengeluaran: number }
}

function rupiah(n: number) {
  return "Rp " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recent, setRecent] = useState<Transaction[]>([])
  const [modal, setModal] = useState(false)
  const [editTx, setEditTx] = useState<{
    id: string; type: string; amount: number; categoryId: string; description: string; date: string
  } | null>(null)
  const { data: session } = useSession()
  const role = (session?.user as { role?: string })?.role
  const isBendahara = role === "bendahara"

  const load = useCallback(async () => {
    const [s, t] = await Promise.all([
      fetch("/api/transactions/stats").then((r) => r.json()),
      fetch("/api/transactions").then((r) => r.json()),
    ])
    setStats(s)
    setRecent(t.slice(0, 5))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return
    const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" })
    if (!res.ok) { alert("Gagal menghapus transaksi"); return }
    load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">Ringkasan keuangan kelas</p>
        </div>
        {isBendahara && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { setEditTx(null); setModal(true) }}
            className="btn-primary"
          >
            <Plus size={15} />
            Tambah
          </motion.button>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-card via-card to-indigo-950/20 p-6"
      >
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-600/8 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-purple-600/8 blur-3xl" />
        <p className="relative text-xs font-medium uppercase tracking-widest text-gray-500">Saldo Saat Ini</p>
        <p className={`relative mt-2 text-4xl font-bold tracking-tight tabular ${stats && stats.saldo < 0 ? "text-red-400" : "text-emerald-400"}`}>
          {stats ? rupiah(stats.saldo) : <span className="text-gray-600">Memuat...</span>}
        </p>
        <div className="relative mt-3 flex items-center gap-4 text-xs text-gray-600">
          <span>Pemasukan bulan ini: <span className="text-emerald-400">{stats ? rupiah(stats.month.pemasukan) : "..."}</span></span>
          <span>Pengeluaran: <span className="text-red-400">{stats ? rupiah(stats.month.pengeluaran) : "..."}</span></span>
        </div>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Pemasukan Bulan Ini", value: stats?.month.pemasukan || 0, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Pengeluaran Bulan Ini", value: stats?.month.pengeluaran || 0, icon: TrendingDown, color: "text-red-400" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * (i + 1), ease: [0.22, 1, 0.36, 1] }}
            className="card p-5"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                i === 0 ? "bg-emerald-500/10" : "bg-red-500/10"
              }`}>
                <item.icon size={18} className={item.color} />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">{item.label}</p>
                <p className={`mt-0.5 text-xl font-bold tabular ${item.color}`}>
                  {stats ? rupiah(item.value) : <span className="text-gray-600">...</span>}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="card overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-sm font-semibold">Transaksi Terakhir</h2>
          <a href="/riwayat" className="text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300">
            Lihat Semua →
          </a>
        </div>

        {recent.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <Wallet size={28} className="text-gray-600" />
            <p className="mt-3 text-sm text-gray-500">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {recent.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }}
                className="group flex items-center justify-between px-5 py-3.5 transition-all duration-200 hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    tx.type === "pemasukan" ? "bg-emerald-500/10" : "bg-red-500/10"
                  }`}>
                    {tx.type === "pemasukan"
                      ? <TrendingUp size={14} className="text-emerald-400" />
                      : <TrendingDown size={14} className="text-red-400" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{tx.category.name}</p>
                    <p className="text-xs text-gray-600 truncate">
                      {tx.description || tx.user.name} · {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className={`text-sm font-semibold tabular ${
                    tx.type === "pemasukan" ? "text-emerald-400" : "text-red-400"
                  }`}>
                    {tx.type === "pemasukan" ? "+" : "-"}{rupiah(tx.amount)}
                  </p>
                  {isBendahara && (
                    <div className="flex opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <button onClick={() => { setEditTx({ ...tx, categoryId: tx.category.id } as any); setModal(true) }} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-indigo-400">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <ModalTransaksi open={modal} onClose={() => { setModal(false); setEditTx(null) }} onSaved={load} editData={editTx} />
    </div>
  )
}
