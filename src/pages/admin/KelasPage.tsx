import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  School,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Users,
  CheckCircle2,
  XCircle,
  Layers,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/services/api"

interface Kelas {
  id: string
  nama: string
  divisiId: string
  divisi: string
  kapasitas: number
  jumlahSantri: number
  status: "aktif" | "nonaktif"
  mentorId: string
  pengajar: string
}

const emptyForm: Omit<Kelas, "id" | "jumlahSantri" | "divisi" | "pengajar"> = { nama: "", divisiId: "", kapasitas: 30, status: "aktif", mentorId: "" }

export default function KelasPage() {
  const [data, setData] = useState<Kelas[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const [divisions, setDivisions] = useState<{id: string, name: string}[]>([])
  const [mentors, setMentors] = useState<{id: string, fullName: string}[]>([])

  const [search, setSearch] = useState("")
  const [filterDivisi, setFilterDivisi] = useState("semua")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Kelas | null>(null)
  const [form, setForm] = useState<Omit<Kelas, "id" | "jumlahSantri" | "divisi" | "pengajar">>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resClasses, resDivisions, resMentors] = await Promise.all([
        api.ClassAPI.getAll(),
        api.DivisiAPI.getAll(),
        api.AuthAPI.getMentors()
      ])
      
      const divisionsArray = Array.isArray(resDivisions.data) ? resDivisions.data : (resDivisions.data?.data || [])
      const mentorsArray = Array.isArray(resMentors.data) ? resMentors.data : (resMentors.data?.data || [])
      const classesArray = Array.isArray(resClasses.data) ? resClasses.data : (resClasses.data?.data || [])

      setDivisions(divisionsArray)
      setMentors(mentorsArray)

      const mapped = classesArray.map((c: any) => ({
        id: c.id,
        nama: c.name,
        divisiId: c.divisiId,
        divisi: c.division?.name || "-",
        mentorId: c.mentorId,
        pengajar: c.mentor?.fullName || "-",
        kapasitas: 30, 
        jumlahSantri: c._count?.santriProfiles || 0,
        status: "aktif" 
      }))
      setData(mapped)
      setError("")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Gagal memuat data kelas")
      toast.error("Gagal mengambil data kelas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const divisiList = [...new Set(data.map(d => d.divisi))]
  const statCards = [
    { label: "Total Kelas", value: data.length, icon: School, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
    { label: "Aktif", value: data.filter(d => d.status === "aktif").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Total Santri", value: data.reduce((a, d) => a + d.jumlahSantri, 0), icon: Users, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/40" },
    { label: "Total Divisi", value: divisiList.length, icon: Layers, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
  ]

  const filtered = data.filter(k => {
    const matchSearch = k.nama.toLowerCase().includes(search.toLowerCase()) || k.pengajar.toLowerCase().includes(search.toLowerCase())
    const matchDivisi = filterDivisi === "semua" || k.divisi === filterDivisi
    return matchSearch && matchDivisi
  })

  const openEdit = (k: Kelas) => { setEditTarget(k); setForm({ nama: k.nama, divisiId: k.divisiId, kapasitas: k.kapasitas, status: k.status, mentorId: k.mentorId }); setMenuOpen(null); setModalOpen(true) }

  const handleSave = async () => {
    if (!form.nama || !form.divisiId || !form.mentorId) { toast.error("Nama kelas, divisi, dan pengajar wajib diisi."); return }
    
    setSaving(true)
    try {
      const payload = {
        name: form.nama,
        divisiId: form.divisiId,
        mentorId: form.mentorId
      }

      if (editTarget) {
        await api.ClassAPI.update(editTarget.id, payload)
        toast.success("Kelas berhasil diperbarui.")
      } else {
        await api.ClassAPI.create(payload)
        toast.success("Kelas berhasil ditambahkan.")
      }
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data kelas.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.ClassAPI.delete(id)
      toast.success("Kelas berhasil dihapus.")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus kelas.")
    } finally {
      setDeleteConfirm(null)
      setMenuOpen(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <School className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Kelas</h1>
        </div>
        <p className="text-sm text-muted-foreground">Kelola data kelas yang tersedia di setiap divisi.</p>
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
            <input id="search-kelas" type="text" placeholder="Cari nama kelas atau pengajar..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
          </div>
          <Select value={filterDivisi} onValueChange={v => setFilterDivisi(v || "")}>
            <SelectTrigger id="filter-divisi-kelas" className="w-48">
              <SelectValue placeholder="Semua Divisi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Divisi</SelectItem>
              {divisiList.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
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
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama Kelas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Divisi</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Pengajar (Mentor)</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kapasitas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground"><School className="mx-auto mb-2 h-8 w-8 opacity-30" />Tidak ada kelas ditemukan.</td></tr>
              ) : filtered.map((k, idx) => {
                const fillPct = Math.round((k.jumlahSantri / k.kapasitas) * 100)
                return (
                  <tr key={k.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{k.nama}</td>
                    <td className="px-4 py-3 text-muted-foreground">{k.divisi}</td>
                    <td className="px-4 py-3">{k.pengajar}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">{k.jumlahSantri}/{k.kapasitas} santri</span>
                        <div className="h-1.5 w-24 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${fillPct >= 90 ? "bg-red-500" : fillPct >= 70 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${fillPct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {k.status === "aktif"
                        ? <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><CheckCircle2 className="h-3 w-3" />Aktif</span>
                        : <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"><XCircle className="h-3 w-3" />Non-Aktif</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button id={`menu-kelas-${k.id}`} onClick={() => setMenuOpen(menuOpen === k.id ? null : k.id)} className="rounded-md p-1.5 transition hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
                        {menuOpen === k.id && (
                          <div className="absolute right-0 top-8 z-20 min-w-[130px] rounded-lg border bg-popover shadow-lg">
                            <button onClick={() => openEdit(k)} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"><Pencil className="h-3.5 w-3.5" />Edit</button>
                            <button onClick={() => { setDeleteConfirm(k.id); setMenuOpen(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="h-3.5 w-3.5" />Hapus</button>
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
              <h2 className="text-lg font-bold">{editTarget ? "Edit Kelas" : "Tambah Kelas"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 transition hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Nama Kelas <span className="text-red-500">*</span></label>
                  <input id="input-nama-kelas" type="text" placeholder="Kelas A" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Divisi <span className="text-red-500">*</span></label>
                  <Select value={form.divisiId} onValueChange={v => setForm({ ...form, divisiId: v || "" })}>
                    <SelectTrigger id="input-divisi-kelas" className="w-full">
                      <SelectValue placeholder="Pilih Divisi">
                        {form.divisiId ? divisions.find(d => d.id === form.divisiId)?.name : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {divisions.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Pengajar (Mentor) <span className="text-red-500">*</span></label>
                  <Select value={form.mentorId} onValueChange={v => setForm({ ...form, mentorId: v || "" })}>
                    <SelectTrigger id="input-mentor-kelas" className="w-full">
                      <SelectValue placeholder="Pilih Mentor">
                        {form.mentorId ? mentors.find(m => m.id === form.mentorId)?.fullName : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {mentors.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Kapasitas (Mock)</label>
                  <input id="input-kapasitas-kelas" type="number" min={1} value={form.kapasitas} onChange={e => setForm({ ...form, kapasitas: Number(e.target.value) })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status (Mock)</label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Kelas["status"] })}>
                  <SelectTrigger id="input-status-kelas" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="nonaktif">Non-Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted" disabled={saving}>Batal</button>
              <button id="btn-simpan-kelas" onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
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
              <div><h3 className="font-semibold">Hapus Kelas</h3><p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p></div>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">Apakah kamu yakin ingin menghapus kelas ini?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted" disabled={loading}>Batal</button>
              <button id="btn-konfirm-hapus-kelas" onClick={() => handleDelete(deleteConfirm)} disabled={loading} className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50">
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
