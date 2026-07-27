"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { Wallet, TrendingUp, TrendingDown, Clock, RefreshCw } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

function rupiah(n: number) {
  return "Rp " + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

interface Stats {
  saldo: number
  month: { income: number; outcome: number }
  monthIncomeBreakdown: { iuran: number; lainnya: number }
  chart: { date: string; income: number; outcome: number }[]
  lastUpdated: string
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.04] ${className || ""}`} />
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  const load = useCallback(async () => {
    const res = await fetch("/api/stats")
    if (res.ok) setStats(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  const lastUpdated = stats?.lastUpdated
    ? new Date(stats.lastUpdated).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    : "..."

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-card via-card to-indigo-950/20 p-6 md:p-8"
      >
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-purple-600/8 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-gray-500">
            <Wallet size={14} />
            Saldo Kas Kelas
          </div>
          {stats ? (
            <p className={`mt-3 text-5xl font-bold tracking-tight tabular md:text-6xl ${stats.saldo < 0 ? "text-red-400" : "text-emerald-400"}`}>
              {rupiah(stats.saldo)}
            </p>
          ) : (
            <Skeleton className="mt-3 h-14 w-64" />
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
            <span>
              Pemasukan:{" "}
              <span className="font-medium text-emerald-400">{stats ? rupiah(stats.month.income) : <Skeleton className="inline-block h-3 w-16 align-middle" />}</span>
            </span>
            <span className="text-gray-600">·</span>
            <span>
              Pengeluaran:{" "}
              <span className="font-medium text-red-400">{stats ? rupiah(stats.month.outcome) : <Skeleton className="inline-block h-3 w-16 align-middle" />}</span>
            </span>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-600">
            <Clock size={11} />
            Terakhir diperbarui: {lastUpdated}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { label: "Pemasukan Bulan Ini", value: stats?.month.income || 0, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", sub: stats ? `Iuran ${rupiah(stats.monthIncomeBreakdown.iuran)} · Lainnya ${rupiah(stats.monthIncomeBreakdown.lainnya)}` : "" },
          { label: "Pengeluaran Bulan Ini", value: stats?.month.outcome || 0, icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10", sub: "" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1), duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="card p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg}`}>
                <item.icon size={17} className={item.color} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{item.label}</p>
                {stats ? (
                  <p className={`mt-0.5 text-lg font-bold tabular ${item.color}`}>{rupiah(item.value)}</p>
                ) : (
                  <Skeleton className="mt-1 h-6 w-24" />
                )}
                {item.sub && <p className="mt-0.5 truncate text-[10px] text-gray-600">{item.sub}</p>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="card p-5"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">7 Hari Terakhir</h2>
          <button onClick={load} className="rounded-lg p-1.5 text-gray-600 transition-colors hover:bg-white/[0.06] hover:text-indigo-400">
            <RefreshCw size={13} />
          </button>
        </div>
        {stats ? (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chart}>
                <defs>
                  <linearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="out" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 11 }} dy={6} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "#999" }}
                />
                <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fill="url(#inc)" />
                <Area type="monotone" dataKey="outcome" stroke="#ef4444" strokeWidth={2} fill="url(#out)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-48"><Skeleton className="h-full w-full" /></div>
        )}
      </motion.div>
    </div>
  )
}
