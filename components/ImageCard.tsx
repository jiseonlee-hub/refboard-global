'use client'

import type { Image as ImageType } from '@/lib/supabase'
import { getUploaderColor } from './Sidebar'

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
  uploaders: string[]
  onClick: () => void
  onTagClick: (tag: string) => void
}

export default function ImageCard({ image, uploaders, onClick, onTagClick }: Props) {
  const color = getUploaderColor(image.uploader, uploaders)

  return (
    <div
      onClick={onClick}
      className="border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-gray-400 transition-colors bg-white"
      style={{ breakInside: 'avoid', marginBottom: '12px' }}
    >
      <div className="relative w-full bg-gray-100">
        <img src={image.url} alt={image.name} className="w-full block" />
      </div>
      {image.tags.length > 0 && (
        <div className="px-2 py-1.5 flex flex-wrap gap-1">
          {image.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              onClick={(e) => { e.stopPropagation(); onTagClick(tag) }}
              className={`text-xs px-1.5 py-0.5 rounded-full cursor-pointer hover:opacity-70 transition-opacity ${tagColor(tag)}`}
            >
              {tag}
            </span>
          ))}
          {image.tags.length > 3 && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400">
              +{image.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
