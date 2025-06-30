import type { NextApiRequest, NextApiResponse } from 'next'
import supabaseAdmin from '@/lib/supabaseAdmin'

type LockBody = {
  user_id: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ message: string }>
) {
  if (req.method !== 'POST') return res.status(405).end()

  const { user_id } = req.body as LockBody
  if (!user_id) {
    return res.status(400).json({ message: 'user_id wajib diisi' })
  }

  const { error } = await supabaseAdmin
    .from('divisi_pilihan')
    .update({ is_locked: true })
    .eq('user_id', user_id)

  if (error) {
    return res.status(500).json({ message: 'Gagal mengunci pilihan' })
  }

  return res.status(200).json({ message: 'Pilihan berhasil dikunci' })
}
