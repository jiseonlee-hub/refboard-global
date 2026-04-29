'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const TAG_COLORS = ['bg-blue-50 text-blue-800','bg-green-50 text-green-800','bg-purple-50 text-purple-800','bg-orange-50 text-orange-800','bg-pink-50 text-pink-800','bg-teal-50 text-teal-800']
function tagColor(tag: string) { let h = 0; for (const c of tag) h = (h * 31 + c.charCodeAt(0)) % TAG_COLORS.length; return TAG_COLORS[h] }

function PillInput({ label, hint, value, onSet, inputVal, setInputVal, existing }: {
  label: string; hint?: string; value: string; onSet: (v: string) => void
  inputVal: string; setInputVal: (v: string) => void; existing: string[]
}) {
  const handleAdd = () => { const t = inputVal.trim(); if (t) onSet(t); setInputVal('') }
  return (
    <div className="mb-3">
      <label className="block text-xs text-gray-500 font-medium mb-1.5">
        {label} {hint && <span className="font-normal text-gray-400">{hint}</span>}
      </label>
      {existing.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {existing.map((v) => (
            <button key={v} onClick={() => onSet(v)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${value === v ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              {v}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input type="text" value={inputVal} onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          placeholder="직접 입력 후 Enter"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 outline-none transition-colors" />
        <button onClick={handleAdd} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">추가</button>
      </div>
      {value && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 bg-gray-100 text-gray-700">
            {value}
            <button onClick={() => onSet('')} className="opacity-60 hover:opacity-100">×</button>
          </span>
        </div>
      )}
    </div>
  )
}

type Props = { onClose: () => void; onUploaded: () => void }

export default function UploadModal({ onClose, onUploaded }: Props) {
  const [platform, setPlatform] = useState('')
  const [platformInput, setPlatformInput] = useState('')
  const [brand, setBrand] = useState('')
  const [brandInput, setBrandInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [memo, setMemo] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [existingPlatforms, setExistingPlatforms] = useState<string[]>([])
  const [existingBrands, setExistingBrands] = useState<string[]>([])
  const [existingTags, setExistingTags] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('images').select('platform, brand, tags')
      if (data) {
        setExistingPlatforms(Array.from(new Set(data.map((d) => d.platform).filter(Boolean))))
        setExistingBrands(Array.from(new Set(data.map((d) => d.brand).filter(Boolean))))
        setExistingTags(Array.from(new Set(data.flatMap((d) => d.tags).filter(Boolean))))
      }
    }
    fetch()
  }, [])

  const toggleTag = (tag: string) => setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  const addTag = () => { const t = tagInput.trim(); if (t && !tags.includes(t)) setTags(prev => [...prev, t]); setTagInput('') }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))])
  }

  const handleSubmit = async () => {
    if (files.length === 0) { setError('이미지를 선택해주세요'); return }
    setUploading(true); setError('')
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData()
      fd.append('file', files[i])
      fd.append('uploader', '')
      fd.append('platform', platform.trim())
      fd.append('brand', brand.trim())
      fd.append('tags', tags.join(','))
      fd.append('memo', memo)
      const res = await fetch('/api/images', { method: 'POST', body: fd })
      if (!res.ok) { const d = await res.json(); setError(d.error || '업로드 실패'); setUploading(false); return }
      setProgress(Math.round(((i + 1) / files.length) * 100))
    }
    onUploaded()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md mx-4 p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-medium text-gray-900 mb-4">이미지 업로드</h2>

        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors mb-4">
          {files.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-gray-700">{files.length}개 파일 선택됨</p>
              <p className="text-xs text-gray-400 mt-1 truncate">{files.map(f => f.name).join(', ')}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500">클릭하거나 이미지를 드래그해서 올리세요</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WEBP 지원</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
        </div>

        <PillInput label="플랫폼" hint="(예: 세포라, 올리브영)" value={platform} onSet={setPlatform} inputVal={platformInput} setInputVal={setPlatformInput} existing={existingPlatforms} />
        <PillInput label="브랜드" hint="(예: 나이키, 라네즈)" value={brand} onSet={setBrand} inputVal={brandInput} setInputVal={setBrandInput} existing={existingBrands} />

        <div className="mb-3">
          <label className="block text-xs text-gray-500 font-medium mb-1.5">태그</label>
          {existingTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {existingTags.map((t) => (
                <button key={t} onClick={() => toggleTag(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${tags.includes(t) ? tagColor(t) + ' border-transparent font-medium' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                  {t}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              placeholder="새 태그 입력 후 Enter"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 outline-none transition-colors" />
            <button onClick={addTag} className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">추가</button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((t) => (
                <span key={t} className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${tagColor(t)}`}>
                  {t}
                  <button onClick={() => setTags(tags.filter(x => x !== t))} className="opacity-60 hover:opacity-100">×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-500 font-medium mb-1">메모 <span className="font-normal text-gray-400">(선택)</span></label>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="참고 내용, 출처, 활용 방향 등..." rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 outline-none transition-colors resize-none" />
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        {uploading && (
          <div className="mb-3">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1 text-right">{progress}%</p>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">취소</button>
          <button onClick={handleSubmit} disabled={uploading} className="flex-1 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </div>
    </div>
  )
}
