'use client'

import { useEffect, useState } from 'react'
import { supabase, type Image } from '@/lib/supabase'
import ImageCard from '@/components/ImageCard'
import Sidebar from '@/components/Sidebar'
import ImageModal from '@/components/ImageModal'
import UploadModal from '@/components/UploadModal'

type Filter = {
  type: 'all' | 'uploader' | 'platform' | 'brand'
  value: string
}

export default function BoardPage() {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>({ type: 'all', value: '' })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'images' }, () => fetchImages())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleFilter = (f: Filter) => {
    setFilter(f)
    if (f.type === 'all') setSelectedTags([])
  }

  const filtered = images.filter((img) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      img.name.toLowerCase().includes(q) ||
      img.uploader.toLowerCase().includes(q) ||
      img.tags.some((t) => t.toLowerCase().includes(q)) ||
      (img.platform || '').toLowerCase().includes(q) ||
      (img.brand || '').toLowerCase().includes(q)

    let matchFilter = true
    if (filter.type === 'uploader') matchFilter = img.uploader === filter.value
    else if (filter.type === 'platform') matchFilter = img.platform === filter.value
    else if (filter.type === 'brand') matchFilter = img.brand === filter.value

    // 태그 다중 선택: 선택된 태그를 모두 포함하는 카드만 (AND)
    const matchTags = selectedTags.length === 0 || selectedTags.every(t => img.tags.includes(t))

    return matchSearch && matchFilter && matchTags
  })

  const hierarchy: { [platform: string]: { [brand: string]: string[] } } = {}
  for (const img of images) {
    const p = img.platform || '(미분류)'
    const b = img.brand || '(미분류)'
    if (!hierarchy[p]) hierarchy[p] = {}
    if (!hierarchy[p][b]) hierarchy[p][b] = []
    for (const tag of img.tags) {
      if (!hierarchy[p][b].includes(tag)) hierarchy[p][b].push(tag)
    }
  }
  const sortedHierarchy: typeof hierarchy = {}
  Object.keys(hierarchy).filter(k => k !== '(미분류)').sort().forEach(k => sortedHierarchy[k] = hierarchy[k])
  if (hierarchy['(미분류)']) sortedHierarchy['(미분류)'] = hierarchy['(미분류)']

  const uploaders = Array.from(new Set(images.map((i) => i.uploader)))

  const tagCountMap: { [tag: string]: number } = {}
  for (const img of images) {
    for (const tag of img.tags) {
      tagCountMap[tag] = (tagCountMap[tag] || 0) + 1
    }
  }
  const allTags = Object.entries(tagCountMap)
    .sort((a, b) => a[0].localeCompare(b[0], 'ko'))
    .map(([tag, count]) => ({ tag, count }))

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
    if (!res.ok) { const data = await res.json(); alert(data.error || '태그 수정 실패'); return }
    setSelectedTags(prev => prev.map(t => t === oldTag ? newTag : t))
    await fetchImages()
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 font-medium text-gray-900">
          <img src="/logo.png" alt="로고" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          해외 레퍼런스 보드
        </div>
        <div className="flex-1">
          <input type="text" placeholder="이미지, 태그, 플랫폼, 브랜드로 검색..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-400 transition-colors outline-none" />
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
          hierarchy={sortedHierarchy}
          allTags={allTags}
          totalCount={images.length}
          filter={filter}
          selectedTags={selectedTags}
          onFilter={handleFilter}
          onToggleTag={toggleTag}
          onRenameTag={handleRenameTag}
        />

        <main className="flex-1 overflow-y-auto p-4">
          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs text-gray-400">태그 필터:</span>
              {selectedTags.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-900 text-white rounded-full hover:bg-gray-700 transition-colors">
                  # {tag} <span className="opacity-70">×</span>
                </button>
              ))}
              <button onClick={() => setSelectedTags([])}
                className="text-xs text-gray-400 hover:text-gray-600 underline">
                전체 해제
              </button>
            </div>
          )}

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', alignItems: 'start' }}>
              {filtered.map((img) => (
                <ImageCard key={img.id} image={img} uploaders={uploaders} onClick={() => setSelectedImage(img)} />
              ))}
            </div>
          )}
        </main>
      </div>

      {selectedImage && (
        <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)}
          onDeleted={async () => { await fetchImages(); setSelectedImage(null) }} />
      )}
      {uploadOpen && (
        <UploadModal onClose={() => setUploadOpen(false)} onUploaded={() => { setUploadOpen(false); fetchImages() }} />
      )}
    </div>
  )
}
