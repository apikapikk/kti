import { useState } from 'react'
import { useRouter } from 'next/router'
import styles from './login.module.css'
import { createClient } from '@supabase/supabase-js'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()

    if (res.ok) {
      // ✅ Set session dari server response ke Supabase client
      const { session, profile } = data
      if (session) {
        await supabase.auth.setSession(session)
        localStorage.setItem('kelas', profile.kelas)
      }
      router.push('/dashboard') // Redirect ke dashboard
    } else {
      setError(data.message || 'Gagal login')
    }

    setLoading(false)
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Login</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          className={styles.input}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? 'Memproses...' : 'Login'}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </form>
      <p className={styles.registerLink}>
        Belum punya akun?{' '}
        <span onClick={() => router.push('/register')} className={styles.link}>Daftar di sini</span>
      </p>
    </div>
  )
}
