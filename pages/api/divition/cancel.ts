import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseAdmin from '@/lib/supabaseAdmin'

type CancelBody = {
  user_id: string
  divisi_id: string
}

type Profile = {
  kelas: '2A' | '2B'
}

type Divisi = {
  kuota_terpakai_2a: number
  kuota_terpakai_2b: number
}

type Pilihan = {
  is_locked: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string }>
) {
  if (req.method !== 'POST') {
  return res.status(405).json({ message: 'Method not allowed' }) // ✅ fix!
}

  const { user_id, divisi_id } = req.body as CancelBody
  if (!user_id || !divisi_id) {
    return res.status(400).json({ message: 'user_id dan divisi_id wajib diisi' })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('kelas')
    .eq('id', user_id)
    .single<Profile>()

  const kelas = profile?.kelas ?? null
  if (!kelas) {
    return res.status(400).json({ message: 'Gagal ambil data kelas user' })
  }

  const { data: pilihan } = await supabaseAdmin
    .from('divisi_pilihan')
    .select('is_locked')
    .eq('user_id', user_id)
    .eq('divisi_id', divisi_id)
    .single<Pilihan>()

  if (!pilihan) {
    return res.status(404).json({ message: 'Pilihan tidak ditemukan' })
  }

  if (pilihan.is_locked) {
    return res.status(403).json({ message: 'Pilihan sudah terkunci, tidak bisa dibatalkan' })
  }

  const kolomKuota = kelas === '2A' ? 'kuota_terpakai_2a' : 'kuota_terpakai_2b'

  const { data: divisi } = await supabaseAdmin
    .from('divisi')
    .select(kolomKuota)
    .eq('id', divisi_id)
    .single<Divisi>()

  const kuotaLama = kelas === '2A' ? divisi?.kuota_terpakai_2a : divisi?.kuota_terpakai_2b
  const kuotaBaru = Math.max((kuotaLama ?? 1) - 1, 0)

  await supabaseAdmin
    .from('divisi')
    .update({ [kolomKuota]: kuotaBaru })
    .eq('id', divisi_id)

  await supabaseAdmin
    .from('divisi_pilihan')
    .delete()
    .eq('user_id', user_id)
    .eq('divisi_id', divisi_id)

  return res.status(200).json({ message: 'Pilihan berhasil dibatalkan' })
}

