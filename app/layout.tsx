import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Himalaya Reload Products',
  description: 'API dan Aplikasi untuk data harga produk Himalaya Reload',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  )
}
