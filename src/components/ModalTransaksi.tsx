"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Wallet, Plus, Check } from "lucide-react"

interface Category {
  id: string; name: string; type: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  defaultType?: string
  editData?: {
    id: string; type: string; amount: number; categoryId: string; description: string; date: string
  } | null
}

export function ModalTransaksi({ open, onClose, onSaved, defaultType, editData }: Props) {
  const [type, setType] = useState("pengeluaran")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"))
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatName, setNewCatName] = useState("")

  const loadCategories = () =>
    fetch("/api/categories").then((r) => r.json()).then(setCategories)

  useEffect(() => {
    if (!open) return
    loadCategories()
    if (editData) {
      setType(editData.type)
      setAmount(String(editData.amount))
      setCategoryId(editData.categoryId)
      setDescription(editData.description)
      setDate(editData.date.slice(0, 10))
    } else {
      setType(defaultType || "pengeluaran"); setAmount(""); setCategoryId(""); setDescription("")
      setDate(new Date().toLocaleDateString("en-CA"))
    }
  }, [open, editData])

  const filteredCategories = categories.filter((c) => c.type === type)

  async function addCategory() {
    if (!newCatName.trim()) return
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim(), type }),
    })
    if (res.ok) {
      const cat = await res.json()
      setCategoryId(cat.id)
      setNewCatName("")
      setShowNewCat(false)
      loadCategories()
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    const body = { type, amount: parseInt(amount.replace(/\./g, "")), categoryId, description, date }
    const isEdit = !!editData
    const res = await fetch(isEdit ? `/api/transactions/${editData!.id}` : "/api/transactions", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { setLoading(false); alert("Gagal menyimpan transaksi"); return }
    setLoading(false); onSaved(); onClose()
  }

  function fmt(val: string) {
    return val.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-md rounded-2xl border border-white/[0.06] bg-card p-6 shadow-2xl shadow-black/50">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

              <div className="relative mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-600/20">
                    <Wallet size={15} className="text-white" />
                  </div>
                  <h2 className="text-sm font-semibold tracking-tight">
                    {editData ? "Edit Transaksi" : "Tambah Transaksi"}
                  </h2>
                </div>
                <button onClick={onClose} className="rounded-xl p-2 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-gray-300">
                  <X size={17} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="relative space-y-4">
                <div className="flex gap-2 rounded-xl bg-white/[0.03] p-1">
                  {(["pemasukan", "pengeluaran"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setType(t); setCategoryId("") }}
                      className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                        type === t
                          ? t === "pemasukan"
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                            : "bg-red-500 text-white shadow-sm shadow-red-500/20"
                          : "text-gray-600 hover:text-gray-400"
                      }`}
                    >
                      {t === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Jumlah (Rp)</label>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(fmt(e.target.value))}
                    className="input-field text-lg font-semibold tabular"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Kategori</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field w-full" required>
                        <option value="">Pilih kategori</option>
                        {filteredCategories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <button type="button" onClick={() => setShowNewCat(!showNewCat)}
                      className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-gray-500 transition-all hover:border-white/20 hover:text-indigo-400"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  {showNewCat && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex gap-2"
                    >
                      <input
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="input-field flex-1"
                        placeholder={`Nama kategori ${type === "pemasukan" ? "pemasukan" : "pengeluaran"} baru`}
                        autoFocus
                      />
                      <button type="button" onClick={addCategory}
                        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-all hover:bg-indigo-500"
                      >
                        <Check size={16} />
                      </button>
                    </motion.div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Tanggal</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-500">Keterangan</label>
                  <input value={description} onChange={(e) => setDescription(e.target.value)} className="input-field" placeholder="Opsional" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={onClose} className="btn-ghost flex-1">Batal</button>
                  <button type="submit" disabled={loading} className="btn-primary flex-1">{loading ? "Menyimpan..." : "Simpan"}</button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
