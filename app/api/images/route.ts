import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const uploader = (formData.get('uploader') as string) || '익명'
    const tagsRaw = formData.get('tags') as string
    const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : []
    const memo = (formData.get('memo') as string) || ''
    const platform = (formData.get('platform') as string) || ''
    const category = (formData.get('category') as string) || ''

    if (!file) return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })

    const ext = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(fileName, file, { contentType: file.type })

    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('images').getPublicUrl(fileName)

    const { data, error: dbError } = await supabase
      .from('images')
      .insert({ name: file.name, url: urlData.publicUrl, uploader, tags, memo, platform, category })
      .select()
      .single()

    if (dbError) throw dbError

    return NextResponse.json({ image: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '업로드 실패'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
