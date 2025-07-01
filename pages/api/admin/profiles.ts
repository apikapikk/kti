import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import supabaseAdmin from '@/lib/supabaseAdmin'

// Client hanya untuk validasi token user (dengan anon key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  // ✅ Validasi kelas = admin via service role
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('kelas')
    .eq('id', user.id)
    .single()

  if (error || !profile || profile.kelas !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin only' })
  }

  // ✅ Ambil semua data profil
  const { data: profiles, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (fetchError) return res.status(500).json({ error: fetchError.message })

  return res.status(200).json(profiles)
}
