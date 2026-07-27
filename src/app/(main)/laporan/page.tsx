"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { FileText, Printer, Download, TrendingUp, TrendingDown, Wallet, PiggyBank, Users, AlertCircle } from "lucide-react"

function rupiah(n: number) {
  return "Rp " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

interface Period { id: string; label: string; startDate: string }

export default function LaporanPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"keuangan" | "pembayaran">("keuangan")
  const [periodId, setPeriodId] = useState("")
  const [payments, setPayments] = useState<any[]>([])
  const NOMINAL = 3000

  useEffect(() => {
    fetch("/api/laporan").then((r) => r.json()).then((d) => {
      setData(d)
      if (d.periods?.length > 0) setPeriodId(d.periods[0].id)
      setLoading(false)
    })
  }, [])

  const loadPayments = useCallback(async (pid: string) => {
    const res = await fetch(`/api/payments?periodId=${pid}`)
    if (res.ok) {
      const d = await res.json()
      setPayments(d.data || [])
    }
  }, [])

  useEffect(() => {
    if (periodId) loadPayments(periodId)
  }, [periodId, loadPayments])

  const handlePrint = () => window.print()

  const exportCSV = () => {
    if (!data) return
    const rows = [["Laporan Keuangan Kas Kelas"], [""]]
    rows.push(["Ringkasan", "", ""])
    rows.push(["Total Pemasukan", rupiah(data.summary.totalIncome), ""])
    rows.push(["  - Dari Iuran", rupiah(data.summary.incomeFromIuran), ""])
    rows.push(["  - Dari Lainnya", rupiah(data.summary.incomeFromOther), ""])
    rows.push(["Total Pengeluaran", rupiah(data.summary.totalOutcome), ""])
    rows.push(["Saldo", rupiah(data.summary.saldo), ""])
    rows.push([""])
    rows.push(["Pemasukan per Periode", "", ""])
    rows.push(["Periode", "Total", "Jumlah Siswa"])
    for (const p of data.incomeByPeriod) {
      rows.push([p.label, rupiah(p.total), String(p.count)])
    }
    rows.push([""])
    rows.push(["Pengeluaran per Kategori", "", ""])
    rows.push(["Kategori", "Total", "Jumlah Transaksi"])
    for (const c of data.outcomeByCategory) {
      rows.push([c.category, rupiah(c.total), String(c.count)])
    }
    rows.push([""])
    rows.push(["Statistik Siswa", "", ""])
    rows.push(["Total Siswa", String(data.studentStats.totalStudents), ""])
    rows.push(["Siswa Aktif", String(data.studentStats.activeStudents), ""])
    rows.push(["Pembayaran Lunas", String(data.studentStats.totalPaymentsLunas), ""])
    rows.push(["Pembayaran Belum", String(data.studentStats.totalPaymentsBelum), ""])

    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "laporan-kas-kelas.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  const { summary, incomeByPeriod, outcomeByCategory, outcomeByMonth, periods, studentStats } = data
  const activePayments = payments.filter((s: any) => s.isActive)
  const lunasCount = activePayments.filter((s: any) => s.payment?.status === "LUNAS").length
  const belumCount = activePayments.length - lunasCount

  return (
    <div className="max-w-5xl mx-auto print:max-w-none">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-3 mb-6 print:hidden">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl flex items-center gap-2">
            <FileText size={22} className="text-indigo-400" /> Laporan
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">Rekap keuangan dan pembayaran kas kelas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-ghost text-xs py-1.5 px-3 gap-1.5">
            <Download size={13} /> CSV
          </button>
          <button onClick={handlePrint} className="btn-primary text-xs gap-1.5">
            <Printer size={13} /> Cetak / PDF
          </button>
        </div>
      </motion.div>

      <div className="flex gap-1 mb-6 print:hidden">
        <button onClick={() => setTab("keuangan")} className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${tab === "keuangan" ? "bg-indigo-500/10 text-indigo-400" : "text-gray-600 hover:text-gray-400"}`}>Laporan Keuangan</button>
        <button onClick={() => setTab("pembayaran")} className={`px-4 py-2 text-xs font-medium rounded-lg transition-all ${tab === "pembayaran" ? "bg-indigo-500/10 text-indigo-400" : "text-gray-600 hover:text-gray-400"}`}>Rekap Pembayaran</button>
      </div>

      <div className="print:block" style={{ display: tab === "keuangan" ? "block" : "none" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <div className="card p-4 print:border print:shadow-none">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <TrendingUp size={14} /><span className="text-[10px] font-semibold uppercase tracking-wider">Pemasukan</span>
            </div>
            <p className="text-lg font-bold tabular">{rupiah(summary.totalIncome)}</p>
            <p className="text-[10px] text-gray-600 print:text-gray-400 mt-0.5">Iuran {rupiah(summary.incomeFromIuran)} + Lainnya {rupiah(summary.incomeFromOther)}</p>
          </div>
          <div className="card p-4 print:border print:shadow-none">
            <div className="flex items-center gap-2 text-red-400 mb-1">
              <TrendingDown size={14} /><span className="text-[10px] font-semibold uppercase tracking-wider">Pengeluaran</span>
            </div>
            <p className="text-lg font-bold tabular">{rupiah(summary.totalOutcome)}</p>
          </div>
          <div className="card p-4 print:border print:shadow-none col-span-2 md:col-span-1 text-center">
            <div className="flex items-center justify-center gap-2 text-indigo-400 mb-1">
              <Wallet size={14} /><span className="text-[10px] font-semibold uppercase tracking-wider">Saldo</span>
            </div>
            <p className={`text-lg font-bold tabular ${summary.saldo < 0 ? "text-red-400" : ""}`}>{rupiah(summary.saldo)}</p>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card overflow-hidden print:border print:shadow-none">
            <div className="border-b border-white/[0.06] print:border-gray-200 px-5 py-3.5">
              <h3 className="text-sm font-semibold">Pemasukan per Periode</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm print:text-black">
                <thead>
                  <tr className="table-header">
                    <th className="p-3 pl-5 font-medium">Periode</th>
                    <th className="p-3 font-medium">Siswa</th>
                    <th className="p-3 pr-5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeByPeriod.map((p: any) => (
                    <tr key={p.label} className="border-t border-white/[0.03] print:border-gray-100">
                      <td className="p-3 pl-5 text-gray-200 print:text-gray-700">{p.label}</td>
                      <td className="p-3 text-gray-600 print:text-gray-500">{p.count} siswa</td>
                      <td className="p-3 pr-5 text-right font-semibold tabular text-emerald-400 print:text-emerald-600">{rupiah(p.total)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-white/[0.06] print:border-gray-300 font-semibold">
                    <td className="p-3 pl-5 text-gray-200 print:text-gray-900">Total</td>
                    <td className="p-3 text-gray-600 print:text-gray-500" />
                    <td className="p-3 pr-5 text-right tabular text-emerald-400 print:text-emerald-700">{rupiah(incomeByPeriod.reduce((s: number, p: any) => s + p.total, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card overflow-hidden print:border print:shadow-none">
            <div className="border-b border-white/[0.06] print:border-gray-200 px-5 py-3.5">
              <h3 className="text-sm font-semibold">Pengeluaran per Kategori</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm print:text-black">
                <thead>
                  <tr className="table-header">
                    <th className="p-3 pl-5 font-medium">Kategori</th>
                    <th className="p-3 font-medium">Transaksi</th>
                    <th className="p-3 pr-5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {outcomeByCategory.map((c: any) => (
                    <tr key={c.category} className="border-t border-white/[0.03] print:border-gray-100">
                      <td className="p-3 pl-5 text-gray-200 print:text-gray-700">{c.category}</td>
                      <td className="p-3 text-gray-600 print:text-gray-500">{c.count} transaksi</td>
                      <td className="p-3 pr-5 text-right font-semibold tabular text-red-400 print:text-red-600">{rupiah(c.total)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-white/[0.06] print:border-gray-300 font-semibold">
                    <td className="p-3 pl-5 text-gray-200 print:text-gray-900">Total</td>
                    <td className="p-3 text-gray-600 print:text-gray-500" />
                    <td className="p-3 pr-5 text-right tabular text-red-400 print:text-red-700">{rupiah(outcomeByCategory.reduce((s: number, c: any) => s + c.total, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card overflow-hidden mb-6 print:border print:shadow-none">
          <div className="border-b border-white/[0.06] print:border-gray-200 px-5 py-3.5">
            <h3 className="text-sm font-semibold">Riwayat Pengeluaran</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm print:text-black">
              <thead>
                <tr className="table-header">
                  <th className="p-3 pl-5 font-medium">Bulan</th>
                  <th className="p-3 font-medium">Deskripsi</th>
                  <th className="p-3 font-medium">Kategori</th>
                  <th className="p-3 pr-5 text-right font-medium">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {outcomeByMonth.flatMap((m: any) => [
                  <tr key={m.label} className="border-t border-white/[0.03] print:border-gray-100">
                    <td className="p-3 pl-5 text-gray-200 print:text-gray-700 font-medium" rowSpan={m.items.length + 1}>{m.label}</td>
                  </tr>,
                  ...m.items.map((t: any) => (
                    <tr key={t.id} className="border-t border-white/[0.02] print:border-gray-50">
                      <td className="p-3 pl-5 text-gray-300 print:text-gray-600 text-xs">{t.description || "—"}</td>
                      <td className="p-3 text-xs text-gray-600 print:text-gray-500">{t.category.name}</td>
                      <td className="p-3 pr-5 text-right text-xs font-semibold tabular text-red-400 print:text-red-600">{rupiah(t.amount)}</td>
                    </tr>
                  )),
                ])}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5 print:border print:shadow-none print:hidden">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Users size={14} className="text-indigo-400" /> Statistik Siswa</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-600">Total Siswa</span><p className="font-bold tabular">{studentStats.totalStudents}</p></div>
            <div><span className="text-gray-600">Siswa Aktif</span><p className="font-bold tabular">{studentStats.activeStudents}</p></div>
            <div><span className="text-emerald-400/60">Pembayaran Lunas</span><p className="font-bold tabular text-emerald-400">{studentStats.totalPaymentsLunas}</p></div>
            <div><span className="text-red-400/60">Belum Lunas</span><p className="font-bold tabular text-red-400">{studentStats.totalPaymentsBelum}</p></div>
          </div>
        </motion.div>
      </div>

      <div className="print:block" style={{ display: tab === "pembayaran" ? "block" : "none" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden print:border print:shadow-none">
          <div className="flex items-center justify-between border-b border-white/[0.06] print:border-gray-200 px-5 py-3.5">
            <h3 className="text-sm font-semibold">Rekap Pembayaran Siswa</h3>
            <select value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="input-field w-auto min-w-[160px] text-xs print:hidden">
              {periods.map((p: Period) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          {periods.length > 0 && (
            <div className="mb-0">
              <div className="grid grid-cols-3 gap-3 p-5 border-b border-white/[0.06] print:border-gray-200 print:bg-gray-50">
                <div className="text-center">
                  <p className="text-2xl font-bold tabular text-emerald-400 print:text-emerald-600">{lunasCount}</p>
                  <p className="text-[10px] text-gray-600 print:text-gray-500">Lunas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold tabular text-red-400 print:text-red-600">{belumCount}</p>
                  <p className="text-[10px] text-gray-600 print:text-gray-500">Belum</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold tabular text-indigo-400 print:text-indigo-600">{activePayments.length}</p>
                  <p className="text-[10px] text-gray-600 print:text-gray-500">Total</p>
                </div>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm print:text-black">
              <thead>
                <tr className="table-header">
                  <th className="p-3 pl-5 font-medium w-10">No</th>
                  <th className="p-3 font-medium">Nama</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 pr-5 text-right font-medium">Nominal</th>
                </tr>
              </thead>
              <tbody>
                {payments.filter((s: any) => s.isActive).map((s: any, i: number) => {
                  const isLunas = s.payment?.status === "LUNAS"
                  const total = s.payment?.amount || NOMINAL
                  return (
                    <tr key={s.id} className="border-t border-white/[0.03] print:border-gray-100">
                      <td className="p-3 pl-5 text-gray-600 print:text-gray-500 tabular">{i + 1}</td>
                      <td className="p-3 text-gray-200 print:text-gray-700">
                        {s.name}
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isLunas ? "bg-emerald-500/10 text-emerald-400 print:bg-green-100 print:text-green-700" : "bg-red-500/10 text-red-400 print:bg-red-100 print:text-red-700"}`}>
                          {isLunas ? "LUNAS" : "BELUM"}
                        </span>
                      </td>
                      <td className={`p-3 pr-5 text-right font-semibold tabular ${isLunas ? "text-emerald-400 print:text-emerald-600" : "text-red-400 print:text-red-600"}`}>{rupiah(total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @media print {
          body { background: white !important; color: #111827 !important; }
          @page { margin: 1.5cm; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .card { background: white !important; border: 1px solid #e5e7eb !important; box-shadow: none !important; }
          .table-header th { color: #374151 !important; }
          .text-gray-200, .text-gray-300, .text-gray-400, .text-gray-500, .text-gray-600, .text-gray-700 {
            color: #374151 !important;
          }
          .text-emerald-400 { color: #059669 !important; }
          .text-red-400 { color: #dc2626 !important; }
          .text-indigo-400 { color: #6366f1 !important; }
          .text-amber-500 { color: #d97706 !important; }
          .tabular { font-variant-numeric: tabular-nums; }
        }
      `}</style>
    </div>
  )
}
