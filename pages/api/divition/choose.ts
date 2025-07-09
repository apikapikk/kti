// File: /api/divition/choose.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseAdmin from '@/lib/supabaseAdmin'

type ChooseBody = {
  user_id: string
  divisi_id: string
}

type Divisi = {
  id: string
  nama: string
  kuota_total: number
  kuota_terpakai: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string }>
) {
  if (req.method !== 'POST') return res.status(405).end()

  const { user_id, divisi_id } = req.body as ChooseBody
  if (!user_id || !divisi_id) {
    return res.status(400).json({ message: 'user_id dan divisi_id wajib diisi' })
  }

  // 1. Cek apakah user sudah memilih
  const { data: existing } = await supabaseAdmin
    .from('divisi_pilihan')
    .select('id')
    .eq('user_id', user_id)
    .maybeSingle()

  if (existing) {
    return res.status(400).json({ message: 'Kamu sudah memilih divisi.' })
  }

  // 2. Ambil data divisi
  const { data: divisi } = await supabaseAdmin
    .from('divisi')
    .select('*')
    .eq('id', divisi_id)
    .single<Divisi>()

  if (!divisi) {
    return res.status(404).json({ message: 'Divisi tidak ditemukan' })
  }

  if (divisi.kuota_terpakai >= divisi.kuota_total) {
    return res.status(400).json({ message: `Kuota divisi ${divisi.nama} sudah penuh.` })
  }

  // 3. Simpan pilihan user
  const insertRes = await supabaseAdmin
    .from('divisi_pilihan')
    .insert({
      user_id,
      divisi_id,
      is_locked: false
    })
    .select()

  if (insertRes.error) {
    if (insertRes.error.code === '23505') {
      return res.status(400).json({ message: 'Kamu sudah memilih sebelumnya (cepat banget kliknya 😅).' })
    }

    return res.status(500).json({ message: 'Gagal menyimpan pilihan' })
  }

  // 4. Update kuota_terpakai
  await supabaseAdmin
    .from('divisi')
    .update({ kuota_terpakai: divisi.kuota_terpakai + 1 })
    .eq('id', divisi_id)

  return res.status(200).json({ message: 'Pilihan berhasil disimpan' })
}
