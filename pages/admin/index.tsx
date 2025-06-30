import styles from './admin.module.css'
import { useEffect, useState } from 'react'

interface Profile {
  id: string
  nama: string
  nim: string
  kelas: string
  created_at?: string
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

export default function AdminDivisi() {
  const [data, setData] = useState<DivisiPilihan[]>([])

  useEffect(() => {
    fetch('/api/admin/divisi')
      .then((res) => res.json())
      .then((d) => setData(d))
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Admin - Data Divisi Pilihan</h1>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nama</th>
              <th>NIM</th>
              <th>Kelas</th>
              <th>Divisi</th>
              <th>Kuota Total</th>
              <th>Kuota Terpakai</th>
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
    </div>
  )
}
