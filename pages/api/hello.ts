// pages/api/test.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase.auth.signUp({
    email: 'test123@gmail.com',
    password: 'testpass',
  })

  if (error) {
    console.error('[TEST] Signup Error:', error)
    return res.status(500).json({ message: error.message })
  }

  return res.status(200).json({ message: 'Signup berhasil', data })
}
