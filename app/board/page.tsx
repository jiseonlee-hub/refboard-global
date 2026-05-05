'use client'

import { useEffect, useState } from 'react'
import { supabase, type Image } from '@/lib/supabase'
import ImageCard from '@/components/ImageCard'
import Sidebar from '@/components/Sidebar'
import ImageModal from '@/components/ImageModal'
import UploadModal from '@/components/UploadModal'

type Filter = {
  type: 'all' | 'uploader' | 'platform' | 'brand' | 'tag' | 'brand_tag'
  value: string
  value2?: string  // brand_tag일 때 tag값
}

export default function BoardPage() {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>({ type: 'all', value: '' })
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
    else if (filter.type === 'tag') matchFilter = img.tags.includes(filter.value)
    else if (filter.type === 'brand_tag') matchFilter = img.brand === filter.value && img.tags.includes(filter.value2 ?? '')

    return matchSearch && matchFilter
  })

  // 플랫폼 > 브랜드 > 태그 계층 구조 생성
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
  // (미분류)는 맨 뒤로
  const sortedHierarchy: typeof hierarchy = {}
  Object.keys(hierarchy).filter(k => k !== '(미분류)').sort().forEach(k => sortedHierarchy[k] = hierarchy[k])
  if (hierarchy['(미분류)']) sortedHierarchy['(미분류)'] = hierarchy['(미분류)']

  const uploaders = Array.from(new Set(images.map((i) => i.uploader)))

  // 전체 태그 + 사용 횟수
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
    if (filter.type === 'tag' && filter.value === oldTag) setFilter({ type: 'tag', value: newTag })
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
          onFilter={setFilter}
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
