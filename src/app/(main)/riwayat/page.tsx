"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { TrendingUp, TrendingDown, Pencil, Trash2, Search, Repeat } from "lucide-react"
import { useSession } from "next-auth/react"
import { ModalTransaksi } from "@/components/ModalTransaksi"

interface Transaction {
  id: string; type: string; amount: number; description: string; date: string
  category: { id: string; name: string; type: string }; user: { name: string }
}
interface Category { id: string; name: string; type: string }

function rupiah(n: number) {
  return "Rp " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export default function RiwayatPage() {
  const [txns, setTxns] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [search, setSearch] = useState("")
  const [modal, setModal] = useState(false)
  const [editTx, setEditTx] = useState<{
    id: string; type: string; amount: number; categoryId: string; description: string; date: string
  } | null>(null)
  const [page, setPage] = useState(1)
  const perPage = 15
  const { data: session } = useSession()
  const isBendahara = (session?.user as { role?: string })?.role === "bendahara"

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (categoryId) params.set("categoryId", categoryId)
    if (startDate) params.set("startDate", startDate)
    if (endDate) params.set("endDate", endDate)
    if (search) params.set("search", search)
    const [t, s] = await Promise.all([
      fetch(`/api/transactions?${params}`).then((r) => r.json()),
      fetch("/api/transactions/stats").then((r) => r.json()),
    ])
    setTxns(t); setCategories(s.categories); setPage(1)
  }, [categoryId, startDate, endDate, search])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    if (!confirm("Hapus transaksi ini?")) return
    const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" })
    if (!res.ok) { alert("Gagal menghapus transaksi"); return }
    load()
  }

  const paginated = txns.slice(0, page * perPage)
  const hasMore = txns.length > page * perPage

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">Riwayat</h1>
        <p className="mt-0.5 text-sm text-gray-500">Semua transaksi kas kelas</p>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2 md:gap-3">
          <div className="relative min-w-[180px] flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
              placeholder="Cari keterangan..."
            />
          </div>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field w-auto min-w-[130px]">
            <option value="">Semua kategori</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field w-auto" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field w-auto" />
        </div>
      </div>

      {/* Desktop */}
      <div className="card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="p-4 font-medium">Tanggal</th>
                <th className="p-4 font-medium">Jenis</th>
                <th className="p-4 font-medium">Kategori</th>
                <th className="p-4 font-medium">Keterangan</th>
                <th className="p-4 text-right font-medium">Jumlah</th>
                <th className="p-4 font-medium">Oleh</th>
                {isBendahara && <th className="w-20 p-4 font-medium">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={isBendahara ? 7 : 6} className="p-16 text-center text-gray-600">
                    <Repeat size={22} className="mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">Belum ada transaksi</p>
                  </td>
                </tr>
              ) : paginated.map((tx, i) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.01 * i }}
                  className="table-cell border-0 transition-colors hover:bg-white/[0.02]"
                >
                  <td className="p-4 tabular text-gray-300">{new Date(tx.date).toLocaleDateString("id-ID")}</td>
                  <td className="p-4">
                    <span className={tx.type === "pemasukan" ? "tag-income" : "tag-expense"}>
                      {tx.type === "pemasukan" ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                      {tx.type === "pemasukan" ? "Masuk" : "Keluar"}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{tx.category.name}</td>
                  <td className="max-w-[200px] truncate p-4 text-gray-600">{tx.description || "—"}</td>
                  <td className={`p-4 text-right font-semibold tabular ${tx.type === "pemasukan" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.type === "pemasukan" ? "+" : "-"}{rupiah(tx.amount)}
                  </td>
                  <td className="p-4 text-xs text-gray-600">{tx.user.name}</td>
                  {isBendahara && (
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditTx({ ...tx, categoryId: tx.category.id } as any); setModal(true) }} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-indigo-400">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(tx.id)} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-red-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasMore && (
          <div className="border-t border-white/[0.06] p-4 text-center">
            <button onClick={() => setPage((p) => p + 1)} className="btn-ghost text-xs">
              Tampilkan lebih banyak ({txns.length - page * perPage} tersisa)
            </button>
          </div>
        )}
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {paginated.length === 0 ? (
          <div className="card py-16 text-center">
            <Repeat size={22} className="mx-auto mb-2 text-gray-600" />
            <p className="text-sm text-gray-600">Belum ada transaksi</p>
          </div>
        ) : paginated.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 * i }}
            className="card p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">
                {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <span className={tx.type === "pemasukan" ? "tag-income" : "tag-expense"}>
                {tx.type === "pemasukan" ? "Masuk" : "Keluar"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-200">{tx.category.name}</p>
                <p className="text-xs text-gray-600">{tx.description || tx.user.name}</p>
              </div>
              <p className={`text-base font-bold tabular ${tx.type === "pemasukan" ? "text-emerald-400" : "text-red-400"}`}>
                {tx.type === "pemasukan" ? "+" : "-"}{rupiah(tx.amount)}
              </p>
            </div>
            {isBendahara && (
              <div className="flex gap-2 border-t border-white/[0.06] pt-3">
                <button onClick={() => { setEditTx({ ...tx, categoryId: tx.category.id } as any); setModal(true) }} className="btn-ghost flex-1 py-2 text-xs">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => handleDelete(tx.id)} className="btn-ghost flex-1 py-2 text-xs hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 size={13} /> Hapus
                </button>
              </div>
            )}
          </motion.div>
        ))}
        {hasMore && (
          <button onClick={() => setPage((p) => p + 1)} className="btn-ghost w-full py-3 text-xs">
            Tampilkan lebih banyak ({txns.length - page * perPage} tersisa)
          </button>
        )}
      </div>

      <ModalTransaksi open={modal} onClose={() => { setModal(false); setEditTx(null) }} onSaved={load} editData={editTx} />
    </div>
  )
}
