import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  Users,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  UserCheck,
  UserX,
  GraduationCap,
  Phone,
  ExternalLink,
  Loader2,
  AlertCircle,
  Link2,
  Heart
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/services/api"

const hubunganLabel: Record<string, string> = {
  FATHER: "Ayah", MOTHER: "Ibu", GUARDIAN: "Wali", OTHER: "Lainnya"
}

interface Santri {
  id: string
  nama: string
  email: string
  nis: string
  kelas: string
  divisi: string
  status: "aktif" | "nonaktif" | "lulus"
  telepon: string
  alamat: string
}

const statusConfig = {
  aktif: { label: "Aktif", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: <UserCheck className="h-3 w-3" /> },
  nonaktif: { label: "Non-Aktif", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", icon: <UserX className="h-3 w-3" /> },
  lulus: { label: "Lulus", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", icon: <GraduationCap className="h-3 w-3" /> },
}

const emptyForm: Omit<Santri, "id"> & { password?: string } = { nama: "", email: "", nis: "", kelas: "", divisi: "", status: "aktif", telepon: "", alamat: "", password: "" }

interface SantriFormState extends Omit<Santri, "id"> {
  password?: string;
  photoFile: File | null;
}
const initialFormState: SantriFormState = { ...emptyForm, photoFile: null };

export default function SantriPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<Santri[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("semua")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Santri | null>(null)
  const [form, setForm] = useState<SantriFormState>(initialFormState)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Wali relation modal state
  const [waliModalSantri, setWaliModalSantri] = useState<Santri | null>(null)
  const [waliList, setWaliList] = useState<{id: string, nama: string}[]>([])
  const [relasiList, setRelasiList] = useState<any[]>([])
  const [relasiForm, setRelasiForm] = useState({ waliId: "", category: "FATHER" })
  const [relasiLoading, setRelasiLoading] = useState(false)
  const [relasiSaving, setRelasiSaving] = useState(false)

  const openWaliModal = async (s: Santri) => {
    setMenuOpen(null)
    setWaliModalSantri(s)
    setRelasiForm({ waliId: "", category: "FATHER" })
    setRelasiLoading(true)
    try {
      const [resUsers, resRelasi] = await Promise.all([
        api.AuthAPI.getUsers(),
        api.RelasiAPI.getAll()
      ])
      const uArr = Array.isArray(resUsers.data) ? resUsers.data : (resUsers.data?.data || [])
      setWaliList(uArr.filter((u: any) => u.role === "WALI_SANTRI" || u.role === "WALI").map((u: any) => ({ id: u.id, nama: u.fullName })))
      const rArr = Array.isArray(resRelasi.data) ? resRelasi.data : (resRelasi.data?.data || [])
      setRelasiList(rArr.filter((r: any) => r.santriId === s.id))
    } catch {
      setWaliList([])
      setRelasiList([])
    } finally {
      setRelasiLoading(false)
    }
  }

  const handleSaveRelasi = async () => {
    if (!relasiForm.waliId) { toast.error("Pilih akun wali terlebih dahulu."); return }
    if (!waliModalSantri) return
    setRelasiSaving(true)
    try {
      await api.RelasiAPI.create({ waliId: relasiForm.waliId, santriId: waliModalSantri.id, category: relasiForm.category })
      toast.success("Relasi berhasil ditambahkan.")
      const resRelasi = await api.RelasiAPI.getAll()
      const rArr = Array.isArray(resRelasi.data) ? resRelasi.data : (resRelasi.data?.data || [])
      setRelasiList(rArr.filter((r: any) => r.santriId === waliModalSantri.id))
      setRelasiForm({ waliId: "", category: "FATHER" })
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan relasi.")
    } finally {
      setRelasiSaving(false)
    }
  }

  const handleDeleteRelasi = async (relasiId: string) => {
    try {
      await api.RelasiAPI.delete(relasiId)
      toast.success("Relasi dihapus.")
      setRelasiList(prev => prev.filter(r => r.id !== relasiId))
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus relasi.")
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.SantriAPI.getAll()
      const dataArray = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      const mapped = dataArray.map((u: any) => ({
        id: u.id,
        nama: u.fullName ?? "-",
        email: u.email ?? "-",
        status: u.isActive ? "aktif" : "nonaktif",
        nis: u.santriProfile?.nis ?? "-", 
        kelas: u.santriProfile?.class?.name ?? u.santriProfile?.classId ?? "-",
        divisi: u.santriProfile?.division?.name ?? "-", 
        telepon: u.phone ?? u.santriProfile?.phone ?? "-",
        alamat: u.santriProfile?.address ?? "-"
      }))
      setData(mapped)
      setError("")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Gagal memuat data santri")
      toast.error("Gagal mengambil data santri")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const statCards = [
    { label: "Total Santri", value: data.length, icon: Users, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
    { label: "Aktif", value: data.filter(d => d.status === "aktif").length, icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Non-Aktif", value: data.filter(d => d.status === "nonaktif").length, icon: UserX, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/40" },
    { label: "Lulus", value: data.filter(d => d.status === "lulus").length, icon: GraduationCap, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/40" },
  ]

  const filtered = data.filter(s => {
    const matchSearch = s.nama.toLowerCase().includes(search.toLowerCase()) || s.nis.includes(search) || s.kelas.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "semua" || s.status === filterStatus
    return matchSearch && matchStatus
  })

  const openEdit = (s: Santri) => { setEditTarget(s); setForm({ nama: s.nama, email: s.email, nis: s.nis, kelas: s.kelas, divisi: s.divisi, status: s.status, telepon: s.telepon, alamat: s.alamat, photoFile: null }); setMenuOpen(null); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.nama || !form.email) { toast.error("Nama dan Email wajib diisi."); return }
    if (!editTarget && !form.password) { toast.error("Password wajib diisi untuk user baru."); return }
    if (!editTarget && !form.photoFile) { toast.error("Foto wajib diunggah untuk user baru."); return }
    
    setSaving(true)
    try {
      const formData = new FormData();
      formData.append("fullName", form.nama);
      formData.append("email", form.email);
      formData.append("role", "SANTRI");
      if (form.telepon) formData.append("phone", form.telepon);
      if (form.alamat) formData.append("address", form.alamat);
      if (form.photoFile) formData.append("photoUrl", form.photoFile);

      if (editTarget) {
        await api.SantriAPI.update(editTarget.id, formData)
        toast.success("Data santri berhasil diperbarui.")
      } else {
        if (form.password) formData.append("password", form.password);
        await api.SantriAPI.create(formData)
        toast.success("Santri berhasil ditambahkan.")
      }
      setModalOpen(false)
      fetchData() 
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menyimpan data.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.SantriAPI.delete(id)
      toast.success("Santri berhasil dihapus.")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus santri.")
    } finally {
      setDeleteConfirm(null)
      setMenuOpen(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Data Santri</h1>
        </div>
        <p className="text-sm text-muted-foreground">Kelola seluruh data santri yang terdaftar di pesantren.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => (
          <Card key={card.label} className="border-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}><card.icon className={`h-4 w-4 ${card.color}`} /></div>
            </CardHeader>
            <CardContent><div className="text-2xl md:text-3xl font-bold tracking-tight">{loading ? "..." : card.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input id="search-santri" type="text" placeholder="Cari nama, email, kelas..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
          </div>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v || "")}>
            <SelectTrigger id="filter-status-santri" className="w-36">
              <SelectValue placeholder="Semua" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="nonaktif">Non-Aktif</SelectItem>
              <SelectItem value="lulus">Lulus</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>

      <Card className="border-0 shadow-sm ring-1 ring-border/60 overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 text-center px-4">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={fetchData} className="mt-4 rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Coba Lagi</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama & Email</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NIS</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kelas / Divisi</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Telepon</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Wali</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground"><Users className="mx-auto mb-2 h-8 w-8 opacity-30" />Tidak ada santri ditemukan.</td></tr>
              ) : filtered.map((s, idx) => {
                const cfg = statusConfig[s.status]
                return (
                  <tr
                    key={s.id}
                    className="group border-b last:border-0 cursor-pointer transition-colors hover:bg-primary/5"
                    onClick={() => navigate(`/dashboard/santri/${s.id}/wali-profile`)}
                  >
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.nama}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-xs text-muted-foreground">{s.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.nis}</td>
                    <td className="px-4 py-3">
                      <div>{s.kelas}</div>
                      <div className="text-xs text-muted-foreground">{s.divisi}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{s.telepon}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.icon}{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                        <UserCheck className="h-3.5 w-3.5" />
                        Lihat Profil Wali
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="relative inline-block">
                        <button id={`menu-santri-${s.id}`} onClick={() => setMenuOpen(menuOpen === s.id ? null : s.id)} className="rounded-md p-1.5 transition hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
                        {menuOpen === s.id && (
                          <div className="absolute right-0 top-8 z-20 min-w-[150px] rounded-lg border bg-popover shadow-lg">
                            <button onClick={() => openEdit(s)} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"><Pencil className="h-3.5 w-3.5" />Edit</button>
                            <button onClick={() => openWaliModal(s)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30"><Link2 className="h-3.5 w-3.5" />Atur Wali</button>
                            <button onClick={() => { setDeleteConfirm(s.id); setMenuOpen(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="h-3.5 w-3.5" />Hapus</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 p-4 md:p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editTarget ? "Edit Santri" : "Tambah Santri"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 transition hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input id="input-nama-santri" type="text" placeholder="Ahmad Fauzi" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Email <span className="text-red-500">*</span></label>
                  <input id="input-email-santri" type="email" placeholder="email@contoh.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              
              {!editTarget && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Password <span className="text-red-500">*</span></label>
                  <input id="input-password-santri" type="password" placeholder="Min. 6 karakter" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Telepon</label>
                  <input id="input-telepon-santri" type="text" placeholder="0811xxxxxxx" value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Status Aktif (Mock)</label>
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Santri["status"] })}>
                    <SelectTrigger id="input-status-santri" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="nonaktif">Non-Aktif</SelectItem>
                      <SelectItem value="lulus">Lulus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Alamat</label>
                <textarea id="input-alamat-santri" rows={2} placeholder="Jl. Merdeka No. 1..." value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Foto Profil {editTarget ? "(Opsional)" : <span className="text-red-500">*</span>}</label>
                <input id="input-foto-santri" type="file" accept="image/*" onChange={e => setForm({ ...form, photoFile: e.target.files?.[0] || null })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted" disabled={saving}>Batal</button>
              <button id="btn-simpan-santri" onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editTarget ? "Simpan Perubahan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border/60" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40"><Trash2 className="h-5 w-5 text-red-500" /></div>
              <div><h3 className="font-semibold">Hapus Santri</h3><p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p></div>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">Apakah kamu yakin ingin menghapus data santri ini?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted" disabled={loading}>Batal</button>
              <button id="btn-konfirm-hapus-santri" onClick={() => handleDelete(deleteConfirm)} disabled={loading} className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen !== null && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}

      {waliModalSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setWaliModalSantri(null)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Relasi Wali — {waliModalSantri.nama}</h2>
                <p className="text-xs text-muted-foreground">NIS: {waliModalSantri.nis}</p>
              </div>
              <button onClick={() => setWaliModalSantri(null)} className="rounded-md p-1.5 transition hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>

            <div className="mb-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Wali Terdaftar</p>
              {relasiLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : relasiList.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Belum ada wali terkait.</p>
              ) : (
                <div className="space-y-2">
                  {relasiList.map(r => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Heart className="h-3.5 w-3.5 text-pink-500" />
                        <span className="text-sm font-medium">{r.wali?.fullName || "-"}</span>
                        <span className="text-xs text-muted-foreground">({hubunganLabel[r.category] || r.category})</span>
                      </div>
                      <button onClick={() => handleDeleteRelasi(r.id)} className="text-red-500 hover:text-red-600 p-1 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tambah Wali Baru</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Akun Wali</label>
                  <Select value={relasiForm.waliId} onValueChange={v => setRelasiForm({ ...relasiForm, waliId: v || "" })}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Pilih wali..." /></SelectTrigger>
                    <SelectContent>
                      {waliList.map(w => <SelectItem key={w.id} value={w.id}>{w.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Hubungan</label>
                  <Select value={relasiForm.category} onValueChange={v => setRelasiForm({ ...relasiForm, category: v || "FATHER" })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FATHER">Ayah</SelectItem>
                      <SelectItem value="MOTHER">Ibu</SelectItem>
                      <SelectItem value="GUARDIAN">Wali</SelectItem>
                      <SelectItem value="OTHER">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSaveRelasi} disabled={relasiSaving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
                  {relasiSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Relasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
