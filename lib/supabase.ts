import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Image = {
  id: string
  name: string
  url: string
  uploader: string
  tags: string[]
  memo: string
  created_at: string
}
