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

function EditIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M7.5 1.5l2 2-6 6H1.5v-2l6-6z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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

type Props = {
  uploaders: string[]
  tags: string[]
  filterUploader: string | null
  filterTags: string[]
  totalCount: number
  onSelectUploader: (u: string | null) => void
  onToggleTag: (tag: string) => void
  onClear: () => void
  onRenameTag: (oldTag: string, newTag: string) => Promise<void>
}

export default function Sidebar({
  uploaders, tags, filterUploader, filterTags,
  totalCount, onSelectUploader, onToggleTag, onClear, onRenameTag
}: Props) {
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)
  const [renaming, setRenaming] = useState(false)

  const handleRename = async (oldTag: string, newTag: string) => {
    setRenaming(true)
    try { await onRenameTag(oldTag, newTag) }
    finally { setRenaming(false); setEditingTag(null) }
  }

  const isAll = !filterUploader && filterTags.length === 0

  return (
    <aside className="w-48 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
      <div className="p-3">

        {/* 전체 보기 */}
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-2 py-1">보기</p>
        <button
          onClick={onClear}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm mb-0.5 ${isAll ? 'bg-white text-gray-900 font-medium' : 'text-gray-500 hover:bg-white hover:text-gray-800'}`}
        >
          <span>전체 이미지</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{totalCount}</span>
        </button>

        {/* 업로더 */}
        {uploaders.length > 0 && (
          <>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-2 pt-3 pb-1">업로더</p>
            {uploaders.map((u) => {
              const color = getUploaderColor(u, uploaders)
              const isActive = filterUploader === u
              return (
                <button
                  key={u}
                  onClick={() => onSelectUploader(isActive ? null : u)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm mb-0.5 transition-colors ${isActive ? 'bg-white text-gray-900 font-medium' : 'text-gray-500 hover:bg-white hover:text-gray-800'}`}
                >
                  <span
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium border-2 border-white"
                    style={{ background: color.bg, color: color.text }}
                  >
                    {u[0]}
                  </span>
                  <span className="truncate">{u}</span>
                </button>
              )
            })}
          </>
        )}

        {/* 태그 (전체) */}
        {tags.length > 0 && (
          <>
            <div className="border-t border-gray-200 mt-3 mb-1" />
            <div className="flex items-center justify-between px-2 pt-2 pb-1">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                태그 <span className="normal-case font-normal">(전체)</span>
              </p>
              {filterTags.length > 0 && (
                <span className="text-xs bg-gray-900 text-white px-1.5 py-0.5 rounded-full">
                  {filterTags.length}
                </span>
              )}
            </div>
            {tags.map((tag) => (
              <div
                key={tag}
                className="mb-0.5"
                onMouseEnter={() => setHoveredTag(tag)}
                onMouseLeave={() => setHoveredTag(null)}
              >
                {editingTag === tag ? (
                  <TagRenameInput
                    tag={tag}
                    onConfirm={(v) => handleRename(tag, v)}
                    onCancel={() => setEditingTag(null)}
                  />
                ) : (
                  <div className="flex items-center">
                    <button
                      onClick={() => onToggleTag(tag)}
                      className={`flex-1 flex items-center justify-between px-2 py-1.5 rounded-lg text-sm transition-colors ${
                        filterTags.includes(tag)
                          ? 'bg-gray-900 text-white font-medium'
                          : 'text-gray-500 hover:bg-white hover:text-gray-800'
                      }`}
                    >
                      <span className="truncate"># {tag}</span>
                    </button>
                    {hoveredTag === tag && !renaming && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingTag(tag) }}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-gray-600 mr-1"
                      >
                        <EditIcon />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* 선택된 태그 해제 */}
            {filterTags.length > 0 && (
              <button
                onClick={onClear}
                className="w-full mt-2 px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 text-left underline"
              >
                태그 선택 해제
              </button>
            )}
          </>
        )}

      </div>
    </aside>
  )
}
