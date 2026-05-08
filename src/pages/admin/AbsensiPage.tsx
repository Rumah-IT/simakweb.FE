import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  CalendarCheck, Search, MoreHorizontal,
  Pencil, Trash2, X, CheckCircle2, XCircle, Clock,
  AlertCircle, Calendar, Users, Image, StickyNote,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/services/api"

type AttendanceStatus = "HADIR" | "IZIN" | "SAKIT" | "ALFA"

interface Attendance {
  id: string
  classId: string
  className: string    
  santriId: string
  santriName: string    
  mentorId: string
  mentorName: string    
  date: string          
  status: AttendanceStatus
  notes: string
  imageUrl: string
  createdAt: string
}

const today = new Date().toISOString().split("T")[0]

const STATUS_CFG: Record<AttendanceStatus, { label: string; className: string; icon: React.ReactNode }> = {
  HADIR: { label: "Hadir", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: <CheckCircle2 className="h-3 w-3" /> },
  IZIN:  { label: "Izin",  className: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",                icon: <Clock       className="h-3 w-3" /> },
  SAKIT: { label: "Sakit", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",        icon: <AlertCircle className="h-3 w-3" /> },
  ALFA: { label: "Alpha", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",                icon: <XCircle     className="h-3 w-3" /> },
}

type FormState = Omit<Attendance, "id" | "className" | "santriName" | "mentorName" | "createdAt">

const emptyForm: FormState = {
  classId: "", santriId: "", mentorId: "",
  date: today, status: "HADIR", notes: "", imageUrl: "",
}

function isDuplicate(data: Attendance[], form: FormState, excludeId?: string) {
  return data.some(a =>
    a.classId === form.classId &&
    a.santriId === form.santriId &&
    a.date.split("T")[0] === form.date &&
    a.id !== excludeId
  )
}

export default function AbsensiPage() {
  const [data, setData] = useState<Attendance[]>([])
  const [classesList, setClassesList] = useState<{id: string, nama: string}[]>([])
  const [santriList, setSantriList] = useState<{id: string, nama: string, nis: string}[]>([])
  const [mentorList, setMentorList] = useState<{id: string, nama: string}[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"semua" | AttendanceStatus>("semua")
  const [filterClass, setFilterClass] = useState("semua")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Attendance | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resAtt, resClass, resSantri, resMentor] = await Promise.all([
        api.AttendanceAPI.getAll(),
        api.ClassAPI.getAll(),
        api.SantriAPI.getAll(),
        api.AuthAPI.getMentors(),
      ])

      const classesArray = Array.isArray(resClass.data) ? resClass.data : (resClass.data?.data || [])
      setClassesList(classesArray.map((c: any) => ({ id: c.id, nama: c.name })))

      const santriArray = Array.isArray(resSantri.data) ? resSantri.data : (resSantri.data?.data || [])
      setSantriList(santriArray.map((s: any) => ({ id: s.id, nama: s.fullName, nis: s.santriProfile?.nis || "-" })))

      const mentorArray = Array.isArray(resMentor.data) ? resMentor.data : (resMentor.data?.data || [])
      setMentorList(mentorArray.map((m: any) => ({ id: m.id, nama: m.fullName })))

      const attArray = Array.isArray(resAtt.data) ? resAtt.data : (resAtt.data?.data || [])
      const mapped = attArray.map((a: any) => ({
        id: a.id,
        classId: a.classId,
        className: a.class?.name || "-",
        santriId: a.santriId,
        santriName: a.santri?.fullName || "-",
        mentorId: a.mentorId,
        mentorName: a.mentor?.fullName || "-",
        date: a.date.split("T")[0],
        status: a.status as AttendanceStatus,
        notes: a.notes || "",
        imageUrl: a.imageUrl || "",
        createdAt: a.createdAt,
      }))
      setData(mapped)
      setError("")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Gagal memuat rekap absensi")
      toast.error("Gagal mengambil rekap absensi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const statCards = [
    { label: "Total Rekap",  value: data.length,                                         icon: Users,        color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
    { label: "Hadir",        value: data.filter(d => d.status === "HADIR").length,        icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Izin / Sakit", value: data.filter(d => d.status === "IZIN" || d.status === "SAKIT").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
    { label: "Alpha",        value: data.filter(d => d.status === "ALFA").length,        icon: XCircle,      color: "text-red-600",     bg: "bg-red-50 dark:bg-red-950/40" },
  ]

  const filtered = data.filter(a => {
    const q = search.toLowerCase()
    const matchSearch = a.santriName.toLowerCase().includes(q) || a.className.toLowerCase().includes(q) || a.mentorName.toLowerCase().includes(q)
    const matchStatus = filterStatus === "semua" || a.status === filterStatus
    const matchClass  = filterClass === "semua"  || a.classId === filterClass
    return matchSearch && matchStatus && matchClass
  })

const openEdit = (a: Attendance) => {
    setEditTarget(a)
    setForm({ classId: a.classId, santriId: a.santriId, mentorId: a.mentorId, date: a.date, status: a.status, notes: a.notes, imageUrl: a.imageUrl })
    setMenuOpen(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.classId || !form.santriId || !form.mentorId || !form.date) {
      toast.error("Kelas, santri, mentor, dan tanggal wajib diisi.")
      return
    }
    if (isDuplicate(data, form, editTarget?.id)) {
      toast.error("Santri ini sudah diabsen di kelas yang sama pada tanggal tersebut.")
      return
    }

    setSaving(true)
    try {
      const payload = {
        classId: form.classId,
        santriId: form.santriId,
        mentorId: form.mentorId,
        date: new Date(form.date).toISOString(),
        status: form.status,
        notes: form.notes,
        imageUrl: form.imageUrl,
      }

      if (editTarget) {
        await api.AttendanceAPI.update(editTarget.id, payload)
        toast.success("Absensi berhasil diperbarui.")
      } else {
        await api.AttendanceAPI.submitAttendance(payload)
        toast.success("Absensi berhasil dicatat.")
      }
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan absensi.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.AttendanceAPI.delete(id)
      toast.success("Rekap absensi berhasil dihapus.")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus absensi.")
    } finally {
      setDeleteConfirm(null)
      setMenuOpen(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Absensi</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Rekap kehadiran santri per kelas per hari. Satu santri hanya dapat diabsen satu kali per kelas per tanggal.
        </p>
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
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input id="search-absensi" type="text" placeholder="Cari santri, kelas, mentor..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
          </div>
          <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
            <SelectTrigger id="filter-status-absensi" className="w-36">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="HADIR">Hadir</SelectItem>
              <SelectItem value="IZIN">Izin</SelectItem>
              <SelectItem value="SAKIT">Sakit</SelectItem>
              <SelectItem value="ALFA">Alpha</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterClass} onValueChange={v => setFilterClass(v ?? "semua")}>
            <SelectTrigger id="filter-kelas-absensi" className="w-44">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kelas</SelectItem>
              {classesList.map(k => <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>)}
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
                {["#", "Santri", "Kelas", "Mentor", "Tanggal", "Status", "Catatan", "Bukti", "Aksi"].map(h => (
                  <th key={h} className={`px-4 py-3 font-semibold text-muted-foreground ${h === "Aksi" ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                  <CalendarCheck className="mx-auto mb-2 h-8 w-8 opacity-30" />Tidak ada rekap absensi.
                </td></tr>
              ) : filtered.map((a, idx) => {
                const cfg = STATUS_CFG[a.status] || STATUS_CFG.ALFA 
                return (
                  <tr key={a.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{a.santriName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.className}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.mentorName}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(a.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.icon}{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[160px]">
                      <div className="flex items-start gap-1">
                        {a.notes ? <><StickyNote className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /><span className="line-clamp-2 text-xs">{a.notes}</span></> : <span className="text-xs">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {a.imageUrl
                        ? <a href={a.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Image className="h-3.5 w-3.5" />Lihat</a>
                        : <span className="text-xs text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button id={`menu-absensi-${a.id}`} onClick={() => setMenuOpen(menuOpen === a.id ? null : a.id)} className="rounded-md p-1.5 transition hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
                        {menuOpen === a.id && (
                          <div className="absolute right-0 top-8 z-20 min-w-[130px] rounded-lg border bg-popover shadow-lg">
                            <button onClick={() => openEdit(a)} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"><Pencil className="h-3.5 w-3.5" />Edit</button>
                            <button onClick={() => { setDeleteConfirm(a.id); setMenuOpen(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="h-3.5 w-3.5" />Hapus</button>
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
              <h2 className="text-lg font-bold">{editTarget ? "Edit Absensi" : "Catat Absensi"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 transition hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Kelas <span className="text-red-500">*</span></label>
                  <Select value={form.classId} onValueChange={v => setForm({ ...form, classId: v ?? "" })}>
                    <SelectTrigger id="input-kelas-absensi" className="w-full">
                      <SelectValue placeholder="Pilih kelas..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classesList.map(k => <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Santri <span className="text-red-500">*</span></label>
                  <Select value={form.santriId} onValueChange={v => setForm({ ...form, santriId: v ?? "" })}>
                    <SelectTrigger id="input-santri-absensi" className="w-full">
                      <SelectValue placeholder="Pilih santri..." />
                    </SelectTrigger>
                    <SelectContent>
                      {santriList.map(s => <SelectItem key={s.id} value={s.id}>{s.nama} ({s.nis})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Mentor <span className="text-red-500">*</span></label>
                  <Select value={form.mentorId} onValueChange={v => setForm({ ...form, mentorId: v ?? "" })}>
                    <SelectTrigger id="input-mentor-absensi" className="w-full">
                      <SelectValue placeholder="Pilih mentor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mentorList.map(m => <SelectItem key={m.id} value={m.id}>{m.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tanggal <span className="text-red-500">*</span></label>
                  <input id="input-tanggal-absensi" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Status Kehadiran</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["HADIR", "IZIN", "SAKIT", "ALFA"] as AttendanceStatus[]).map(s => (
                    <button key={s} onClick={() => setForm({ ...form, status: s })} className={`rounded-lg border py-2 text-xs font-medium transition ${form.status === s ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                      {STATUS_CFG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Catatan (notes)</label>
                <textarea id="input-notes-absensi" rows={2} placeholder="Contoh: Demam tinggi, sudah izin via ortu..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  URL Bukti Foto <span className="text-muted-foreground/60">(imageUrl — opsional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <input id="input-imageurl-absensi" type="url" placeholder="https://..." value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
                {form.classId && form.santriId && form.date && isDuplicate(data, form, editTarget?.id) && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Santri ini sudah diabsen di kelas yang sama pada tanggal ini.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted" disabled={saving}>Batal</button>
              <button id="btn-simpan-absensi" onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
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
              <div><h3 className="font-semibold">Hapus Rekap</h3><p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p></div>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">Apakah kamu yakin ingin menghapus rekap absensi ini?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted" disabled={loading}>Batal</button>
              <button id="btn-konfirm-hapus-absensi" onClick={() => handleDelete(deleteConfirm)} disabled={loading} className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50">
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
