import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import styles from './dashboard.module.css'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type SupabaseUser = {
  id: string
  email: string
}

type Divisi = {
  id: string
  nama: string
  kuota_total: number
  kuota_terpakai: number
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [divisi, setDivisi] = useState<Divisi[]>([])
  const [pilihan, setPilihan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) {
        router.push('/login')
        return
      }

      setUser({
        id: userData.user.id,
        email: userData.user.email ?? 'tanpa email'
      })

      const { data: divisiList } = await supabase
        .from('divisi')
        .select('*')
        .order('nama', { ascending: true })

      const { data: pilihanData } = await supabase
        .from('divisi_pilihan')
        .select('divisi_id')
        .eq('user_id', userData.user.id)
        .maybeSingle()

      setDivisi(divisiList || [])
      setPilihan(pilihanData?.divisi_id || null)
      setLoading(false)
    }

    fetchData()
  }, [router])

  const handlePilih = async (divisi_id: string) => {
    if (!user) return

    const res = await fetch('/api/divition/choose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user.id,
        divisi_id
      })
    })

    let data: { message?: string } | null = null
    const isJson = res.headers.get('content-type')?.includes('application/json')

    if (isJson) {
      data = await res.json()
    } else {
      const text = await res.text()
      console.error('Response bukan JSON:', text)
    }

    if (res.ok) {
      alert(data?.message || 'Berhasil memilih divisi.')
      setPilihan(divisi_id)
      setError(null)
      setDivisi(prev =>
        prev.map(d =>
          d.id === divisi_id
            ? { ...d, kuota_terpakai: d.kuota_terpakai + 1 }
            : d
        )
      )
    } else {
      setError(data?.message || 'Terjadi kesalahan')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <p>Loading...</p>

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard Divisi</h1>
      {error && <p className={styles.error}>{error}</p>}

      <ul className={styles.list}>
        {divisi.map(d => {
          const full = d.kuota_terpakai >= d.kuota_total
          const sudahPilih = pilihan === d.id
          const disable = full || (!!pilihan && !sudahPilih)

          return (
            <li key={d.id} className={styles.card}>
              <div>
                <strong>{d.nama}</strong>
                <p>Kuota: {d.kuota_terpakai}/{d.kuota_total}</p>
              </div>
              <button
                className={styles.button}
                disabled={disable}
                onClick={() => handlePilih(d.id)}
              >
                {sudahPilih ? 'Dipilih' : full ? 'Penuh' : 'Pilih'}
              </button>
            </li>
          )
        })}
      </ul>

      <div className={styles.logout}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}
