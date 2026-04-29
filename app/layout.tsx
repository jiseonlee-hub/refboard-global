import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '해외 레퍼런스 보드',
  description: '해외 레퍼런스 이미지 보드',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
