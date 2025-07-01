import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import styles from './admin.module.css'
import { createClient } from '@supabase/supabase-js'

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Profile {
  id: string
  nama: string
  nim: string
  kelas: string
  created_at: string
}

interface Divisi {
  id: string
  nama: string
  kuota_total: number
  kuota_terpakai: number
  kuota_terpakai_2a?: number
  kuota_terpakai_2b?: number
  created_at?: string
}

interface DivisiPilihan {
  id: string
  user_id: string
  divisi_id: string
  created_at: string
  is_locked: boolean
  profile: Profile | null
  divisi: Divisi | null
}

type Tab = 'semua' | 'organisasi' | 'profil'
type SubTab = 'semua' | '2A' | '2B'

export default function AdminPage() {
  const [data, setData] = useState<DivisiPilihan[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [tab, setTab] = useState<Tab>('semua')
  const [subTab, setSubTab] = useState<SubTab>('semua')
  const router = useRouter()

  useEffect(() => {
    const kelas = localStorage.getItem('kelas')
    if (kelas !== 'admin') router.replace('/login')

    supabase.auth.getSession().then((session) => {
      const token = session.data.session?.access_token
      if (!token) return

      fetch('/api/admin/divisi', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((d: unknown) => {
          if (Array.isArray(d)) {
            setData(d as DivisiPilihan[])
          } else {
            console.error('Data divisi bukan array:', d)
          }
        })
        .catch((err) => console.error('Fetch divisi error:', err))
    })
  }, [router])

  useEffect(() => {
    supabase.auth.getSession().then((session) => {
      const token = session.data.session?.access_token
      if (!token) return

      fetch('/api/admin/profiles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((d: unknown) => {
          if (Array.isArray(d)) {
            setProfiles(d as Profile[])
          } else {
            console.error('Data profile bukan array:', d)
          }
        })
        .catch((err) => console.error('Fetch profile error:', err))
    })
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    router.push('/login')
  }

  const semuaDivisi: Divisi[] = Array.from(
    new Map(
      data
        .filter((d) => d.divisi !== null)
        .map((d) => [d.divisi!.id, d.divisi!])
    ).values()
  )

  const semuaKelas = ['2A', '2B']

  const dataTerorganisasi = semuaKelas.concat('semua').reduce((acc, kelas) => {
    const perDivisi = semuaDivisi.map((div) => {
      const peserta = data.filter((item) => {
        const cocokKelas = kelas === 'semua' || item.profile?.kelas === kelas
        return item.divisi?.id === div.id && cocokKelas
      })

      return {
        divisi: div.nama,
        peserta,
      }
    })

    acc[kelas as SubTab] = perDivisi
    return acc
  }, {} as Record<SubTab, { divisi: string; peserta: DivisiPilihan[] }[]>)

  return (
    <div className={styles.wrapper}>
      <div className={styles.navbar}>
        <h1 className={styles.heading}>Admin Panel</h1>
        <button onClick={handleLogout} className={styles.logout}>
          Logout
        </button>
      </div>

      <div className={styles.tabButtons}>
        <button onClick={() => setTab('semua')} className={tab === 'semua' ? styles.active : ''}>
          Semua Data
        </button>
        <button
          onClick={() => setTab('organisasi')}
          className={tab === 'organisasi' ? styles.active : ''}
        >
          Data Terorganisasi
        </button>
        <button
          onClick={() => setTab('profil')}
          className={tab === 'profil' ? styles.active : ''}
        >
          Profil Terdaftar
        </button>
      </div>

      {tab === 'semua' && (
        <div className={styles.card}>
          <h2>Semua Data Pilihan Divisi</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama</th>
                <th>NIM</th>
                <th>Kelas</th>
                <th>Divisi</th>
                <th>Kuota</th>
                <th>Terpakai</th>
                <th>Status</th>
                <th>Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td>{item.profile?.nama ?? '-'}</td>
                  <td>{item.profile?.nim ?? '-'}</td>
                  <td>{item.profile?.kelas ?? '-'}</td>
                  <td>{item.divisi?.nama ?? '-'}</td>
                  <td>{item.divisi?.kuota_total ?? '-'}</td>
                  <td>{item.divisi?.kuota_terpakai ?? '-'}</td>
                  <td className={item.is_locked ? styles.statusTrue : styles.statusFalse}>
                    {item.is_locked ? 'Terkunci' : 'Terbuka'}
                  </td>
                  <td>{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'organisasi' && (
        <div className={styles.card}>
          <h2>Data Terorganisasi per Kelas dan Divisi</h2>

          <div className={styles.subTabButtons}>
            {['semua', '2A', '2B'].map((kelas) => (
              <button
                key={kelas}
                onClick={() => setSubTab(kelas as SubTab)}
                className={subTab === kelas ? styles.active : ''}
              >
                {kelas === 'semua' ? 'Semua' : `Kelas ${kelas}`}
              </button>
            ))}
          </div>

          {dataTerorganisasi[subTab].map(({ divisi, peserta }) => (
            <div key={divisi} className={styles.divisiSection}>
              <h3 className={styles.divisiTitle}>{divisi}</h3>
              {peserta.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nama</th>
                      <th>NIM</th>
                      <th>Kelas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peserta.map((i) => (
                      <tr key={i.id}>
                        <td>{i.profile?.nama ?? '-'}</td>
                        <td>{i.profile?.nim ?? '-'}</td>
                        <td>{i.profile?.kelas ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className={styles.noPeserta}>Belum ada peserta di divisi ini.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'profil' && (
        <div className={styles.card}>
          <h2 className={styles.heading}>Profil Terdaftar</h2>
          {profiles.length === 0 ? (
            <p>Belum ada data profil terdaftar.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>NIM</th>
                  <th>Kelas</th>
                  <th>Terdaftar</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nama}</td>
                    <td>{p.nim}</td>
                    <td>{p.kelas}</td>
                    <td>{new Date(p.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
