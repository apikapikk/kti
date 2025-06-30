export interface Profile {
  id: string;
  nama: string;
  nim: string;
  kelas: string;
  created_at: string | null;
}

export interface Divisi {
  id: string;
  nama: string;
  kuota_total: number;
  kuota_terpakai: number;
  kuota_terpakai_2a: number;
  kuota_terpakai_2b: number;
  created_at: string | null;
}

export interface DivisiPilihan {
  id: string;
  user_id: string;
  divisi_id: string;
  created_at: string | null;
  is_locked: boolean;
profile: Profile | null; // ✅ objek, bukan array
  divisi: Divisi | null;
}
