import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  UserCog,Search, MoreHorizontal,
  Pencil, Trash2, X, Phone, Mail,
  MapPin, Loader2, AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/services/api"

interface Wali {
  id: string
  userId: string
  nama: string
  telepon: string
  email: string
  pekerjaan: string
  alamat: string
}

const emptyForm = { userId: "", nama: "", telepon: "", email: "", pekerjaan: "", alamat: "", photoFile: null as File | null }

export default function WaliPage() {
  const [data, setData] = useState<Wali[]>([])
  const [userList, setUserList] = useState<{id: string, nama: string, email: string}[]>([])

  const [search, setSearch] = useState("")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Wali | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const resUsers = await api.AuthAPI.getUsers()

      const uArray = Array.isArray(resUsers.data) ? resUsers.data : (resUsers.data?.data || [])
      const waliUsers = uArray.filter((u: any) => u.role === "WALI_SANTRI" || u.role === "WALI")

      const mapped = waliUsers.map((u: any) => ({
        id: u.id,
        userId: u.id,
        nama: u.fullName || "-",
        telepon: u.phone || "-",
        email: u.email || "-",
        pekerjaan: "-",
        alamat: "-",
      }))
      setData(mapped)

      setUserList(waliUsers.map((u: any) => ({
        id: u.id,
        nama: u.fullName,
        email: u.email,
      })))

      setError("")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Gagal memuat data wali")
      toast.error("Gagal memuat daftar wali")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const statCards = [
    { label: "Total Profil Wali", value: data.length, icon: UserCog, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
    { label: "Akun Wali", value: userList.length, icon: UserCog, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/40" },
  ]

  const filtered = data.filter(w =>
    w.nama.toLowerCase().includes(search.toLowerCase()) || 
    w.telepon.includes(search) || 
    w.email.toLowerCase().includes(search.toLowerCase())
  )

  const openEdit = (w: Wali) => { 
    setEditTarget(w); 
    setForm({ userId: w.userId, nama: w.nama, telepon: w.telepon === "-" ? "" : w.telepon, email: w.email === "-" ? "" : w.email, pekerjaan: w.pekerjaan === "-" ? "" : w.pekerjaan, alamat: w.alamat === "-" ? "" : w.alamat, photoFile: null }); 
    setMenuOpen(null); 
    setModalOpen(true) 
  }

  const handleSave = async () => {
    if (!form.nama) { toast.error("Nama wajib diisi."); return }
    if (!editTarget && !form.userId) { toast.error("Akun User wajib dipilih untuk profil baru."); return }
    if (!editTarget && !form.photoFile) { toast.error("Foto profil wajib diunggah."); return }

    setSaving(true)
    try {
      const formData = new FormData()
      formData.append("fullName", form.nama)
      formData.append("email", form.email || "email@example.com")
      if (form.telepon) formData.append("phone", form.telepon)
      if (form.alamat) formData.append("address", form.alamat)
      if (form.pekerjaan) formData.append("job", form.pekerjaan)
      if (form.photoFile) formData.append("photoUrl", form.photoFile)

      if (editTarget) {
        await api.WaliAPI.update(editTarget.id, formData)
        toast.success("Data profil wali berhasil diperbarui.")
      } else {
        formData.append("userId", form.userId)
        await api.WaliAPI.create(formData)
        toast.success("Profil wali berhasil ditambahkan.")
      }
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data wali.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.WaliAPI.delete(id)
      toast.success("Data wali berhasil dihapus.")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus data wali.")
    } finally {
      setDeleteConfirm(null)
      setMenuOpen(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Profil Wali Santri</h1>
        </div>
        <p className="text-sm text-muted-foreground">Kelola profil biodata wali atau orang tua santri yang terdaftar.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {statCards.map(card => (
          <Card key={card.label} className="border-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>{card.icon && (() => { const Icon = card.icon; return <Icon className={`h-4 w-4 ${card.color}`} /> })()}</div>
            </CardHeader>
            <CardContent><div className="text-3xl font-bold tracking-tight">{loading ? "..." : card.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input id="search-wali" type="text" placeholder="Cari nama, telepon, atau email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
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
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama Wali</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kontak</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Pekerjaan</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground"><UserCog className="mx-auto mb-2 h-8 w-8 opacity-30" />Tidak ada profil wali ditemukan.</td></tr>
              ) : filtered.map((w, idx) => {
                return (
                  <tr key={w.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{w.nama}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{w.alamat}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs"><Phone className="h-3 w-3 text-muted-foreground" />{w.telepon}</div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{w.email}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{w.pekerjaan}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button id={`menu-wali-${w.id}`} onClick={() => setMenuOpen(menuOpen === w.id ? null : w.id)} className="rounded-md p-1.5 transition hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
                        {menuOpen === w.id && (
                          <div className="absolute right-0 top-8 z-20 min-w-[130px] rounded-lg border bg-popover shadow-lg">
                            <button onClick={() => openEdit(w)} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"><Pencil className="h-3.5 w-3.5" />Edit</button>
                            <button onClick={() => { setDeleteConfirm(w.id); setMenuOpen(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="h-3.5 w-3.5" />Hapus</button>
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
          <div className="relative w-full max-w-lg rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editTarget ? "Edit Profil Wali" : "Tambah Profil Wali"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 transition hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              {!editTarget && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Pilih Akun Wali (User) <span className="text-red-500">*</span></label>
                  <Select value={form.userId} onValueChange={v => setForm({ ...form, userId: v || "" })}>
                    <SelectTrigger id="input-userid-wali" className="w-full">
                      <SelectValue placeholder="Pilih akun..." />
                    </SelectTrigger>
                    <SelectContent>
                      {userList.map(u => <SelectItem key={u.id} value={u.id}>{u.nama} ({u.email})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input id="input-nama-wali" type="text" placeholder="Bapak/Ibu ..." value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
                  <input id="input-email-wali" type="email" placeholder="email@contoh.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Telepon</label>
                  <input id="input-telepon-wali" type="text" placeholder="0821xxxxxxx" value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Pekerjaan</label>
                  <input id="input-pekerjaan-wali" type="text" placeholder="Wirausaha" value={form.pekerjaan} onChange={e => setForm({ ...form, pekerjaan: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Alamat</label>
                  <textarea id="input-alamat-wali" rows={2} placeholder="Jl. ..." value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Foto Profil {editTarget ? "(Opsional)" : <span className="text-red-500">*</span>}</label>
                  <input id="input-foto-wali" type="file" accept="image/*" onChange={e => setForm({ ...form, photoFile: e.target.files?.[0] || null })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Batal</button>
              <button id="btn-simpan-wali" onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editTarget ? "Simpan Perubahan" : "Tambah Profil"}
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
              <div><h3 className="font-semibold">Hapus Profil Wali</h3><p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p></div>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">Apakah kamu yakin ingin menghapus data profil ini?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} disabled={loading} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Batal</button>
              <button id="btn-konfirm-hapus-wali" onClick={() => handleDelete(deleteConfirm)} disabled={loading} className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen !== null && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  )
}
