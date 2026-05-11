import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  BookOpenCheck,Search, MoreHorizontal,
  Pencil, Trash2, X, Calendar, User,
  BookOpen, Loader2, AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/services/api"

interface Jurnal {
  id: string
  santriId: string
  santriName: string
  nis: string
  classId: string
  className: string
  date: string
  activity: string
  notes: string
}

const today = new Date().toISOString().split("T")[0]

type FormState = Omit<Jurnal, "id" | "santriName" | "nis" | "className">

const emptyForm: FormState = { santriId: "", classId: "", date: today, activity: "", notes: "" }

export default function JurnalPage() {
  const [data, setData] = useState<Jurnal[]>([])
  const [classesList, setClassesList] = useState<{id: string, nama: string}[]>([])
  const [santriList, setSantriList] = useState<{id: string, nama: string, nis: string}[]>([])

  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Jurnal | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resJournals, resClass, resSantri] = await Promise.all([
        api.DailyJournalAPI.getAll(),
        api.ClassAPI.getAll(),
        api.SantriAPI.getAll()
      ])

      const classesArray = Array.isArray(resClass.data) ? resClass.data : (resClass.data?.data || [])
      setClassesList(classesArray.map((c: any) => ({ id: c.id, nama: c.name })))

      const santriArray = Array.isArray(resSantri.data) ? resSantri.data : (resSantri.data?.data || [])
      setSantriList(santriArray.map((s: any) => ({ id: s.id, nama: s.fullName, nis: s.santriProfile?.nis || "-" })))

      const jArray = Array.isArray(resJournals.data) ? resJournals.data : (resJournals.data?.data || [])
      const mapped = jArray.map((j: any) => ({
        id: j.id,
        santriId: j.santriId || "",
        santriName: j.santri?.fullName || "-",
        nis: j.santri?.nis || "-",
        classId: j.classId || "",
        className: j.class?.name || "-",
        date: j.date ? j.date.split("T")[0] : "",
        activity: j.activity || "",
        notes: j.notes || "",
      }))
      setData(mapped)
      setError("")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Gagal memuat jurnal harian")
      toast.error("Gagal memuat jurnal harian")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = data.filter(j => {
    const q = search.toLowerCase()
    return (j.santriName ?? "").toLowerCase().includes(q) 
      || (j.className ?? "").toLowerCase().includes(q) 
      || (j.activity ?? "").toLowerCase().includes(q)
  })

const openEdit = (j: Jurnal) => { 
    setEditTarget(j); 
    setForm({ santriId: j.santriId, classId: j.classId, date: j.date, activity: j.activity, notes: j.notes }); 
    setMenuOpen(null); 
    setModalOpen(true) 
  }

  const handleSave = async () => {
    if (!form.santriId || !form.classId || !form.date || !form.activity) { 
      toast.error("Harap lengkapi field santri, kelas, tanggal, dan kegiatan.")
      return 
    }
    
    setSaving(true)
    try {
      const payload = {
        santriId: form.santriId,
        classId: form.classId,
        date: new Date(form.date).toISOString(),
        activity: form.activity,
        notes: form.notes
      }

      if (editTarget) {
        await api.DailyJournalAPI.update(editTarget.id, payload)
        toast.success("Jurnal berhasil diperbarui.")
      } else {
        await api.DailyJournalAPI.create(payload)
        toast.success("Jurnal berhasil dicatat.")
      }
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan jurnal.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => { 
    try {
      await api.DailyJournalAPI.delete(id)
      toast.success("Jurnal berhasil dihapus.")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus jurnal.")
    } finally {
      setDeleteConfirm(null)
      setMenuOpen(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Jurnal Harian</h1>
        </div>
        <p className="text-sm text-muted-foreground">Catat dan pantau perkembangan harian santri.</p>
      </div>

      <div className="grid grid-cols-2">
        <Card className="border-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jurnal</CardTitle>
            <div className="rounded-lg p-2 bg-violet-50 dark:bg-violet-950/40"><BookOpenCheck className="h-4 w-4 text-violet-600" /></div>
          </CardHeader>
          <CardContent><div className="text-2xl md:text-3xl font-bold tracking-tight">{loading ? "..." : data.length}</div></CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input id="search-jurnal" type="text" placeholder="Cari santri, kelas, kegiatan..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
          </div>
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
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Santri</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kegiatan</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Catatan</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? null : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground"><BookOpen className="mx-auto mb-2 h-8 w-8 opacity-30" />Tidak ada jurnal ditemukan.</td></tr>
              ) : filtered.map((j, idx) => {
                return (
                  <tr key={j.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" /><div><div className="font-medium">{j.santriName}</div><div className="text-xs text-muted-foreground">{j.className}</div></div></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />{new Date(j.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[250px]"><p className="line-clamp-2 text-sm">{j.activity}</p></td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px]"><p className="line-clamp-2 text-xs">{j.notes || "—"}</p></td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button id={`menu-jurnal-${j.id}`} onClick={() => setMenuOpen(menuOpen === j.id ? null : j.id)} className="rounded-md p-1.5 transition hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
                        {menuOpen === j.id && (
                          <div className="absolute right-0 top-8 z-20 min-w-[130px] rounded-lg border bg-popover shadow-lg">
                            <button onClick={() => openEdit(j)} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"><Pencil className="h-3.5 w-3.5" />Edit</button>
                            <button onClick={() => { setDeleteConfirm(j.id); setMenuOpen(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="h-3.5 w-3.5" />Hapus</button>
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
              <h2 className="text-lg font-bold">{editTarget ? "Edit Jurnal" : "Catat Jurnal Harian"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 transition hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Santri <span className="text-red-500">*</span></label>
                  <Select value={form.santriId} onValueChange={v => setForm({ ...form, santriId: v || "" })}>
                    <SelectTrigger id="input-santri-jurnal" className="w-full">
                      <SelectValue placeholder="Pilih santri..." />
                    </SelectTrigger>
                    <SelectContent>
                      {santriList.map(s => <SelectItem key={s.id} value={s.id}>{s.nama} ({s.nis})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Kelas <span className="text-red-500">*</span></label>
                  <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v || "" })}>
                    <SelectTrigger id="input-kelas-jurnal" className="w-full">
                      <SelectValue placeholder="Pilih kelas..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classesList.map(k => <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Tanggal <span className="text-red-500">*</span></label>
                <input id="input-tanggal-jurnal" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Kegiatan Hari Ini <span className="text-red-500">*</span></label>
                <textarea id="input-kegiatan-jurnal" rows={2} placeholder="Deskripsikan kegiatan santri..." value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Catatan Tambahan</label>
                <input id="input-catatan-jurnal" type="text" placeholder="Catatan opsional..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Batal</button>
              <button id="btn-simpan-jurnal" onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editTarget ? "Simpan Perubahan" : "Catat"}
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
              <div><h3 className="font-semibold">Hapus Jurnal</h3><p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p></div>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">Apakah kamu yakin ingin menghapus jurnal ini?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} disabled={loading} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Batal</button>
              <button id="btn-konfirm-hapus-jurnal" onClick={() => handleDelete(deleteConfirm)} disabled={loading} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50">
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
