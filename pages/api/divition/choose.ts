// pages/api/divisi/pilih.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { user_id, divisi_id } = req.body

  if (!user_id || !divisi_id) {
    return res.status(400).json({ message: 'Data tidak lengkap' })
  }

  // Cek apakah user sudah memilih
  const { data: existing } = await supabase
    .from('divisi_pilihan')
    .select('id')
    .eq('user_id', user_id)
    .maybeSingle()

  if (existing) {
    return res.status(400).json({ message: 'Kamu sudah memilih divisi.' })
  }

  // Cek kuota
  const { data: divisi } = await supabase
    .from('divisi')
    .select('kuota_total, kuota_terpakai')
    .eq('id', divisi_id)
    .maybeSingle()

  if (!divisi || divisi.kuota_terpakai >= divisi.kuota_total) {
    return res.status(400).json({ message: 'Kuota divisi penuh.' })
  }

  // Tambahkan pilihan user
  const { error: insertError } = await supabase.from('divisi_pilihan').insert({
    user_id,
    divisi_id
  })

    if (insertError) {
        console.error('Insert error:', insertError) // ⬅️ tambahkan log ini
        return res.status(500).json({ message: 'Gagal menyimpan pilihan.' })
    }
  // Update kuota
  await supabase
    .from('divisi')
    .update({ kuota_terpakai: divisi.kuota_terpakai + 1 })
    .eq('id', divisi_id)

  return res.status(200).json({ message: 'Berhasil memilih divisi.' })
}
