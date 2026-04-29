'use client'

import type { Image } from '@/lib/supabase'

type Props = {
  images: Image[]
  filterPlatform: string | null
  filterCategory: string | null
  filterTag: string | null
  totalCount: number
  onSelectPlatform: (p: string) => void
  onSelectPlatformCategory: (p: string, c: string) => void
  onSelectTag: (t: string) => void
  onClear: () => void
}

export default function GlobalSidebar({
  images, filterPlatform, filterCategory, filterTag, totalCount,
  onSelectPlatform, onSelectPlatformCategory, onSelectTag, onClear,
}: Props) {
  const platforms = Array.from(new Set(images.map((i) => i.platform).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ko'))
  const allTags = Array.from(new Set(images.flatMap((i) => i.tags))).sort((a, b) => a.localeCompare(b, 'ko'))

  const getCategoriesForPlatform = (platform: string) =>
    Array.from(new Set(images.filter((i) => i.platform === platform).map((i) => i.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ko'))

  const isAll = !filterPlatform && !filterCategory && !filterTag

  return (
    <aside className="w-48 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
      <div className="p-3">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-2 py-1">전체</p>
        <button
          onClick={onClear}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm mb-0.5 ${isAll ? 'bg-white text-gray-900 font-medium' : 'text-gray-500 hover:bg-white hover:text-gray-800'}`}
        >
          <span>전체 이미지</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{totalCount}</span>
        </button>

        {platforms.length > 0 && (
          <>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-2 pt-3 pb-1">플랫폼</p>
            {platforms.map((platform) => {
              const categories = getCategoriesForPlatform(platform)
              const platformCount = images.filter((i) => i.platform === platform).length
              const isActive = filterPlatform === platform && !filterCategory
              return (
                <div key={platform}>
                  <button
                    onClick={() => onSelectPlatform(platform)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm mb-0.5 ${isActive ? 'bg-white text-gray-900 font-medium' : 'text-gray-500 hover:bg-white hover:text-gray-800'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                      <path d={filterPlatform === platform ? 'M2 4l4 4 4-4' : 'M4 2l4 4-4 4'} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    <span className="truncate">{platform}</span>
                    <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{platformCount}</span>
                  </button>
                  {filterPlatform === platform && categories.map((cat) => {
                    const catCount = images.filter((i) => i.platform === platform && i.category === cat).length
                    const isCatActive = filterCategory === cat
                    return (
                      <button
                        key={cat}
                        onClick={() => onSelectPlatformCategory(platform, cat)}
                        className={`w-full flex items-center justify-between pl-7 pr-2 py-1.5 rounded-lg text-xs mb-0.5 ${isCatActive ? 'bg-white text-gray-900 font-medium' : 'text-gray-400 hover:bg-white hover:text-gray-700'}`}
                      >
                        <span className="truncate">{cat}</span>
                        <span className="text-xs text-gray-300 bg-gray-100 px-1.5 py-0.5 rounded-full">{catCount}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </>
        )}

        {allTags.length > 0 && (
          <>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-2 pt-3 pb-1">태그</p>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => onSelectTag(t)}
                className={`w-full flex items-center px-2 py-1.5 rounded-lg text-sm mb-0.5 ${filterTag === t ? 'bg-white text-gray-900 font-medium' : 'text-gray-500 hover:bg-white hover:text-gray-800'}`}
              >
                <span className="truncate"># {t}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </aside>
  )
}
