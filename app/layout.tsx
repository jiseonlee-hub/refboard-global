import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '닥터포헤어 레퍼런스 보드',
  description: '닥터포헤어 팀 이미지 레퍼런스 공유 보드',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
