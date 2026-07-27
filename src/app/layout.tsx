import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Kas Kelas",
  description: "Aplikasi keuangan kelas",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={font.variable} suppressHydrationWarning>
      <body suppressHydrationWarning><Providers>{children}</Providers></body>
    </html>
  )
}
