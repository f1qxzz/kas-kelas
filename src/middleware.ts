import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const LIMIT = 10
const WINDOW_MS = 60_000
const rateLimit = new Map<string, { count: number; resetAt: number }>()

function ipCheck(ip: string) {
  const now = Date.now()
  const entry = rateLimit.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= LIMIT) return false
  entry.count++
  return true
}

// ponytail: cookie counter biar limit tetap jalan per-browser di serverless
// (Map kosong tiap cold start); attacker bisa clear cookie → ganti Upstash kalo pernah ada abuse
function cookieCheck(req: NextRequest) {
  const raw = req.cookies.get("lr")?.value || ""
  const [cRaw = "0", sRaw = "0"] = raw.split(".")
  const count = parseInt(cRaw, 10) || 0
  const start = parseInt(sRaw, 10) || 0
  const now = Date.now()
  if (!start || now - start > WINDOW_MS) return { ok: true, count: 1, start: now }
  if (count >= LIMIT) return { ok: false, count, start }
  return { ok: true, count: count + 1, start }
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Hanya login attempt (POST callback credentials) — session polling /api/auth/session tidak kena limit
  if (req.nextUrl.pathname === "/api/auth/callback/credentials") {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "unknown"
    const c = cookieCheck(req)
    if (!ipCheck(ip) || !c.ok) {
      return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi dalam 1 menit." }, { status: 429 })
    }
    res.cookies.set("lr", `${c.count}.${c.start}`, {
      maxAge: Math.ceil(WINDOW_MS / 1000),
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    })
  }

  return res
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
}
