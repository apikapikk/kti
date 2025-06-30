import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import type { DivisiPilihan } from '../../../lib/divisiTypes'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // gunakan service role agar bisa baca semua
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DivisiPilihan[] | { error: string }>
) {
  // ambil data dengan join profiles dan divisi
  const { data, error } = await supabase
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
        id, nama
      )
    `)

  console.log('Raw data:', data)
  console.log('Error:', error)

  const formatted = (data ?? []).map((item) => ({
  ...item,
  profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
  divisi: Array.isArray(item.divisi) ? item.divisi[0] : item.divisi,
}))

return res.status(200).json(formatted as DivisiPilihan[])
}
