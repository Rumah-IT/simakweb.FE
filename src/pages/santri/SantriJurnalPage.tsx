import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  BookOpenCheck, Search, Calendar, BookOpen,
  Loader2, AlertCircle, Plus, X, Pencil, Trash2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/services/api"

function loadUser() {
  try { return JSON.parse(localStorage.getItem("user") ?? "{}") } catch { return {} }
}

interface Jurnal {
  id: string
  date: string
  activity: string
  notes: string
  className: string
  classId: string
}

const today = new Date().toISOString().split("T")[0]
const emptyForm = { classId: "", date: today, activity: "", notes: "" }

export default function SantriJurnalPage() {
  const user = loadUser()

  const [data, setData] = useState<Jurnal[]>([])
  const [classesList, setClassesList] = useState<{ id: string; nama: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Jurnal | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError("")
      const [resJ, resC] = await Promise.all([
        api.DailyJournalAPI.getAll(),
        api.ClassAPI.getAll(),
      ])

      const cArr = Array.isArray(resC.data) ? resC.data : (resC.data?.data || [])
      setClassesList(cArr.map((c: any) => ({ id: c.id, nama: c.name })))

      const jArr = Array.isArray(resJ.data) ? resJ.data : (resJ.data?.data || [])
      // Filter hanya jurnal milik santri ini
      const mine = jArr
        .filter((j: any) => j.santriId === user.id)
        .map((j: any) => ({
          id: j.id,
          date: j.date ? j.date.split("T")[0] : "",
          activity: j.activity ?? "-",
          notes: j.notes ?? "",
          className: j.class?.name ?? j.classId ?? "-",
          classId: j.classId,
        }))
        .sort((a: Jurnal, b: Jurnal) => b.date.localeCompare(a.date))

      setData(mine)
    } catch (err: any) {
      const msg = err?.message || "Gagal memuat jurnal harian"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openCreate = () => { setEditTarget(null); setForm(emptyForm); setModalOpen(true) }
  const openEdit = (j: Jurnal) => {
    setEditTarget(j)
    setForm({ classId: j.classId, date: j.date, activity: j.activity, notes: j.notes })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.activity.trim()) { toast.error("Kegiatan wajib diisi."); return }
    if (!form.classId) { toast.error("Kelas wajib dipilih."); return }
    setSaving(true)
    try {
      const payload = {
        santriId: user.id,
        classId: form.classId,
        date: form.date,
        activity: form.activity,
        notes: form.notes,
      }
      if (editTarget) {
        await api.DailyJournalAPI.update(editTarget.id, payload)
        toast.success("Jurnal berhasil diperbarui.")
      } else {
        await api.DailyJournalAPI.create(payload)
        toast.success("Jurnal berhasil ditambahkan.")
      }
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan jurnal.")
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
      toast.error(err?.message || "Gagal menghapus jurnal.")
    } finally {
      setDeleteConfirm(null)
    }
  }

  const filtered = data.filter(j => {
    const q = search.toLowerCase()
    return j.activity.toLowerCase().includes(q) || j.className.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Jurnal Harian</h1>
        </div>
        <p className="text-sm text-muted-foreground">Catat dan pantau perkembangan harian santri.</p>
      </div>

      {/* Stat */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-0 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Jurnal</CardTitle>
            <div className="rounded-lg p-2 bg-violet-50 dark:bg-violet-950/40">
              <BookOpenCheck className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold tracking-tight ${loading ? "opacity-40 animate-pulse" : ""}`}>
              {loading ? "—" : data.length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bulan Ini</CardTitle>
            <div className="rounded-lg p-2 bg-sky-50 dark:bg-sky-950/40">
              <Calendar className="h-4 w-4 text-sky-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold tracking-tight ${loading ? "opacity-40 animate-pulse" : ""}`}>
              {loading ? "—" : data.filter(j => j.date.startsWith(new Date().toISOString().slice(0, 7))).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari kegiatan, kelas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" /> Tambah Jurnal
        </button>
      </div>

      {/* Table */}
      <Card className="border-0 shadow-sm ring-1 ring-border/60 overflow-hidden relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 text-center px-4">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm font-medium text-red-600">{error}</p>
            <button onClick={fetchData} className="mt-4 rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Coba Lagi</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kelas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kegiatan</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Catatan</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <BookOpenCheck className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    {data.length === 0 ? "Belum ada jurnal. Yuk, tambah jurnal harianmu!" : "Tidak ada jurnal yang cocok."}
                  </td>
                </tr>
              ) : filtered.map((j, idx) => (
                <tr key={j.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {j.date ? new Date(j.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      {j.className}
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="truncate font-medium">{j.activity}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[160px]">
                    <p className="truncate text-muted-foreground text-xs">{j.notes || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(j)} className="rounded-md p-1.5 transition hover:bg-muted">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(j.id)} className="rounded-md p-1.5 transition hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Tambah/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editTarget ? "Edit Jurnal" : "Tambah Jurnal"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 transition hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tanggal</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Kelas <span className="text-red-500">*</span></label>
                  <select value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30">
                    <option value="">-- Pilih Kelas --</option>
                    {classesList.map(c => <option key={c.id} value={c.id}>{c.nama}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Kegiatan <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Mengaji Al-Quran halaman 5-10..." value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Catatan</label>
                <textarea rows={3} placeholder="Keterangan tambahan..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted" disabled={saving}>Batal</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editTarget ? "Simpan Perubahan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Konfirmasi Hapus */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border/60" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold">Hapus Jurnal</h3>
                <p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">Apakah kamu yakin ingin menghapus jurnal ini?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
