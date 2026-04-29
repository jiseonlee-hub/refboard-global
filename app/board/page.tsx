'use client'

import { useEffect, useState } from 'react'
import { supabase, type Image } from '@/lib/supabase'
import ImageCard from '@/components/ImageCard'
import GlobalSidebar from '@/components/GlobalSidebar'
import ImageModal from '@/components/ImageModal'
import GlobalUploadModal from '@/components/GlobalUploadModal'

export default function BoardPage() {
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)
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
    const matchSearch = !q || img.name.toLowerCase().includes(q) ||
      img.uploader.toLowerCase().includes(q) ||
      img.platform.toLowerCase().includes(q) ||
      img.category.toLowerCase().includes(q) ||
      img.tags.some((t) => t.toLowerCase().includes(q))
    const matchPlatform = !filterPlatform || img.platform === filterPlatform
    const matchCategory = !filterCategory || img.category === filterCategory
    const matchTag = !filterTag || img.tags.includes(filterTag)
    return matchSearch && matchPlatform && matchCategory && matchTag
  })

  const uploaders = Array.from(new Set(images.map((i) => i.uploader)))

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 font-medium text-gray-900">
          <img src="/logo.png" alt="닥터포헤어" style={{width:'28px',height:'28px',objectFit:'contain'}} />
          해외 레퍼런스 보드
        </div>
        <div className="flex-1">
          <input
            type="text"
            placeholder="플랫폼, 카테고리, 태그로 검색..."
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
        <GlobalSidebar
          images={images}
          filterPlatform={filterPlatform}
          filterCategory={filterCategory}
          filterTag={filterTag}
          totalCount={images.length}
          onSelectPlatform={(p) => { setFilterPlatform(p); setFilterCategory(null); setFilterTag(null) }}
          onSelectPlatformCategory={(p, c) => { setFilterPlatform(p); setFilterCategory(c); setFilterTag(null) }}
          onSelectTag={(t) => { setFilterTag(t); setFilterPlatform(null); setFilterCategory(null) }}
          onClear={() => { setFilterPlatform(null); setFilterCategory(null); setFilterTag(null) }}
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
            <div style={{ columnCount: 4, columnGap: '12px' }}>
              {filtered.map((img) => (
                <ImageCard key={img.id} image={img} uploaders={uploaders} onClick={() => setSelectedImage(img)} />
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
        />
      )}

      {uploadOpen && (
        <GlobalUploadModal
          onClose={() => setUploadOpen(false)}
          onUploaded={() => { setUploadOpen(false); fetchImages() }}
        />
      )}
    </div>
  )
}
