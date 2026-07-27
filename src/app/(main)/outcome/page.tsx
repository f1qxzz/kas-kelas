"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { TrendingDown, ArrowLeft, ArrowRight, Plus, Pencil, Trash2, AlertCircle } from "lucide-react"
import { ModalTransaksi } from "@/components/ModalTransaksi"
import { useSession } from "next-auth/react"

function rupiah(n: number) {
  return "Rp " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.04] ${className || ""}`} />
}

const catColors: Record<string, string> = {
  "Konsumsi": "bg-orange-500/10 text-orange-400",
  "Alat Tulis": "bg-blue-500/10 text-blue-400",
  "Dokumen": "bg-purple-500/10 text-purple-400",
  "Lainnya": "bg-gray-500/10 text-gray-400",
}

interface Tx {
  id: string; amount: number; description: string; date: string; type: string
  category: { id: string; name: string }
}

export default function OutcomePage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())
  const [txns, setTxns] = useState<Tx[]>([])
  const [total, setTotal] = useState(0)
  const [saldo, setSaldo] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editData, setEditData] = useState<Tx | null>(null)
  const [toast, setToast] = useState<{ msg: string } | null>(null)
  const [actionLabel, setActionLabel] = useState("")
  const { data: session } = useSession()
  const isBendahara = (session?.user as { role?: string })?.role === "bendahara"

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2500); return () => clearTimeout(t) }, [toast])
  useEffect(() => { fetch("/api/stats").then((r) => r.json()).then((d) => setSaldo(d.saldo)) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/outcome?month=${month}&year=${year}`)
    if (res.ok) {
      const d = await res.json()
      setTxns(d.transactions)
      setTotal(d.totalBulanIni)
    }
    setLoading(false)
  }, [month, year])

  useEffect(() => { load() }, [load])

  const monthLabel = new Date(year, month).toLocaleDateString("id-ID", { month: "long", year: "numeric" })

  function prev() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  function next() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  async function hapus(id: string) {
    if (!confirm("Hapus transaksi ini?")) return
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
    if (!res.ok) return alert("Gagal menghapus transaksi")
    load()
    setToast({ msg: "Transaksi berhasil dihapus" })
  }

  function openModal(tx: Tx | null, label: string) {
    setEditData(tx)
    setActionLabel(label)
    setModal(true)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-start justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Pengeluaran</h1>
          <p className="mt-0.5 text-sm text-gray-500">Riwayat pengeluaran kas kelas</p>
        </div>
        {isBendahara && (
          <button onClick={() => openModal(null, "ditambahkan")} className="btn-primary text-xs gap-1.5">
            <Plus size={14} /> Tambah
          </button>
        )}
      </motion.div>

      {saldo !== null && saldo < 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <p className="text-xs text-red-300">Kas menunggak <span className="font-semibold">{rupiah(Math.abs(saldo))}</span>. Segera tagih iuran yg belum dibayar.</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <TrendingDown size={17} className="text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Pengeluaran</p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-28" />
              ) : (
                <p className={`text-xl font-bold tabular md:text-2xl ${total > 0 ? "text-red-400" : "text-gray-600"}`}>
                  {rupiah(total)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prev} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-indigo-400">
              <ArrowLeft size={16} />
            </button>
            <span className="min-w-[140px] text-center text-sm font-medium text-gray-300">{monthLabel}</span>
            <button onClick={next} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-indigo-400">
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card hidden overflow-hidden md:block"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="p-3 pl-5 font-medium">Tanggal</th>
                <th className="p-3 font-medium">Kategori</th>
                <th className="p-3 font-medium">Keterangan</th>
                <th className="p-3 pr-5 text-right font-medium">Nominal</th>
                {isBendahara && <th className="p-3 w-20" />}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-3 pl-5"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="p-3 pr-5"><Skeleton className="ml-auto h-4 w-16" /></td>
                    {isBendahara && <td className="p-3" />}
                  </tr>
                ))
              ) : txns.length === 0 ? (
                <tr><td colSpan={isBendahara ? 5 : 4} className="p-12 text-center text-sm text-gray-600">Belum ada pengeluaran bulan ini</td></tr>
              ) : txns.map((tx, i) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.01 * i }}
                  className="transition-colors hover:bg-white/[0.02]"
                >
                  <td className="p-3 pl-5 tabular text-gray-300">{new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${catColors[tx.category.name] || "bg-gray-500/10 text-gray-400"}`}>
                      {tx.category.name}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{tx.description || "—"}</td>
                  <td className="p-3 pr-5 text-right font-semibold tabular text-red-400">-{rupiah(tx.amount)}</td>
                  {isBendahara && (
                    <td className="p-2">
                      <div className="flex gap-1">
                        <button onClick={() => openModal(tx, "diubah")} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-indigo-400">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => hapus(tx.id)} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="space-y-3 md:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          ))
        ) : txns.length === 0 ? (
          <div className="card py-12 text-center text-sm text-gray-600">Belum ada pengeluaran bulan ini</div>
        ) : txns.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 * i }}
            className="card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">{new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${catColors[tx.category.name] || "bg-gray-500/10 text-gray-400"}`}>
                {tx.category.name}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">{tx.description || "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold tabular text-red-400">-{rupiah(tx.amount)}</p>
                {isBendahara && (
                  <div className="flex flex-col gap-1">
                    <button onClick={() => openModal(tx, "diubah")} className="rounded-lg p-1 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-indigo-400">
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => hapus(tx.id)} className="rounded-lg p-1 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <ModalTransaksi open={modal} onClose={() => setModal(false)} onSaved={() => { load(); setToast({ msg: `Transaksi berhasil ${actionLabel}` }) }} defaultType="pengeluaran" editData={editData ? { id: editData.id, type: editData.type, amount: editData.amount, categoryId: editData.category.id, description: editData.description, date: editData.date } : null} />

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/20"
        >
          {toast.msg}
        </motion.div>
      )}
    </div>
  )
}
