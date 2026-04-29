'use client'

import Image from 'next/image'
import type { Image as ImageType } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

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
  const [editing, setEditing] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>(image.tags)
  const [tagInput, setTagInput] = useState('')
  const [memoInput, setMemoInput] = useState(image.memo || '')
  const [saving, setSaving] = useState(false)
  const [existingTags, setExistingTags] = useState<string[]>([])

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('images').select('tags')
      if (data) {
        const all = Array.from(new Set(data.flatMap((d) => d.tags))) as string[]
        setExistingTags(all)
      }
    }
    fetch()
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const addCustomTag = () => {
    const t = tagInput.trim()
    if (t && !selectedTags.includes(t)) setSelectedTags((prev) => [...prev, t])
    setTagInput('')
  }

  const handleDelete = async () => {
    if (!confirm('이 이미지를 삭제할까요?')) return
    setDeleting(true)
    const fileName = image.url.split('/').pop()!
    await supabase.storage.from('images').remove([fileName])
    await supabase.from('images').delete().eq('id', image.id)
    onDeleted()
    onClose()
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('images')
      .update({ tags: selectedTags, memo: memoInput })
      .eq('id', image.id)
    if (!error) {
      setSaving(false)
      setEditing(false)
      onDeleted()
    } else {
      setSaving(false)
      alert('저장 실패: ' + error.message)
    }
  }

  const date = new Date(image.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const allTags = Array.from(new Set([...existingTags, ...selectedTags]))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full bg-gray-100" style={{ aspectRatio: '16/9' }}>
          <Image src={image.url} alt={image.name} fill className="object-contain" unoptimized />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <p className="font-medium text-gray-900 text-sm">{image.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{image.uploader} · {date}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <a href={image.url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                원본 보기
              </a>
              {!editing && (
                <button onClick={() => setEditing(true)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  수정
                </button>
              )}
              <button onClick={handleDelete} disabled={deleting} className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">태그</p>
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {allTags.map((t) => (
                      <button
                        key={t}
                        onClick={() => toggleTag(t)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          selectedTags.includes(t)
                            ? tagColor(t) + ' border-transparent font-medium'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                    placeholder="새 태그 입력 후 Enter"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 outline-none"
                  />
                  <button onClick={addCustomTag} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">추가</button>
                </div>
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedTags.map((t) => (
                      <span key={t} className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${tagColor(t)}`}>
                        {t}
                        <button onClick={() => setSelectedTags(selectedTags.filter((x) => x !== t))} className="opacity-60 hover:opacity-100">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">메모</p>
                <textarea
                  value={memoInput}
                  onChange={(e) => setMemoInput(e.target.value)}
                  rows={2}
                  placeholder="메모를 입력하세요..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 outline-none resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setSelectedTags(image.tags); setMemoInput(image.memo || '') }} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">취소</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50">
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {memoInput && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">메모</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{memoInput}</p>
                </div>
              )}
              {selectedTags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1.5">태그</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTags.map((tag) => (
                      <span key={tag} className={`text-xs px-2 py-1 rounded-full ${tagColor(tag)}`}>{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
