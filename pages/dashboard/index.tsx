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
  kuota_terpakai_2a: number
  kuota_terpakai_2b: number
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [kelas, setKelas] = useState<string | null>(null)
  const [divisi, setDivisi] = useState<Divisi[]>([])
  const [pilihan, setPilihan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)


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

      // Ambil kelas user dari tabel profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('kelas')
        .eq('id', userData.user.id)
        .single()

      if (!profile) {
        setError('Gagal mengambil data profil')
        return
      }

      setKelas(profile.kelas)

      // Ambil semua divisi
      const { data: divisiList, error: divisiError } = await supabase
        .from('divisi')
        .select('*')
        .order('nama', { ascending: true })

        if (divisiError) {
          console.error('Gagal ambil data divisi:', divisiError)
        } else {
          setDivisi(divisiList || []) // ⬅️ gunakan nilainya di sini
        }

      // Ambil pilihan divisi user (jika ada)
      const { data: pilihanData } = await supabase
        .from('divisi_pilihan')
        .select('divisi_id, is_locked')
        .eq('user_id', userData.user.id)
        .maybeSingle()

        setPilihan(pilihanData?.divisi_id || null)
        setIsLocked(pilihanData?.is_locked || false)
        setLoading(false)
      }
    fetchData()
  }, [router])

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success, error])
  
  const handlePilih = async (divisi_id: string) => {
  if (!user || isSubmitting) return
  setIsSubmitting(true)

  const session = await supabase.auth.getSession()
const token = session.data.session?.access_token

if (!token) {
  setError('Sesi login tidak ditemukan')
  return
}
try {
  const res = await fetch('/api/divition/choose', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ user_id: user.id, divisi_id })
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
          ? {
              ...d,
              kuota_terpakai_2a: kelas === '2A' ? d.kuota_terpakai_2a + 1 : d.kuota_terpakai_2a,
              kuota_terpakai_2b: kelas === '2B' ? d.kuota_terpakai_2b + 1 : d.kuota_terpakai_2b
            }
          : d
      )
    )
  } else {
    setError(data?.message || 'Terjadi kesalahan')
  }
} catch (e) {
  console.error('Terjadi error saat memilih:', e)
  setError('Gagal memilih divisi.')
} finally {
  setIsSubmitting(false)
}

}


  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleLock = async () => {
  if (!user) return

  const res = await fetch('/api/divition/lock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: user.id }),
  })

  const data = await res.json()
  if (res.ok) {
    setIsLocked(true)
    setSuccess(data.message)
  } else {
    setError(data.message || 'Gagal mengunci pilihan')
  }
}

const handleBatal = async (divisi_id: string) => {
  if (!user || isSubmitting) return
  setIsSubmitting(true)

  try {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    if (!token) {
      setError('Sesi login tidak ditemukan')
      return
    }

    const res = await fetch('/api/divition/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: user.id, divisi_id }),
    })

    const data = await res.json()

    if (res.ok) {
      alert('Berhasil membatalkan pilihan.')
      setPilihan(null)
      setIsLocked(false)
      setDivisi((prev) =>
        prev.map((d) =>
          d.id === divisi_id
            ? {
                ...d,
                kuota_terpakai_2a: kelas === '2A' ? d.kuota_terpakai_2a - 1 : d.kuota_terpakai_2a,
                kuota_terpakai_2b: kelas === '2B' ? d.kuota_terpakai_2b - 1 : d.kuota_terpakai_2b,
              }
            : d
        )
      )
    } else {
      alert(data.message || 'Gagal membatalkan pilihan.')
    }
  } catch (e) {
    console.error('Gagal saat membatalkan:', e)
    setError('Terjadi kesalahan saat membatalkan.')
  } finally {
    setIsSubmitting(false)
  }
}


  if (loading) return <p>Loading...</p>

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Dashboard Divisi</h1>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
      <ul className={styles.list}>
        {divisi.map(d => {
  const totalKelas = kelas === '2A'
    ? Math.ceil(d.kuota_total / 2)
    : Math.floor(d.kuota_total / 2)

  const terpakaiKelas = kelas === '2A'
    ? d.kuota_terpakai_2a
    : d.kuota_terpakai_2b

  const full = terpakaiKelas >= totalKelas
  const sudahPilih = pilihan === d.id

  return (
    <li key={d.id} className={styles.card}>
      <div>
        <strong>{d.nama}</strong>
        <p>Kuota ({kelas}): {terpakaiKelas}/{totalKelas}</p>
      </div>
      {isSubmitting && <p className={styles.loading}>Menyimpan...</p>}
      {sudahPilih ? (
        isLocked ? (
          <button className={styles.button} disabled>Dipilih (Terkunci)</button>
        ) : (
          <button
            className={styles.button}
            onClick={() => handleBatal(d.id)}
          >
            Batalkan
          </button>
        )
      ) : (
        <button
        className={styles.button}
        disabled={!!pilihan || full || isLocked || isSubmitting}
        onClick={() => handlePilih(d.id)}
      >
        {full ? 'Penuh' : 'Pilih'}
      </button>
      )}
    </li>
  )
        })}
      </ul>
      {pilihan && !isLocked && (
        <div className={styles.lockContainer}>
          <button className={styles.lockButton} onClick={handleLock}>
            Kunci Pilihan
          </button>
        </div>
      )}
      <div className={styles.logout}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}
