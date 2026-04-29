'use client'

import Image from 'next/image'
import type { Image as ImageType } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

const TAG_COLORS = [
  'bg-blue-50 text-blue-800',
  'bg-green-50 text-green-800',
  'bg-purple-50 text-purple-800',
  'bg-orange-50 text-orange-800',
  'bg-pink-50 text-pink-800',
  'bg-teal-50 text-teal-800',
]
function tagColor(tag: string) {
  let hash = 0
  for (const c of tag) hash = (hash * 31 + c.charCodeAt(0)) % TAG_COLORS.length
  return TAG_COLORS[hash]
}

type Props = {
  image: ImageType
  onClose: () => void
  onDeleted: () => void
}

export default function ImageModal({ image, onClose, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('이 이미지를 삭제할까요?')) return
    setDeleting(true)
    const fileName = image.url.split('/').pop()!
    await supabase.storage.from('images').remove([fileName])
    await supabase.from('images').delete().eq('id', image.id)
    onDeleted()
    onClose()
  }

  const date = new Date(image.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full bg-gray-100" style={{ aspectRatio: '16/9' }}>
          <Image src={image.url} alt={image.name} fill className="object-contain" unoptimized />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="font-medium text-gray-900 text-sm">{image.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{image.uploader} · {date}</p>
            </div>
            <div className="flex gap-2">
              <a href={image.url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                원본 보기
              </a>
              <button onClick={handleDelete} disabled={deleting} className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
          {image.tags.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1.5">태그</p>
              <div className="flex flex-wrap gap-1.5">
                {image.tags.map((tag) => (
                  <span key={tag} className={`text-xs px-2 py-1 rounded-full ${tagColor(tag)}`}>{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
