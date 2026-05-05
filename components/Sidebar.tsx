'use client'

import { useState, useRef, useEffect } from 'react'

const UPLOADER_COLORS = [
  { bg: '#e6f1fb', text: '#0c447c' },
  { bg: '#eaf3de', text: '#27500a' },
  { bg: '#eeedfe', text: '#3c3489' },
  { bg: '#faece7', text: '#712b13' },
  { bg: '#faeeda', text: '#633806' },
  { bg: '#e1f5ee', text: '#085041' },
]

export function getUploaderColor(uploader: string, uploaders: string[]) {
  const idx = uploaders.indexOf(uploader) % UPLOADER_COLORS.length
  return UPLOADER_COLORS[idx] || UPLOADER_COLORS[0]
}

type HierarchyData = { [platform: string]: { [brand: string]: string[] } }
type Filter = { type: 'all' | 'uploader' | 'platform' | 'brand'; value: string }

type Props = {
  uploaders: string[]
  hierarchy: HierarchyData
  allTags: { tag: string; count: number }[]
  totalCount: number
  filter: Filter
  filterTags: string[]
  onFilter: (f: Filter) => void
  onToggleTag: (tag: string) => void
  onRenameTag: (oldTag: string, newTag: string) => Promise<void>
}

function TagRenameInput({ tag, onConfirm, onCancel }: { tag: string; onConfirm: (v: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(tag)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select() }, [])
  const confirm = () => { const t = value.trim(); if (t && t !== tag) onConfirm(t); else onCancel() }
  return (
    <div className="flex items-center gap-1 px-1 py-1 w-full">
      <input ref={inputRef} type="text" value={value} onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') onCancel() }}
        className="flex-1 min-w-0 text-xs px-1.5 py-1 border border-blue-300 rounded bg-white outline-none text-gray-800" />
      <button onClick={confirm} className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-blue-500 hover:text-blue-700">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <button onClick={onCancel} className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
      </button>
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d={open ? 'M2 3.5l3 3 3-3' : 'M3.5 2l3 3-3 3'} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M7.5 1.5l2 2-6 6H1.5v-2l6-6z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Sidebar({ uploaders, hierarchy, allTags, totalCount, filter, filterTags, onFilter, onToggleTag, onRenameTag }: Props) {
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set())
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set())
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)

  const togglePlatform = (p: string) => setExpandedPlatforms(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n })
  const toggleBrand = (b: string) => setExpandedBrands(prev => { const n = new Set(prev); n.has(b) ? n.delete(b) : n.add(b); return n })

  const handleRename = async (oldTag: string, newTag: string) => {
    setRenaming(true)
    try { await onRenameTag(oldTag, newTag) }
    finally { setRenaming(false); setEditingTag(null) }
  }

  const isActive = (type: Filter['type'], value: string) => filter.type === type && filter.value === value

  return (
    <aside className="w-48 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
      <div className="p-3">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-2 py-1">보기</p>
        <button onClick={() => onFilter({ type: 'all', value: '' })}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm mb-0.5 ${filter.type === 'all' && filterTags.length === 0 ? 'bg-white text-gray-900 font-medium' : 'text-gray-500 hover:bg-white hover:text-gray-800'}`}>
          <span>전체 이미지</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{totalCount}</span>
        </button>

        {/* 플랫폼 > 브랜드 > 태그 계층 */}
        {Object.keys(hierarchy).length > 0 && (
          <>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-2 pt-3 pb-1">플랫폼</p>
            {Object.entries(hierarchy).map(([platform, brands]) => {
              const isPlatformOpen = expandedPlatforms.has(platform)
              return (
                <div key={platform}>
                  <div className="flex items-center mb-0.5">
                    <button onClick={() => togglePlatform(platform)} className="flex-shrink-0 w-5 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600">
                      <Chevron open={isPlatformOpen} />
                    </button>
                    <button onClick={() => onFilter({ type: 'platform', value: platform })}
                      className={`flex-1 flex items-center gap-1 px-1.5 py-1.5 rounded-lg text-sm ${isActive('platform', platform) ? 'bg-white text-gray-900 font-medium' : 'text-gray-500 hover:bg-white hover:text-gray-800'}`}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 opacity-40">
                        <rect x="1" y="2" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1" fill="none" />
                        <path d="M1 5h10" stroke="currentColor" strokeWidth="1" />
                      </svg>
                      <span className="truncate">{platform}</span>
                    </button>
                  </div>
                  {isPlatformOpen && (
                    <div className="pl-5">
                      {Object.entries(brands).map(([brand, tags]) => {
                        const brandKey = `${platform}__${brand}`
                        const isBrandOpen = expandedBrands.has(brandKey)
                        return (
                          <div key={brand}>
                            <div className="flex items-center mb-0.5">
                              <button onClick={() => toggleBrand(brandKey)} className="flex-shrink-0 w-5 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600">
                                <Chevron open={isBrandOpen} />
                              </button>
                              <button onClick={() => onFilter({ type: 'brand', value: brand })}
                                className={`flex-1 flex items-center gap-1 px-1.5 py-1.5 rounded-lg text-sm ${isActive('brand', brand) ? 'bg-white text-gray-900 font-medium' : 'text-gray-500 hover:bg-white hover:text-gray-800'}`}>
                                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="flex-shrink-0 opacity-40">
                                  <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1" fill="none" />
                                </svg>
                                <span className="truncate">{brand}</span>
                              </button>
                            </div>
                            {isBrandOpen && tags.length > 0 && (
                              <div className="pl-5">
                                {tags.map((tag) => (
                                  <div key={tag} className="mb-0.5" onMouseEnter={() => setHoveredTag(`brand_${brand}_${tag}`)} onMouseLeave={() => setHoveredTag(null)}>
                                    <div className="flex items-center">
                                      <button onClick={() => onToggleTag(tag)}
                                        className={`flex-1 flex items-center px-2 py-1.5 rounded-lg text-xs transition-colors ${
                                          filterTags.includes(tag)
                                            ? 'bg-gray-900 text-white font-medium'
                                            : 'text-gray-400 hover:bg-white hover:text-gray-700'
                                        }`}>
                                        <span className="truncate"># {tag}</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* 전체 태그 */}
        {allTags.length > 0 && (
          <>
            <div className="border-t border-gray-200 mt-3 mb-1" />
            <div className="flex items-center justify-between px-2 pt-2 pb-1">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                태그 <span className="normal-case font-normal">(전체)</span>
              </p>
              {filterTags.length > 0 && (
                <span className="text-xs bg-gray-900 text-white px-1.5 py-0.5 rounded-full">{filterTags.length}</span>
              )}
            </div>
            {allTags.map(({ tag, count }) => (
              <div key={tag} className="mb-0.5" onMouseEnter={() => setHoveredTag(`global_${tag}`)} onMouseLeave={() => setHoveredTag(null)}>
                {editingTag === `global_${tag}` ? (
                  <TagRenameInput tag={tag} onConfirm={(v) => handleRename(tag, v)} onCancel={() => setEditingTag(null)} />
                ) : (
                  <div className="flex items-center">
                    <button onClick={() => onToggleTag(tag)}
                      className={`flex-1 flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
                        filterTags.includes(tag)
                          ? 'bg-gray-900 text-white font-medium'
                          : 'text-gray-500 hover:bg-white hover:text-gray-800'
                      }`}>
                      <span className="truncate"># {tag}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1 ${
                        filterTags.includes(tag) ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'
                      }`}>{count}</span>
                    </button>
                    {hoveredTag === `global_${tag}` && !renaming && (
                      <button onClick={(e) => { e.stopPropagation(); setEditingTag(`global_${tag}`) }} className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-600 mr-1">
                        <EditIcon />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  )
}
