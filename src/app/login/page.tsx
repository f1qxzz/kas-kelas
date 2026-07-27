"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { Wallet, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") return
    if (status === "authenticated" && session) router.push("/")
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div suppressHydrationWarning className="flex min-h-screen items-center justify-center bg-surface">
        <div suppressHydrationWarning className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", { name: name.toLowerCase(), password, redirect: false })

    if (res?.error) {
      setError("Nama atau password salah")
      setLoading(false)
    } else {
      router.push("/")
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-surface overflow-hidden p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.06),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm"
      >
        <div className="relative rounded-2xl border border-white/[0.06] bg-card/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

          <div className="relative mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-600/20">
              <Wallet size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Kas Kelas</h1>
            <p className="mt-1 text-sm text-gray-500">Masuk ke aplikasi keuangan kelas</p>
          </div>

          <form onSubmit={handleSubmit} className="relative space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Nama</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="Masukkan nama"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Masukkan password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Memproses..." : "Masuk"}
            </motion.button>


          </form>
        </div>
      </motion.div>
    </div>
  )
}
