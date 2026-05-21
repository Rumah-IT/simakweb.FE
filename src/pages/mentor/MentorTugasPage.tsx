import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  ClipboardList, Plus, Pencil, Trash2,
  X, Loader2, AlertCircle, Calendar,
  ChevronDown, BookOpen, Search
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { ClassAPI, AssignmentAPI } from "@/services/api"

function loadUser() {
  try { return JSON.parse(localStorage.getItem("user") ?? "{}") } catch { return {} }
}

type SubmissionType = "TEXT" | "FILE"

interface Assignment {
  id: string
  title: string
  description?: string
  submissionType: SubmissionType
  attachmentUrl?: string
  due_date: string
  classId: string
  className?: string
  _count?: { submissions: number }
}

const emptyForm = {
  classId: "",
  title: "",
  description: "",
  submissionType: "TEXT" as SubmissionType,
  attachmentUrl: "",
  due_date: "",
}

export default function MentorTugasPage() {
  const user = loadUser()
  const mentorId: string = user.id ?? ""

  const [myClasses, setMyClasses] = useState<any[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [search, setSearch] = useState("")
  const [filterKelas, setFilterKelas] = useState("all")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Assignment | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resKelas, resAssignment] = await Promise.all([
        ClassAPI.getAll(),
        AssignmentAPI.getAll(),
      ])
      const kelasArr = Array.isArray(resKelas?.data) ? resKelas.data : (resKelas?.data?.data ?? [])
      const myKelas = kelasArr.filter((c: any) => c.mentorId === mentorId || c.mentor?.id === mentorId)
      setMyClasses(myKelas)

      const aArr = Array.isArray(resAssignment?.data) ? resAssignment.data : (resAssignment?.data?.data ?? [])
      const myIds = myKelas.map((k: any) => k.id)
      const myAssignments: Assignment[] = aArr
        .filter((a: any) => myIds.includes(a.classId) || myIds.includes(a.class?.id) || a.mentorId === mentorId || a.mentor?.id === mentorId)
        .map((a: any) => ({
          id: a.id,
          title: a.title,
          description: a.description,
          submissionType: a.submissionType,
          attachmentUrl: a.attachmentUrl,
          due_date: a.due_date ?? a.dueDate,
          classId: a.classId ?? a.class?.id,
          className: a.class?.name ?? myKelas.find((k: any) => k.id === a.classId)?.name ?? "-",
          _count: a._count,
        }))
      setAssignments(myAssignments)
      setError("")
    } catch (err: any) {
      setError(err.message || "Gagal memuat data tugas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [mentorId])

  const openAdd = () => {
    setEditTarget(null)
    setForm({ ...emptyForm, classId: myClasses[0]?.id ?? "" })
    setModalOpen(true)
  }

  const openEdit = (a: Assignment) => {
    setEditTarget(a)
    setForm({
      classId: a.classId,
      title: a.title,
      description: a.description ?? "",
      submissionType: a.submissionType,
      attachmentUrl: a.attachmentUrl ?? "",
      due_date: a.due_date ? a.due_date.slice(0, 16) : "",
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Judul tugas wajib diisi."); return }
    if (!form.classId) { toast.error("Pilih kelas terlebih dahulu."); return }
    if (!form.due_date) { toast.error("Batas waktu pengumpulan wajib diisi."); return }

    setSaving(true)
    try {
      const payload = {
        classId: form.classId,
        mentorId,
        title: form.title,
        description: form.description || undefined,
        submissionType: form.submissionType,
        attachmentUrl: form.attachmentUrl || undefined,
        due_date: new Date(form.due_date).toISOString(),
      }
      if (editTarget) {
        await AssignmentAPI.update(editTarget.id, {
          title: form.title,
          description: form.description || undefined,
          submissionType: form.submissionType,
          attachmentUrl: form.attachmentUrl || undefined,
          due_date: new Date(form.due_date).toISOString(),
        })
        toast.success("Tugas berhasil diperbarui.")
      } else {
        await AssignmentAPI.create(payload)
        toast.success("Tugas berhasil dibuat.")
      }
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan tugas. (Kemungkinan BE belum izinkan MENTOR)")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await AssignmentAPI.delete(id)
      toast.success("Tugas berhasil dihapus.")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus tugas.")
    } finally {
      setDeleteConfirm(null)
    }
  }

  const filtered = assignments.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase())
    const matchKelas = filterKelas === "all" || a.classId === filterKelas
    return matchSearch && matchKelas
  })

  const formatDate = (d: string) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const isOverdue = (d: string) => d && new Date(d) < new Date()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Tugas</h1>
        </div>
        <p className="text-sm text-muted-foreground">Kelola tugas untuk santri di kelas yang Anda ampu.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari judul tugas..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative">
            <select
              value={filterKelas}
              onChange={e => setFilterKelas(e.target.value)}
              className="appearance-none rounded-lg border bg-background px-3 py-2 pr-8 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">Semua Kelas</option>
              {myClasses.map((k: any) => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <button
          id="btn-tambah-tugas"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Buat Tugas
        </button>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-border/60 overflow-hidden relative min-h-[300px]">
        {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
        {error && !loading && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center"><AlertCircle className="h-8 w-8 text-red-500 mb-2" /><p className="text-sm text-muted-foreground">{error}</p></div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Judul Tugas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kelas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tipe</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Batas Waktu</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Submisi</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                  <ClipboardList className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  Belum ada tugas. Klik "Buat Tugas" untuk memulai.
                </td></tr>
              ) : filtered.map((a, idx) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium leading-tight">{a.title}</p>
                    {a.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{a.className}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${a.submissionType === "FILE" ? "bg-violet-100 text-violet-700 dark:bg-violet-950/40" : "bg-sky-100 text-sky-700 dark:bg-sky-950/40"}`}>
                      <BookOpen className="h-3 w-3" />{a.submissionType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-1.5 text-xs ${isOverdue(a.due_date) ? "text-red-500" : "text-muted-foreground"}`}>
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(a.due_date)}
                      {isOverdue(a.due_date) && <span className="font-semibold">(Lewat)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{a._count?.submissions ?? "-"} submisi</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(a)} className="rounded-md p-1.5 hover:bg-muted transition"><Pencil className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteConfirm(a.id)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editTarget ? "Edit Tugas" : "Buat Tugas Baru"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Kelas <span className="text-red-500">*</span></label>
                <select
                  value={form.classId}
                  onChange={e => setForm({ ...form, classId: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                  disabled={!!editTarget}
                >
                  {myClasses.map((k: any) => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Judul Tugas <span className="text-red-500">*</span></label>
                <input
                  id="input-judul-tugas"
                  type="text"
                  placeholder="Contoh: Membuat aplikasi React"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Deskripsi</label>
                <textarea
                  placeholder="Deskripsi tugas (opsional)..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tipe Submisi <span className="text-red-500">*</span></label>
                  <select
                    value={form.submissionType}
                    onChange={e => setForm({ ...form, submissionType: e.target.value as SubmissionType })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="TEXT">TEXT</option>
                    <option value="FILE">FILE</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Batas Waktu <span className="text-red-500">*</span></label>
                  <input
                    type="datetime-local"
                    value={form.due_date}
                    onChange={e => setForm({ ...form, due_date: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">URL Lampiran (opsional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={form.attachmentUrl}
                  onChange={e => setForm({ ...form, attachmentUrl: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted transition">Batal</button>
              <button
                id="btn-simpan-tugas"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50 transition"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editTarget ? "Simpan Perubahan" : "Buat Tugas"}
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
            <p className="mb-5 text-sm text-muted-foreground">Yakin ingin menghapus tugas ini? Semua submisi terkait juga akan terhapus.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">Batal</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
