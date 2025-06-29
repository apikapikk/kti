// pages/api/auth/register.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'         // ✅ Untuk signup
import supabaseAdmin from '@/lib/supabaseAdmin'   // ✅ Untuk insert data ke table protected

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, password, nama, nim, kelas } = req.body

  if (!email || !password || !nama || !nim || !kelas) {
    return res.status(400).json({ message: 'Semua field harus diisi.' })
  }

  try {
    console.log('[REGISTER] Request body:', req.body)

    // ✅ SIGN UP via supabase client
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signupError || !signupData?.user) {
      console.error('[REGISTER] Signup error:', signupError)
      return res.status(500).json({ message: 'Gagal mendaftar', error: signupError?.message })
    }

    const userId = signupData.user.id

    // ✅ INSERT PROFILE via supabaseAdmin (bypass RLS)
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      nama,
      nim,
      kelas,
    })

    if (profileError) {
      console.error('[REGISTER] Profile insert error:', profileError)
      return res.status(500).json({ message: 'Gagal simpan data profil', error: profileError.message })
    }

    console.log('[REGISTER] Pendaftaran berhasil untuk:', email)
    return res.status(200).json({ message: 'Pendaftaran berhasil' })
  } catch (err) {
    console.error('[REGISTER] Unknown error:', err)
    if (err instanceof Error) {
    return res.status(500).json({ message: 'Terjadi kesalahan server.', error: err.message })
    }
    return res.status(500).json({ message: 'Terjadi kesalahan server.', error: String(err) })  
  }
}
