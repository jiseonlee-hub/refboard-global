import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// PATCH /api/tags — 태그 이름 일괄 변경
export async function PATCH(req: NextRequest) {
  try {
    const { oldTag, newTag } = await req.json()

    if (!oldTag || !newTag) {
      return NextResponse.json({ error: '태그 이름이 필요합니다' }, { status: 400 })
    }

    const trimmedNew = newTag.trim()
    if (!trimmedNew) {
      return NextResponse.json({ error: '새 태그 이름을 입력해주세요' }, { status: 400 })
    }

    if (oldTag === trimmedNew) {
      return NextResponse.json({ updated: 0 })
    }

    // 해당 태그를 가진 이미지 전체 조회
    const { data: images, error: fetchError } = await supabase
      .from('images')
      .select('id, tags')
      .contains('tags', [oldTag])

    if (fetchError) throw fetchError
    if (!images || images.length === 0) {
      return NextResponse.json({ updated: 0 })
    }

    // 각 이미지의 tags 배열에서 oldTag → newTag 교체
    const updates = images.map((img) => ({
      id: img.id,
      tags: (img.tags as string[]).map((t) => (t === oldTag ? trimmedNew : t)),
    }))

    for (const update of updates) {
      const { error } = await supabase
        .from('images')
        .update({ tags: update.tags })
        .eq('id', update.id)
      if (error) throw error
    }

    return NextResponse.json({ updated: updates.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '태그 수정 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
