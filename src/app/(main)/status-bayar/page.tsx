"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "motion/react"
import { Check, X, Plus, Loader, Search, Users, Wallet, Zap, Settings, UserPlus, Trash2, Pencil, XCircle } from "lucide-react"

function rupiah(n: number) {
  return "Rp " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

interface Period { id: string; label: string; startDate: string }
interface Payment { id?: string; status: string; amount: number; paidAt?: string }
interface StudentWithPayment { id: string; name: string; classNumber: number; isActive: boolean; payment: Payment | null }

const NOMINAL = 3000
type Filter = "all" | "lunas" | "belum"

export default function StatusBayarPage() {
  const [periods, setPeriods] = useState<Period[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [data, setData] = useState<StudentWithPayment[]>([])
  const [periodLabel, setPeriodLabel] = useState("")
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [toggling, setToggling] = useState<string | null>(null)
  const [showManage, setShowManage] = useState(false)
  const [students, setStudents] = useState<StudentWithPayment[]>([])
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const { data: session } = useSession()
  const isBendahara = (session?.user as { role?: string })?.role === "bendahara"

  const loadPeriods = () =>
    fetch("/api/periods").then((r) => r.json()).then((p: Period[]) => {
      setPeriods(p)
      if (p.length > 0 && !selectedPeriod) setSelectedPeriod(p[0].id)
    })

  useEffect(() => { loadPeriods() }, [])

  const load = useCallback(async () => {
    if (!selectedPeriod) return
    setLoading(true)
    const res = await fetch(`/api/payments?periodId=${selectedPeriod}`)
    if (res.ok) {
      const d = await res.json()
      setData(d.data)
      setPeriodLabel(d.period?.label || "")
    }
    setLoading(false)
  }, [selectedPeriod])

  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    let result = data.filter((s) => s.isActive)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((s) => s.name.toLowerCase().includes(q))
    }
    if (filter === "lunas") result = result.filter((s) => s.payment?.status === "LUNAS")
    else if (filter === "belum") result = result.filter((s) => s.payment?.status !== "LUNAS")
    return result
  }, [data, search, filter])

  const activeStudents = data.filter((s) => s.isActive)
  const lunas = activeStudents.filter((s) => s.payment?.status === "LUNAS").length
  const belum = activeStudents.length - lunas
  const terkumpul = activeStudents.filter((s) => s.payment?.status === "LUNAS").reduce((s, d) => s + (d.payment?.amount || 0), 0)
  const target = activeStudents.length * NOMINAL
  const progress = activeStudents.length > 0 ? Math.round((lunas / activeStudents.length) * 100) : 0

  async function toggleStatus(studentId: string, current: Payment | null) {
    if (!selectedPeriod) return
    setToggling(studentId)
    const newStatus = current?.status === "LUNAS" ? "BELUM" : "LUNAS"
    const total = current?.amount || NOMINAL
    await fetch("/api/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, periodId: selectedPeriod, amount: total, status: newStatus }),
    })
    setToggling(null)
    load()
  }

  async function bayarSemua() {
    if (!selectedPeriod || !confirm(`Bayarin ${belum} siswa? Terkumpul Rp ${rupiah(belum * NOMINAL)}`)) return
    const unpaid = activeStudents.filter((s) => s.payment?.status !== "LUNAS")
    await Promise.allSettled(unpaid.map((s) => {
      const total = s.payment?.amount || NOMINAL
      return fetch("/api/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: s.id, periodId: selectedPeriod, amount: total, status: "LUNAS" }),
      })
    }))
    load()
  }

  async function buatPeriode() {
    setCreating(true)
    const res = await fetch("/api/periods", { method: "POST" })
    if (res.ok) {
      const p = await res.json()
      await loadPeriods()
      setSelectedPeriod(p.id)
    }
    setCreating(false)
  }

  async function loadStudents() {
    const res = await fetch("/api/students")
    if (res.ok) setStudents(await res.json())
  }

  async function tambahSiswa() {
    if (!newName.trim()) return
    await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setNewName("")
    loadStudents()
    load()
  }

  async function editSiswa(id: string) {
    if (!editName.trim()) return
    await fetch(`/api/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    })
    setEditingId(null)
    setEditName("")
    loadStudents()
    load()
  }

  async function nonaktifkanSiswa(id: string) {
    if (!confirm("Nonaktifkan siswa ini?")) return
    await fetch(`/api/students/${id}`, { method: "DELETE" })
    loadStudents()
    load()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-start justify-between flex-wrap gap-3"
      >
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Status Bayar</h1>
          <p className="mt-0.5 text-sm text-gray-500">Pembayaran iuran per periode</p>
        </div>
        <div className="flex items-center gap-2">
          {isBendahara && (
            <>
              <button onClick={() => { loadStudents(); setShowManage(true) }} className="btn-ghost text-xs py-1.5 px-3">
                <Settings size={13} /> Kelola
              </button>
              <button onClick={buatPeriode} disabled={creating} className="btn-primary text-xs gap-1.5">
                {creating ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
                Periode Baru
              </button>
            </>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card p-5 space-y-4"
      >
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="input-field w-auto min-w-[180px]"
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              <span className="text-emerald-400 font-semibold">{lunas}</span>
              <span className="text-gray-600">/{activeStudents.length}</span> siswa
            </span>
            <span className="text-gray-500">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-emerald-400 font-medium">{rupiah(terkumpul)} terkumpul</span>
            <span className="text-gray-600">Target {rupiah(target)}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-2 flex-wrap"
      >
        <div className="relative flex-1 min-w-[140px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-full pl-8"
            placeholder="Cari siswa..."
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-white/[0.04] p-0.5">
          {([
            { key: "all", label: `Semua (${activeStudents.length})` },
            { key: "lunas", label: `Lunas (${lunas})` },
            { key: "belum", label: `Belum (${belum})` },
          ] as { key: Filter; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filter === t.key
                  ? t.key === "lunas" ? "bg-emerald-500/10 text-emerald-400" : t.key === "belum" ? "bg-red-500/10 text-red-400" : "bg-white/[0.08] text-gray-200"
                  : "text-gray-600 hover:text-gray-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {belum > 0 && isBendahara && (
          <button onClick={bayarSemua} className="btn-ghost text-xs py-1.5 gap-1.5 whitespace-nowrap">
            <Zap size={12} /> Bayar Semua
          </button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card overflow-hidden"
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-600">
            {search ? (
              <>
                <Search size={28} className="mb-2 text-gray-600/50" />
                <p className="text-sm">Siswa &ldquo;{search}&rdquo; tidak ditemukan</p>
              </>
            ) : (
              <>
                <Check size={28} className="mb-2 text-emerald-400/50" />
                <p className="text-sm">Semua udah lunas!</p>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            <AnimatePresence mode="popLayout">
              {filtered.map((s) => {
                const isLunas = s.payment?.status === "LUNAS"
                const loading = toggling === s.id
                const initial = s.name.charAt(0)
                const totalAmount = s.payment?.amount || NOMINAL
                return (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${isBendahara ? "cursor-pointer hover:bg-white/[0.02]" : ""}`}
                    onClick={() => isBendahara && !loading && toggleStatus(s.id, s.payment)}
                  >
                    <span className="w-5 shrink-0 text-xs text-gray-600 tabular">{s.classNumber}</span>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isLunas ? "bg-emerald-500/15 text-emerald-400" : "bg-white/[0.06] text-gray-500"
                    }`}>
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-200 truncate">{s.name}</span>
                    </div>
                    {loading ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    ) : (
                      <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all ${
                        isLunas ? "bg-emerald-500/10" : "bg-red-500/10"
                      }`}>
                        <span className={`text-xs font-semibold tabular ${isLunas ? "text-emerald-400" : "text-red-400"}`}>
                          {rupiah(totalAmount)}
                        </span>
                        <div className={`flex h-5 w-5 items-center justify-center rounded-lg ${
                          isLunas ? "bg-emerald-400/20 text-emerald-400" : "bg-red-400/20 text-red-400"
                        }`}>
                          {isLunas ? <Check size={12} /> : <X size={12} />}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showManage && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={() => setShowManage(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="relative w-full max-w-lg max-h-[80vh] rounded-2xl border border-white/[0.06] bg-card p-6 shadow-2xl shadow-black/50 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
                      <Users size={15} className="text-indigo-400" />
                    </div>
                    <h2 className="text-sm font-semibold">Kelola Siswa</h2>
                  </div>
                  <button onClick={() => setShowManage(false)} className="rounded-xl p-2 text-gray-600 hover:bg-white/[0.06]">
                    <XCircle size={16} />
                  </button>
                </div>

                <div className="flex gap-2 mb-4">
                  <input value={newName} onChange={(e) => setNewName(e.target.value)}
                    className="input-field flex-1" placeholder="Nama siswa baru"
                    onKeyDown={(e) => e.key === "Enter" && tambahSiswa()}
                  />
                  <button onClick={tambahSiswa} className="btn-primary text-xs gap-1">
                    <UserPlus size={14} /> Tambah
                  </button>
                </div>

                <div className="divide-y divide-white/[0.03] max-h-64 overflow-y-auto">
                  {students.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 py-2.5">
                      <span className="w-5 text-xs text-gray-600 tabular">{s.classNumber}</span>
                      {editingId === s.id ? (
                        <>
                          <input value={editName} onChange={(e) => setEditName(e.target.value)}
                            className="input-field flex-1 text-sm py-2" autoFocus
                            onKeyDown={(e) => e.key === "Enter" && editSiswa(s.id)}
                          />
                          <button onClick={() => editSiswa(s.id)} className="text-xs text-indigo-400 font-medium">Simpan</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-gray-600">Batal</button>
                        </>
                      ) : (
                        <>
                          <span className={`flex-1 text-sm ${s.isActive ? "text-gray-200" : "text-gray-600 line-through"}`}>{s.name}</span>
                          <button onClick={() => { setEditingId(s.id); setEditName(s.name) }} className="rounded-lg p-1.5 text-gray-600 hover:text-indigo-400">
                            <Pencil size={13} />
                          </button>
                          {s.isActive && (
                            <button onClick={() => nonaktifkanSiswa(s.id)} className="rounded-lg p-1.5 text-gray-600 hover:text-red-400">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
