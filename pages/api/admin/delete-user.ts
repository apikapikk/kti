import type { NextApiRequest, NextApiResponse } from 'next'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import supabaseAdmin from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end()

  const supabase = createPagesServerClient({ req, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // 🔍 Cek apakah user yang login adalah admin
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('kelas')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.kelas !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Only admin can delete' })
  }

  const { user_id } = req.body

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' })
  }

  // ❌ Jangan izinkan admin menghapus dirinya sendiri
  if (user_id === user.id) {
    return res.status(400).json({ error: 'Tidak boleh menghapus akun admin sendiri.' })
  }

  // 🔥 Hapus user dari Supabase Auth
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

  if (deleteError) {
    console.error('Gagal hapus user:', deleteError)
    return res.status(500).json({ error: 'Gagal menghapus user' })
  }

  return res.status(200).json({ message: 'User berhasil dihapus' })
}
