import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import supabaseAdmin from '@/lib/supabaseAdmin'

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

  // Validasi admin
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('kelas')
    .eq('id', user.id)
    .single()

  if (error || !profile || profile.kelas !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin only' })
  }

  // Ambil data divisi
  const { data, error: dataError } = await supabaseAdmin
    .from('divisi_pilihan')
    .select(`
      id,
      user_id,
      divisi_id,
      created_at,
      is_locked,
      profile:profiles!divisi_pilihan_profiles_fkey (
        id, nama, nim, kelas
      ),
      divisi (
        id, nama, kuota_total, kuota_terpakai
      )
    `)

  if (dataError) return res.status(500).json({ error: dataError.message })

  const formatted = (data ?? []).map((item) => ({
    ...item,
    profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
    divisi: Array.isArray(item.divisi) ? item.divisi[0] : item.divisi,
  }))

  return res.status(200).json(formatted)
}
