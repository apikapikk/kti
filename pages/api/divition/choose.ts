import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseAdmin from '@/lib/supabaseAdmin'

type ChooseBody = {
  user_id: string
  divisi_id: string
}

type Profile = {
  kelas: '2A' | '2B'
}

type Divisi = {
  id: string
  nama: string
  kuota_total: number
  kuota_terpakai_2a: number
  kuota_terpakai_2b: number
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

  // ✅ 1. Cek apakah user sudah memilih
  const { data: existing } = await supabaseAdmin
    .from('divisi_pilihan')
    .select('id')
    .eq('user_id', user_id)
    .maybeSingle()

  if (existing) {
    return res.status(400).json({ message: 'Kamu sudah memilih divisi.' })
  }

  // ✅ 2. Ambil profil user
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('kelas')
    .eq('id', user_id)
    .single<Profile>()

  if (profileError || !profile) {
    return res.status(400).json({ message: 'Gagal ambil data kelas user' })
  }

  const kelas = profile.kelas

  // ✅ 3. Ambil divisi
  const { data: divisi } = await supabaseAdmin
    .from('divisi')
    .select('*')
    .eq('id', divisi_id)
    .single<Divisi>()

  if (!divisi) {
    return res.status(404).json({ message: 'Divisi tidak ditemukan' })
  }

  const kuotaTerpakai = kelas === '2A' ? divisi.kuota_terpakai_2a : divisi.kuota_terpakai_2b
  const kuotaMax = kelas === '2A'
    ? Math.ceil(divisi.kuota_total / 2)
    : Math.floor(divisi.kuota_total / 2)

  if (kuotaTerpakai >= kuotaMax) {
    return res.status(400).json({ message: `Kuota divisi ${divisi.nama} untuk kelas ${kelas} sudah penuh.` })
  }

  // ✅ 4. Masukkan data baru, dan update kuota
  const insertRes = await supabaseAdmin
    .from('divisi_pilihan')
    .insert({
      user_id,
      divisi_id,
      is_locked: false
    })
    .select()

  if (insertRes.error) {
    if (insertRes.error.code === '23505') { // kode unique_violation Postgres
      return res.status(400).json({ message: 'Kamu sudah memilih sebelumnya (cepat banget kliknya 😅).' })
    }

    return res.status(500).json({ message: 'Gagal menyimpan pilihan' })
  }

  const kolomUpdate = kelas === '2A' ? 'kuota_terpakai_2a' : 'kuota_terpakai_2b'

  await supabaseAdmin
    .from('divisi')
    .update({ [kolomUpdate]: kuotaTerpakai + 1 })
    .eq('id', divisi_id)

  return res.status(200).json({ message: 'Pilihan berhasil disimpan' })
}

