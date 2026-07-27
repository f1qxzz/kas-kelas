"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { TrendingUp, Plus, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react"
import { ModalTransaksi } from "@/components/ModalTransaksi"
import { useSession } from "next-auth/react"

function rupiah(n: number) {
  return "Rp " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.04] ${className || ""}`} />
}

const catColors: Record<string, string> = {
  "Kas Harian": "bg-emerald-500/10 text-emerald-400",
  "Kas Kegiatan": "bg-blue-500/10 text-blue-400",
  "Kas Kebersihan": "bg-cyan-500/10 text-cyan-400",
  "Lain-lain": "bg-gray-500/10 text-gray-400",
}

interface IncomeTxn { id: string; amount: number; description: string; date: string; type: string; category: { id: string; name: string } }
interface PaymentItem { id: string; amount: number; paidAt: string; student: { name: string } }
interface Period { id: string; label: string }
interface WeekData { label: string; items: PaymentItem[]; total: number }

export default function IncomePage() {
  const [periods, setPeriods] = useState<Period[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [week, setWeek] = useState<WeekData | null>(null)
  const [other, setOther] = useState<IncomeTxn[]>([])
  const [total, setTotal] = useState(0)
  const [modal, setModal] = useState(false)
  const [editData, setEditData] = useState<IncomeTxn | null>(null)
  const [showOther, setShowOther] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string } | null>(null)
  const [actionLabel, setActionLabel] = useState("")
  const { data: session } = useSession()
  const isBendahara = (session?.user as { role?: string })?.role === "bendahara"

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const loadWeek = useCallback(async (pid: string) => {
    setLoading(true)
    const res = await fetch(`/api/income?periodId=${pid}`)
    if (res.ok) {
      const d = await res.json()
      setWeek(d.selectedIuran)
      setOther(d.nonIuranIncome)
      setTotal(d.totalIncome)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch("/api/income").then(async r => {
      if (!r.ok) return setLoading(false)
      const d = await r.json()
      setPeriods(d.periods)
      const idx = d.periods.length > 0 ? d.periods.length - 1 : 0
      setSelectedIdx(idx)
      if (d.periods.length > 0) loadWeek(d.periods[idx].id)
      else setLoading(false)
    })
  }, [loadWeek])

  function prev() {
    const i = Math.max(0, selectedIdx - 1)
    setSelectedIdx(i)
    loadWeek(periods[i].id)
  }
  function next() {
    const i = Math.min(periods.length - 1, selectedIdx + 1)
    setSelectedIdx(i)
    loadWeek(periods[i].id)
  }

  const isFirst = selectedIdx === 0
  const isLast = selectedIdx === periods.length - 1

  async function hapus(id: string) {
    if (!confirm("Hapus transaksi ini?")) return
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" })
    if (!res.ok) return alert("Gagal menghapus transaksi")
    if (periods.length > 0) loadWeek(periods[selectedIdx].id)
    setToast({ msg: "Transaksi berhasil dihapus" })
  }

  async function refresh() {
    if (periods.length > 0) loadWeek(periods[selectedIdx].id)
  }

  function openModal(edit: IncomeTxn | null, label: string) {
    setEditData(edit)
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
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Pemasukan</h1>
          <p className="mt-0.5 text-sm text-gray-500">Iuran per minggu</p>
        </div>
          {isBendahara && (
          <button onClick={() => openModal(null, "ditambahkan")} className="btn-primary text-xs gap-1.5">
            <Plus size={14} /> Tambah
          </button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-5"
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp size={17} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Pemasukan</p>
              {loading ? (
                <Skeleton className="mt-1 h-7 w-28" />
              ) : (
                <p className={`text-xl font-bold tabular md:text-2xl ${total > 0 ? "text-emerald-400" : "text-gray-600"}`}>
                  {rupiah(total)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prev} disabled={isFirst || loading} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed">
              <ArrowLeft size={16} />
            </button>
            <span className="min-w-[140px] text-center text-sm font-medium text-gray-300">
              {week?.label || "—"}
              <span className="ml-1 text-[11px] text-gray-600">({selectedIdx + 1}/{periods.length})</span>
            </span>
            <button onClick={next} disabled={isLast || loading} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed">
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
          <h3 className="text-sm font-semibold">{week?.label || "Iuran Minggu Ini"}</h3>
          {loading ? (
            <Skeleton className="h-5 w-20" />
          ) : week ? (
            <span className="text-sm font-semibold tabular text-emerald-400">+{rupiah(week.total)}</span>
          ) : null}
        </div>
        <div className="hidden md:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="p-3 pl-5 font-medium">Nama</th>
                <th className="p-3 font-medium">Tanggal</th>
                <th className="p-3 pr-5 text-right font-medium">Nominal</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-3 pl-5"><Skeleton className="h-4 w-24" /></td>
                    <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="p-3 pr-5"><Skeleton className="ml-auto h-4 w-16" /></td>
                  </tr>
                ))
              ) : week && week.items.length > 0 ? week.items.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.01 * i }}
                  className="transition-colors hover:bg-white/[0.02]"
                >
                  <td className="p-3 pl-5 text-gray-200">{p.student.name}</td>
                  <td className="p-3 text-xs text-gray-600">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("id-ID") : "—"}</td>
                  <td className="p-3 pr-5 text-right font-medium tabular text-emerald-400">+{rupiah(p.amount)}</td>
                </motion.tr>
              )) : (
                <tr><td colSpan={3} className="p-12 text-center text-sm text-gray-600">Belum ada pembayaran iuran minggu ini</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="divide-y divide-white/[0.03] md:hidden">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))
          ) : week && week.items.length > 0 ? week.items.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between px-5 py-3"
            >
              <div>
                <p className="text-sm text-gray-200">{p.student.name}</p>
<p className="text-xs text-gray-600">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("id-ID") : "—"}</p>
                  </div>
                  <p className="text-sm font-semibold tabular text-emerald-400">+{rupiah(p.amount)}</p>
            </motion.div>
          )) : (
            <div className="px-5 py-12 text-center text-sm text-gray-600">Belum ada pembayaran iuran minggu ini</div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <button
          onClick={() => setShowOther(!showOther)}
          className="flex w-full items-center justify-between card p-4 text-left transition-colors hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium">Pemasukan Lainnya</p>
              <p className="text-xs text-gray-600">{other.length} transaksi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <span className="text-sm font-semibold tabular text-emerald-400">+{rupiah(other.reduce((s, t) => s + t.amount, 0))}</span>
            )}
            {showOther ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
          </div>
        </button>

        {showOther && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card overflow-hidden"
          >
            <div className="hidden md:block">
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
                  {other.length === 0 ? (
                    <tr><td colSpan={isBendahara ? 5 : 4} className="p-12 text-center text-sm text-gray-600">Belum ada pemasukan tambahan</td></tr>
                  ) : other.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.01 * i }}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="p-3 pl-5 tabular text-gray-300">{new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</td>
                      <td className="p-3">
                        <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${catColors[t.category.name] || "bg-gray-500/10 text-gray-400"}`}>
                          {t.category.name}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600">{t.description || "—"}</td>
                      <td className="p-3 pr-5 text-right font-semibold tabular text-emerald-400">+{rupiah(t.amount)}</td>
                      {isBendahara && (
                        <td className="p-2">
                          <div className="flex gap-1">
                            <button onClick={() => openModal(t, "diubah")} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-indigo-400">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => hapus(t.id)} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-red-400">
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
            <div className="divide-y divide-white/[0.03] md:hidden">
              {other.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-gray-600">Belum ada pemasukan tambahan</div>
              ) : other.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.02 * i }}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm text-gray-200">{t.category.name}</p>
                    <p className="text-xs text-gray-600">{t.description || new Date(t.date).toLocaleDateString("id-ID")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold tabular text-emerald-400">+{rupiah(t.amount)}</p>
                    {isBendahara && (
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => openModal(t, "diubah")} className="rounded-lg p-0.5 text-gray-600 hover:text-indigo-400">
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => hapus(t.id)} className="rounded-lg p-0.5 text-gray-600 hover:text-red-400">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <ModalTransaksi open={modal} onClose={() => setModal(false)} onSaved={() => { refresh(); setToast({ msg: `Transaksi berhasil ${actionLabel}` }) }} defaultType="pemasukan" editData={editData ? { id: editData.id, type: editData.type, amount: editData.amount, categoryId: editData.category.id, description: editData.description, date: editData.date } : null} />

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
