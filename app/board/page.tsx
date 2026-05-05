'use client'

import { useEffect, useState } from 'react'
import { supabase, type Image } from '@/lib/supabase'
import { getGroupTags, isParentTag } from '@/lib/tagGroups'
import ImageCard from '@/components/ImageCard'
import Sidebar from '@/components/Sidebar'
import ImageModal from '@/components/ImageModal'
import UploadModal from '@/components/UploadModal'

export default function BoardPage() {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterUploader, setFilterUploader] = useState<string | null>(null)
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<Image | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchImages = async () => {
    const { data } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setImages(data as Image[])
    setLoading(false)
  }

  useEffect(() => {
    fetchImages()
    const channel = supabase
      .channel('images-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'images' }, () => {
        fetchImages()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = images.filter((img) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      img.name.toLowerCase().includes(q) ||
      img.uploader.toLowerCase().includes(q) ||
      img.tags.some((t) => t.toLowerCase().includes(q))
    const matchUploader = !filterUploader || img.uploader === filterUploader

    // 선택된 태그가 여러 개일 때 AND 조건 (모든 태그를 가진 이미지만 표시)
    let matchTag = true
    if (filterTags.length > 0) {
      matchTag = filterTags.every((filterTag) => {
        if (isParentTag(filterTag)) {
          const groupTags = getGroupTags(filterTag)
          return img.tags.some((t) => groupTags.includes(t))
        }
        return img.tags.includes(filterTag)
      })
    }

    return matchSearch && matchUploader && matchTag
  })

  const uploaders = Array.from(new Set(images.map((i) => i.uploader)))
  const allTags = Array.from(new Set(images.flatMap((i) => i.tags))).sort((a, b) => a.localeCompare(b, 'ko')).sort((a, b) =>
    a.localeCompare(b, 'ko')
  )

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRenameTag = async (oldTag: string, newTag: string) => {
    const res = await fetch('/api/tags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldTag, newTag }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error || '태그 수정에 실패했습니다')
      return
    }
    // filterTags에 변경된 태그가 있으면 새 이름으로 교체
    if (filterTags.includes(oldTag)) {
      setFilterTags((prev) => prev.map((t) => (t === oldTag ? newTag : t)))
    }
    await fetchImages()
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <button
          onClick={() => { setFilterUploader(null); setFilterTags([]); setSearch('') }}
          className="flex items-center gap-2 font-medium text-gray-900 hover:opacity-70 transition-opacity"
        >
          <img src="/logo.png" alt="닥터포헤어" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          닥터포헤어 레퍼런스 보드
        </button>
        <div className="flex-1">
          <input
            type="text"
            placeholder="이미지, 태그, 업로더로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-400 transition-colors outline-none"
          />
        </div>
        <button onClick={copyLink} className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          {copied ? '✓ 복사됨' : '🔗 링크 복사'}
        </button>
        <button onClick={() => setUploadOpen(true)} className="text-sm px-4 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors">
          + 업로드
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          uploaders={uploaders}
          tags={allTags}
          filterUploader={filterUploader}
          filterTags={filterTags}
          totalCount={images.length}
          onSelectUploader={(u) => { setFilterUploader(u); setFilterTags([]) }}
          onToggleTag={(t) => {
            setFilterUploader(null)
            setFilterTags((prev) =>
              prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
            )
          }}
          onClear={() => { setFilterUploader(null); setFilterTags([]) }}
          onRenameTag={handleRenameTag}
        />

        <main className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
              <div className="text-4xl">📂</div>
              <div className="text-sm">이미지가 없습니다</div>
              <button onClick={() => setUploadOpen(true)} className="mt-2 text-sm px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                첫 이미지 업로드하기
              </button>
            </div>
          ) : (
            <div style={{ columnCount: 5, columnGap: '12px' }}>
              {filtered.map((img) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  uploaders={uploaders}
                  onClick={() => setSelectedImage(img)}
                  onTagClick={(tag) => {
                    setFilterUploader(null)
                    setFilterTags((prev) =>
                      prev.includes(tag) ? prev : [...prev, tag]
                    )
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDeleted={async () => { await fetchImages(); setSelectedImage(null) }}
          onTagClick={(tag) => {
            setFilterUploader(null)
            setFilterTags((prev) => prev.includes(tag) ? prev : [...prev, tag])
            setSelectedImage(null)
          }}
        />
      )}

      {uploadOpen && (
        <UploadModal
          onClose={() => setUploadOpen(false)}
          onUploaded={() => { setUploadOpen(false); fetchImages() }}
        />
      )}
    </div>
  )
}
