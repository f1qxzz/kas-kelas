"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { TrendingUp, TrendingDown, Download, FileText } from "lucide-react"

interface Transaction {
  id: string; type: string; amount: number; description: string; date: string
  category: { name: string }; user: { name: string }
}

function rupiah(n: number) {
  return "Rp " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export default function LaporanPage() {
  const [txns, setTxns] = useState<Transaction[]>([])
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    const params = new URLSearchParams({ startDate: start.toISOString(), endDate: end.toISOString() })
    const data = await fetch(`/api/transactions?${params}`).then((r) => r.json())
    setTxns(data); setLoading(false)
  }, [month, year])

  useEffect(() => { load() }, [load])

  const totalPemasukan = txns.filter((t) => t.type === "pemasukan").reduce((s, t) => s + t.amount, 0)
  const totalPengeluaran = txns.filter((t) => t.type === "pengeluaran").reduce((s, t) => s + t.amount, 0)
  const saldo = totalPemasukan - totalPengeluaran

  function exportCSV() {
    const header = "Tanggal,Jenis,Kategori,Keterangan,Jumlah,Oleh\n"
    const rows = txns.map((t) =>
      [new Date(t.date).toLocaleDateString("id-ID"), t.type === "pemasukan" ? "Masuk" : "Keluar",
        t.category.name, `"${t.description}"`, t.type === "pemasukan" ? t.amount : -t.amount, t.user.name].join(",")
    ).join("\n")
    download(header + rows, `laporan-kas-${month + 1}-${year}.csv`, "text/csv")
  }

  function exportTXT() {
    const lines = [
      "=".repeat(40),
      `LAPORAN KAS KELAS`,
      `${new Date(year, month).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`,
      "=".repeat(40), "",
      `Total Pemasukan  : ${rupiah(totalPemasukan)}`,
      `Total Pengeluaran: ${rupiah(totalPengeluaran)}`,
      `Saldo Akhir      : ${rupiah(saldo)}`, "",
      "-".repeat(40), "",
      ...txns.map((t) =>
        `${new Date(t.date).toLocaleDateString("id-ID")} | ${t.type === "pemasukan" ? "Masuk " : "Keluar"} | ${t.category.name} | ${t.description || "-"} | ${rupiah(t.amount)}`
      ),
    ].join("\n")
    download(lines, `laporan-kas-${month + 1}-${year}.txt`, "text/plain")
  }

  function download(content: string, name: string, type: string) {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
  }

  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">Laporan</h1>
          <p className="mt-0.5 text-sm text-gray-500">Rekap keuangan per bulan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-ghost text-xs"><Download size={13} /> CSV</button>
          <button onClick={exportTXT} className="btn-ghost text-xs"><Download size={13} /> TXT</button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="input-field w-auto text-sm">
          {months.map((m, i) => (<option key={i} value={i}>{m}</option>))}
        </select>
        <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field w-20 md:w-24" />
      </div>

      <div className="grid gap-3 md:gap-4 sm:grid-cols-3">
        {[
          { label: "Total Pemasukan", value: totalPemasukan, icon: TrendingUp, color: "text-emerald-400" },
          { label: "Total Pengeluaran", value: totalPengeluaran, icon: TrendingDown, color: "text-red-400" },
          { label: "Saldo Akhir", value: saldo, icon: null, color: saldo < 0 ? "text-red-400" : "text-emerald-400" },
        ].map((item) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className="card p-5"
          >
            <p className="mb-1 text-xs font-medium text-gray-500">{item.label}</p>
            <p className={`text-xl font-bold tabular md:text-2xl ${loading ? "text-gray-700" : item.color}`}>
              {loading ? "..." : rupiah(item.value)}
            </p>
          </motion.div>
        ))}
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-16 text-center text-gray-600 text-sm">Memuat...</td></tr>
              ) : txns.length === 0 ? (
                <tr><td colSpan={6} className="p-16 text-center text-gray-600">
                  <FileText size={22} className="mx-auto mb-2 text-gray-600" />
                  <p className="text-sm">Belum ada transaksi bulan ini</p>
                </td></tr>
              ) : txns.map((tx, i) => (
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
                      {tx.type === "pemasukan" ? "Masuk" : "Keluar"}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{tx.category.name}</td>
                  <td className="p-4 text-gray-600">{tx.description || "—"}</td>
                  <td className={`p-4 text-right font-semibold tabular ${tx.type === "pemasukan" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.type === "pemasukan" ? "+" : "-"}{rupiah(tx.amount)}
                  </td>
                  <td className="p-4 text-xs text-gray-600">{tx.user.name}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <div className="card py-8 text-center text-sm text-gray-600">Memuat...</div>
        ) : txns.length === 0 ? (
          <div className="card py-16 text-center">
            <FileText size={22} className="mx-auto mb-2 text-gray-600" />
            <p className="text-sm text-gray-600">Belum ada transaksi bulan ini</p>
          </div>
        ) : txns.map((tx, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 * i }}
            className="card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">
                {new Date(tx.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
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
          </motion.div>
        ))}
      </div>
    </div>
  )
}
