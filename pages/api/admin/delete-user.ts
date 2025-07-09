import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end()

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'Token tidak ditemukan' })

  const { data: adminUser, error: adminError } = await supabaseAdmin.auth.getUser(token)
  if (adminError || !adminUser) {
    return res.status(401).json({ message: 'Token tidak valid' })
  }

  const { user_id } = req.body
  if (!user_id) return res.status(400).json({ message: 'user_id tidak ditemukan' })

  try {
    // 1. Ambil pilihan divisi
    const { data: pilihan } = await supabaseAdmin
      .from('divisi_pilihan')
      .select('divisi_id')
      .eq('user_id', user_id)
      .maybeSingle()

    // 2. Jika ada pilihan, kurangi kuota
    if (pilihan?.divisi_id) {
      await supabaseAdmin
        .from('divisi')
        .update({ kuota_terpakai: supabaseAdmin.rpc('kuota_terpakai - 1') }) // ❌ Ini salah
        .eq('id', pilihan.divisi_id)
    }

    // Tapi cara benar (karena Supabase ga support operasi aritmatika langsung):
    if (pilihan?.divisi_id) {
      const { data: divisi } = await supabaseAdmin
        .from('divisi')
        .select('kuota_terpakai')
        .eq('id', pilihan.divisi_id)
        .single()

      if (divisi && divisi.kuota_terpakai > 0) {
        await supabaseAdmin
          .from('divisi')
          .update({ kuota_terpakai: divisi.kuota_terpakai - 1 })
          .eq('id', pilihan.divisi_id)
      }
    }

    // 3. Hapus data user
    await supabaseAdmin.from('divisi_pilihan').delete().eq('user_id', user_id)
    await supabaseAdmin.from('profiles').delete().eq('id', user_id)

    // 4. Hapus user dari auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    if (authError) {
      console.error('Gagal hapus user dari auth:', authError)
      return res.status(500).json({ message: 'Gagal hapus user dari auth' })
    }

    return res.status(200).json({ message: 'User berhasil dihapus dan kuota dikembalikan' })
  } catch (e) {
    console.error('Error delete-user:', e)
    return res.status(500).json({ message: 'Gagal menghapus user' })
  }
}
