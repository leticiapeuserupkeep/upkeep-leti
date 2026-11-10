import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'] })
/** Ultranova's typeface (used by its sidebar card and prototypes). */
const outfit = Outfit({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: 'UpKeep',
  description: 'UpKeep Platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${outfit.variable}`}>
        {children}
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
      </body>
    </html>
  )
}
