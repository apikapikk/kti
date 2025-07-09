// File: /api/divition/cancel.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseAdmin from '@/lib/supabaseAdmin'

type CancelBody = {
  user_id: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string }>
) {
  if (req.method !== 'POST') return res.status(405).end()

  const { user_id } = req.body as CancelBody
  if (!user_id) {
    return res.status(400).json({ message: 'user_id wajib diisi' })
  }

  // 1. Ambil pilihan divisi yang sudah dibuat user
  const { data: pilihan, error: pilihanError } = await supabaseAdmin
    .from('divisi_pilihan')
    .select('divisi_id')
    .eq('user_id', user_id)
    .maybeSingle()

  if (pilihanError || !pilihan) {
    return res.status(400).json({ message: 'Kamu belum memilih divisi.' })
  }

  // 2. Ambil divisi terkait
  const { data: divisi } = await supabaseAdmin
    .from('divisi')
    .select('kuota_terpakai')
    .eq('id', pilihan.divisi_id)
    .maybeSingle()

  if (!divisi) {
    return res.status(404).json({ message: 'Divisi tidak ditemukan' })
  }

  // 3. Hapus data pilihan
  const deleteRes = await supabaseAdmin
    .from('divisi_pilihan')
    .delete()
    .eq('user_id', user_id)

  if (deleteRes.error) {
    return res.status(500).json({ message: 'Gagal membatalkan pilihan' })
  }

  // 4. Kurangi kuota_terpakai
  await supabaseAdmin
    .from('divisi')
    .update({ kuota_terpakai: Math.max(divisi.kuota_terpakai - 1, 0) }) // jaga-jaga biar tidak minus
    .eq('id', pilihan.divisi_id)

  return res.status(200).json({ message: 'Pilihan berhasil dibatalkan' })
}
