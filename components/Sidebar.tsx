'use client'

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  default: { bg: '#e6f1fb', text: '#0c447c' },
}

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

type Props = {
  uploaders: string[]
  tags: string[]
  filterUploader: string | null
  filterTag: string | null
  totalCount: number
  onSelectUploader: (u: string) => void
  onSelectTag: (t: string) => void
  onClear: () => void
}

export default function Sidebar({
  uploaders, tags, filterUploader, filterTag, totalCount,
  onSelectUploader, onSelectTag, onClear,
}: Props) {
  return (
    <aside className="w-44 flex-shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto">
      <div className="p-3">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-2 py-1">보기</p>
        <button
          onClick={onClear}
          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-sm mb-0.5 ${
            !filterUploader && !filterTag
              ? 'bg-white text-gray-900 font-medium'
              : 'text-gray-500 hover:bg-white hover:text-gray-800'
          }`}
        >
          <span>전체 이미지</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{totalCount}</span>
        </button>

        {uploaders.length > 0 && (
          <>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-2 pt-3 pb-1">팀원</p>
            {uploaders.map((u) => {
              const color = getUploaderColor(u, uploaders)
              return (
                <button
                  key={u}
                  onClick={() => onSelectUploader(u)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm mb-0.5 ${
                    filterUploader === u
                      ? 'bg-white text-gray-900 font-medium'
                      : 'text-gray-500 hover:bg-white hover:text-gray-800'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
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

        {tags.length > 0 && (
          <>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide px-2 pt-3 pb-1">태그</p>
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => onSelectTag(t)}
                className={`w-full flex items-center px-2 py-1.5 rounded-lg text-sm mb-0.5 ${
                  filterTag === t
                    ? 'bg-white text-gray-900 font-medium'
                    : 'text-gray-500 hover:bg-white hover:text-gray-800'
                }`}
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
