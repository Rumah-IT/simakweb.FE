import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  FileText, Search, MoreHorizontal,
  Pencil, Trash2, X, ClipboardList, Clock,
  AlertCircle, Calendar,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/services/api"

interface Tugas {
  id: string
  title: string
  description: string
  classId: string
  className: string
  mentorId: string
  mentorName: string
  dueDate: string
  submissionType: "TEXT" | "FILE"
  status: "aktif" | "terlambat"
}

const statusConfig = {
  aktif: { label: "Aktif", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", icon: <Clock className="h-3 w-3" /> },
  terlambat: { label: "Terlambat", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", icon: <AlertCircle className="h-3 w-3" /> },
}

const getStatus = (dueDate: string): Tugas["status"] => {
  const due = new Date(dueDate)
  const now = new Date()
  return now > due ? "terlambat" : "aktif"
}

type FormState = Omit<Tugas, "id" | "className" | "mentorName" | "status">

const emptyForm: FormState = {
  title: "",
  description: "",
  classId: "",
  mentorId: "",
  dueDate: new Date().toISOString().split("T")[0],
  submissionType: "TEXT"
}

export default function TugasPage() {
  const [data, setData] = useState<Tugas[]>([])
  const [classesList, setClassesList] = useState<{id: string, nama: string}[]>([])
  const [mentorsList, setMentorsList] = useState<{id: string, nama: string}[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("semua")
  const [filterClass, setFilterClass] = useState<string>("semua")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Tugas | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resAssignments, resClass, resMentor] = await Promise.all([
        api.AssignmentAPI.getAll(),
        api.ClassAPI.getAll(),
        api.AuthAPI.getMentors()
      ])

      const classesArray = Array.isArray(resClass.data) ? resClass.data : (resClass.data?.data || [])
      setClassesList(classesArray.map((c: any) => ({ id: c.id, nama: c.name })))

      const mentorsArray = Array.isArray(resMentor.data) ? resMentor.data : (resMentor.data?.data || [])
      setMentorsList(mentorsArray.map((m: any) => ({ id: m.id, nama: m.fullName })))

      const tArray = Array.isArray(resAssignments.data) ? resAssignments.data : (resAssignments.data?.data || [])
      const mapped = tArray.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        classId: t.classId || (t.class ? t.class.id : ""),
        className: t.class?.name || "-",
        mentorId: t.mentorId || (t.mentor ? t.mentor.id : ""),
        mentorName: t.mentor?.fullName || "-",
        dueDate: t.due_date || t.dueDate || "",
        submissionType: t.submissionType || "TEXT",
        status: getStatus(t.due_date || t.dueDate)
      }))
      setData(mapped)
      setError("")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Gagal memuat daftar tugas")
      toast.error("Gagal memuat daftar tugas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const statCards = [
    { label: "Total Tugas", value: data.length, icon: ClipboardList, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
    { label: "Aktif", value: data.filter(d => d.status === "aktif").length, icon: Clock, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/40" },
    { label: "Terlambat", value: data.filter(d => d.status === "terlambat").length, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/40" },
  ]

  const filtered = data.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.className.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "semua" || t.status === filterStatus
    const matchClass = filterClass === "semua" || t.classId === filterClass
    return matchSearch && matchStatus && matchClass
  })

const openEdit = (t: Tugas) => {
    setEditTarget(t)
    setForm({
      title: t.title,
      description: t.description,
      classId: t.classId,
      mentorId: t.mentorId,
      dueDate: t.dueDate.split("T")[0],
      submissionType: t.submissionType
    })
    setMenuOpen(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title || !form.classId || !form.mentorId || !form.dueDate) {
      toast.error("Harap lengkapi semua field wajib.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        classId: form.classId,
        mentorId: form.mentorId,
        submissionType: form.submissionType,
        due_date: new Date(form.dueDate).toISOString()
      }

      if (editTarget) {
        await api.AssignmentAPI.update(editTarget.id, payload)
        toast.success("Tugas berhasil diperbarui.")
      } else {
        await api.AssignmentAPI.create(payload)
        toast.success("Tugas berhasil ditambahkan.")
      }
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan tugas.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.AssignmentAPI.delete(id)
      toast.success("Tugas berhasil dihapus.")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus tugas.")
    } finally {
      setDeleteConfirm(null)
      setMenuOpen(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Tugas</h1>
        </div>
        <p className="text-sm text-muted-foreground">Kelola seluruh penugasan yang diberikan kepada santri di setiap kelas.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
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
            <input id="search-tugas" type="text" placeholder="Cari judul tugas atau kelas..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none ring-0 transition focus:ring-2 focus:ring-primary/30" />
          </div>
          <Select value={filterClass} onValueChange={v => setFilterClass(v || "")}>
            <SelectTrigger id="filter-kelas-tugas" className="w-40">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kelas</SelectItem>
              {classesList.map(k => <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v || "")}>
            <SelectTrigger id="filter-status-tugas" className="w-36">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="terlambat">Terlambat</SelectItem>
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
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Judul Tugas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tipe</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kelas & Mentor</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tenggat Waktu</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground"><FileText className="mx-auto mb-2 h-8 w-8 opacity-30" />Tidak ada tugas ditemukan.</td></tr>
              ) : filtered.map((t, idx) => {
                const cfg = statusConfig[t.status]
                return (
                  <tr key={t.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{t.description || "—"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium">{t.submissionType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-sm">{t.className}</div>
                      <div className="text-xs text-muted-foreground">{t.mentorName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />{new Date(t.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                    </td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.icon}{cfg.label}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button id={`menu-tugas-${t.id}`} onClick={() => setMenuOpen(menuOpen === t.id ? null : t.id)} className="rounded-md p-1.5 transition hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
                        {menuOpen === t.id && (
                          <div className="absolute right-0 top-8 z-20 min-w-[130px] rounded-lg border bg-popover shadow-lg">
                            <button onClick={() => openEdit(t)} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"><Pencil className="h-3.5 w-3.5" />Edit</button>
                            <button onClick={() => { setDeleteConfirm(t.id); setMenuOpen(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="h-3.5 w-3.5" />Hapus</button>
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
              <h2 className="text-lg font-bold">{editTarget ? "Edit Tugas" : "Tambah Tugas Baru"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 transition hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Judul Tugas <span className="text-red-500">*</span></label>
                <input id="input-judul-tugas" type="text" placeholder="Contoh: Membuat Aplikasi React" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Kelas <span className="text-red-500">*</span></label>
                  <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v || "" })}>
                    <SelectTrigger id="input-kelas-tugas" className="w-full">
                      <SelectValue placeholder="Pilih kelas...">
                        {form.classId ? classesList.find(k => k.id === form.classId)?.nama : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {classesList.map(k => <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Mentor Pembuat <span className="text-red-500">*</span></label>
                  <Select value={form.mentorId} onValueChange={v => setForm({ ...form, mentorId: v || "" })}>
                    <SelectTrigger id="input-mentor-tugas" className="w-full">
                      <SelectValue placeholder="Pilih mentor...">
                        {form.mentorId ? mentorsList.find(m => m.id === form.mentorId)?.nama : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {mentorsList.map(m => <SelectItem key={m.id} value={m.id}>{m.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tenggat Waktu <span className="text-red-500">*</span></label>
                  <input id="input-tenggat-tugas" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipe Pengumpulan <span className="text-red-500">*</span></label>
                  <Select value={form.submissionType} onValueChange={v => setForm({ ...form, submissionType: v as any })}>
                    <SelectTrigger id="input-tipe-tugas" className="w-full">
                      <SelectValue placeholder="Pilih tipe..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Teks (Link/URL/Jawaban)</SelectItem>
                      <SelectItem value="FILE">Upload File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Deskripsi / Instruksi</label>
                <textarea id="input-deskripsi-tugas" rows={3} placeholder="Jelaskan instruksi tugas..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Batal</button>
              <button id="btn-simpan-tugas" onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
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
              <div><h3 className="font-semibold">Hapus Tugas</h3><p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p></div>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">Apakah kamu yakin ingin menghapus tugas ini?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} disabled={loading} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Batal</button>
              <button id="btn-konfirm-hapus-tugas" onClick={() => handleDelete(deleteConfirm)} disabled={loading} className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50">
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
