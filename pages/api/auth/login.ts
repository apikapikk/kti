// File: /api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { email, password } = req.body

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    return res.status(401).json({ message: error?.message || 'Login gagal' })
  }

  // 🔽 Ambil profil berdasarkan ID user (hanya 1 baris, sesuai RLS)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('nama, nim, kelas')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    return res.status(500).json({ message: 'Gagal mengambil data profil' })
  }

  return res.status(200).json({
    message: 'Login berhasil',
    user: data.user,
    session: data.session,
    profile,
  })
}
