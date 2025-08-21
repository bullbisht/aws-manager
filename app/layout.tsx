import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AWS Manager',
  description: 'A comprehensive tool for managing multiple AWS services including S3, EC2, RDS, and more with a modern web interface',
  keywords: ['AWS', 'S3', 'EC2', 'RDS', 'Lambda', 'Cloud Services', 'Management', 'React', 'Next.js'],
  authors: [{ name: 'Your Team' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
