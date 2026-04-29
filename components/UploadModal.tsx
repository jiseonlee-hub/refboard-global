'use client'

import { useState, useRef } from 'react'

type Props = {
  onClose: () => void
  onUploaded: () => void
}

export default function UploadModal({ onClose, onUploaded }: Props) {
  const [uploader, setUploader] = useState('')
  const [tags, setTags] = useState('')
  const [memo, setMemo] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    setFiles((prev) => [...prev, ...dropped])
  }

  const handleSubmit = async () => {
    if (!uploader.trim()) { setError('이름을 입력해주세요'); return }
    if (files.length === 0) { setError('이미지를 선택해주세요'); return }
    setUploading(true)
    setError('')
    for (let i = 0; i < files.length; i++) {
      const fd = new FormData()
      fd.append('file', files[i])
      fd.append('uploader', uploader.trim())
      fd.append('tags', tags)
      fd.append('memo', memo)
      const res = await fetch('/api/images', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || '업로드 실패')
        setUploading(false)
        return
      }
      setProgress(Math.round(((i + 1) / files.length) * 100))
    }
    onUploaded()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-md mx-4 p-5" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-medium text-gray-900 mb-4">이미지 업로드</h2>
        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors mb-4">
          {files.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-gray-700">{files.length}개 파일 선택됨</p>
              <p className="text-xs text-gray-400 mt-1 truncate">{files.map((f) => f.name).join(', ')}</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500">클릭하거나 이미지를 드래그해서 올리세요</p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WEBP 지원</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => setFiles(Array.from(e.target.files || []))} />
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 font-medium mb-1">이름 (누가 올리나요?)</label>
          <input type="text" value={uploader} onChange={(e) => setUploader(e.target.value)} placeholder="예: 지수" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 outline-none transition-colors" />
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 font-medium mb-1">태그 <span className="font-normal text-gray-400">(쉼표로 구분)</span></label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="예: 자연, 레퍼런스, 컬러" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 outline-none transition-colors" />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-gray-500 font-medium mb-1">메모 <span className="font-normal text-gray-400">(선택)</span></label>
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="참고 내용, 출처, 활용 방향 등..." rows={2} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-gray-400 outline-none transition-colors resize-none" />
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
          <button onClick={handleSubmit} disabled={uploading} className="flex-1 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">{uploading ? '업로드 중...' : '업로드'}</button>
        </div>
      </div>
    </div>
  )
}
