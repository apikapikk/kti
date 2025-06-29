import { useState } from 'react'
import { useRouter } from 'next/router'
import styles from './register.module.css'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    password: '',
    nama: '',
    nim: '',
    kelas: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')
  setSuccess('')
    
  if (!form.email || !form.password || !form.nama || !form.nim || !form.kelas) {
    setError('Semua field harus diisi.')
    setLoading(false)
    return
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const contentType = res.headers.get('content-type')
    const data = contentType?.includes('application/json') ? await res.json() : {}

    if (res.ok) {
      //setSuccess('Pendaftaran berhasil! Silakan login.')
      setForm({ email: '', password: '', nama: '', nim: '', kelas: '' })
      router.push('/login')
    } else {
      setError(data.message || 'Terjadi kesalahan saat registrasi.')
    }
  } catch {
    setError('Kesalahan jaringan atau server.')
  }
  setLoading(false)
}



  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Register Mahasiswa</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input className={styles.input} name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input className={styles.input} name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required />
        <input className={styles.input} name="nama" placeholder="Nama Lengkap" value={form.nama} onChange={handleChange} required />
        <input
        className={styles.input}
        name="nim"
        placeholder="NIM"
        value={form.nim}
        onChange={handleChange}
        required
        />
        <select className={styles.select} name="kelas" value={form.kelas} onChange={handleChange} required>
        <option value="">Pilih Kelas</option>
        <option value="2A">2A</option>
        <option value="2B">2B</option>
        </select>
        <button className={styles.button} type="submit" disabled={loading}>{loading ? 'Mendaftar...' : 'Daftar'}</button>
        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.success}>{success}</p>}
      </form>
      <p className={styles.registerLink}>
        Sudah punya akun?{' '}
        <span onClick={() => router.push('/login')} className={styles.link}>Login di sini</span>
      </p>
    </div>
  )
}
