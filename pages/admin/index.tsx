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

type Tab = 'semua' | 'organisasi' | 'profil' | 'kelola'
type SubTab = 'semua' | '2A' | '2B'


export default function AdminPage() {
  const [data, setData] = useState<DivisiPilihan[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [tab, setTab] = useState<Tab>('semua')
  const [subTab, setSubTab] = useState<SubTab>('semua')
  const [semuaDivisi, setSemuaDivisi] = useState<Divisi[]>([])
  const router = useRouter()

  useEffect(() => {
    const kelas = localStorage.getItem('kelas')
    if (kelas !== 'admin') router.replace('/login')

    supabase.auth.getSession().then((session) => {
      const token = session.data.session?.access_token
      if (!token) return

      fetch('/api/admin/divisi', {
        headers: { Authorization: `Bearer ${token}` },
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
        headers: { Authorization: `Bearer ${token}` },
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

  useEffect(() => {
    fetch('/api/admin/semua-divisi')
      .then((res) => res.json())
      .then((d: Divisi[]) => setSemuaDivisi(d))
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    router.push('/login')
  }

  const semuaKelas = ['2A', '2B']

  const dataTerorganisasi = semuaKelas.concat('semua').reduce((acc, kelas) => {
    const perDivisi = semuaDivisi.map((div) => {
      const peserta = data.filter((item) => {
        const cocokKelas = kelas === 'semua' || item.profile?.kelas === kelas
        return item.divisi?.id === div.id && cocokKelas
      })

      return { divisi: div.nama, peserta }
    })

    acc[kelas as SubTab] = perDivisi
    return acc
  }, {} as Record<SubTab, { divisi: string; peserta: DivisiPilihan[] }[]>)

      function handleDownloadCSV(data: DivisiPilihan[]) {
        const header = ['Nama', 'NIM', 'Kelas', 'Divisi', 'Status', 'Dibuat']
        const rows = data.map((item) => [
          item.profile?.nama ?? '-',
          item.profile?.nim ?? '-',
          item.profile?.kelas ?? '-',
          item.divisi?.nama ?? '-',
          item.is_locked ? 'Terkunci' : 'Terbuka',
          new Date(item.created_at).toLocaleString(),
        ])

        const csvContent =
          'data:text/csv;charset=utf-8,' +
          [header, ...rows]
            .map((e) => e.map((cell) => `"${cell}"`).join(','))
            .join('\n')

        const encodedUri = encodeURI(csvContent)
        const link = document.createElement('a')
        link.setAttribute('href', encodedUri)
        link.setAttribute('download', 'data_divisi.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

  function handleDeleteUser(userId: string) {
  const yakin = confirm('Yakin ingin menghapus user ini? Semua data akan dihapus permanen.')
  if (!yakin) return

  supabase.auth.getSession().then((session) => {
    const token = session.data.session?.access_token
    if (!token) return

    fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    })
      .then((res) => res.json())
      .then((res) => {
        alert(res.message || 'User berhasil dihapus')
        setProfiles((prev) => prev.filter((p) => p.id !== userId)) // update UI
      })
      .catch(() => alert('Gagal menghapus user'))
  })
}


  return (
    <div className={styles.wrapper}>
      <div className={styles.navbar}>
        <h1 className={styles.heading}>Admin Panel</h1>
        <button onClick={handleLogout} className={styles.logout}>Logout</button>
        <button
          onClick={() => handleDownloadCSV(data)}
          className={styles.downloadButton}
        >
          Download Semua Data
        </button>
      </div>

      <div className={styles.tabButtons}>
        <button onClick={() => setTab('semua')} className={tab === 'semua' ? styles.active : ''}>Semua Data</button>
        <button onClick={() => setTab('organisasi')} className={tab === 'organisasi' ? styles.active : ''}>Data Terorganisasi</button>
        <button onClick={() => setTab('profil')} className={tab === 'profil' ? styles.active : ''}>Profil Terdaftar</button>
        <button onClick={() => setTab('kelola')} className={tab === 'kelola' ? styles.active : ''}>Kelola Akun</button>
      </div>

      {tab === 'semua' && (
        <div className={styles.card}>
          <h2>Semua Data Pilihan Divisi</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nama</th><th>NIM</th><th>Kelas</th><th>Divisi</th><th>Kuota</th><th>Terpakai</th><th>Status</th><th>Dibuat</th>
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
                    <tr><th>Nama</th><th>NIM</th><th>Kelas</th></tr>
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
                <tr><th>Nama</th><th>NIM</th><th>Kelas</th><th>Terdaftar</th></tr>
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
      
      {tab === 'kelola' && (
        <div className={styles.card}>
          <h2 className={styles.heading}>Kelola Akun Pengguna</h2>
          {profiles.length === 0 ? (
            <p>Belum ada akun pengguna terdaftar.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>NIM</th>
                  <th>Kelas</th>
                  <th>Terdaftar</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nama}</td>
                    <td>{p.nim}</td>
                    <td>{p.kelas}</td>
                    <td>{new Date(p.created_at).toLocaleString()}</td>
                    <td>
                      {p.kelas !== 'admin' ? (
                        <button
                          onClick={() => handleDeleteUser(p.id)}
                          className={styles.hapusButton}
                        >
                          Hapus
                        </button>
                      ) : (
                        <span className={styles.adminBadge}>Admin</span>
                      )}
                    </td>
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