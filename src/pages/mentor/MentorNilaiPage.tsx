import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  BarChart3, Search, Loader2, AlertCircle,
  Plus, Pencil, X, ChevronDown, UserCircle
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { ClassAPI, ScoreAPI, SantriAPI } from "@/services/api"

function loadUser() {
  try { return JSON.parse(localStorage.getItem("user") ?? "{}") } catch { return {} }
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

const emptyForm = {
  santriId: "",
  classId: "",
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  taskAvg: 0,
  attendancePoin: 0,
  maxAttendPoin: 0,
  attitudeAvg: 0,
  notes: "",
}

export default function MentorNilaiPage() {
  const user = loadUser()
  const mentorId: string = user.id ?? ""

  const [scores, setScores] = useState<any[]>([])
  const [myClasses, setMyClasses] = useState<any[]>([])
  const [santriList, setSantriList] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<any | null>(null)
  const [form, setForm] = useState(emptyForm)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resKelas, resNilai, resSantri] = await Promise.all([
        ClassAPI.getAll(),
        ScoreAPI.getAll(),
        SantriAPI.getAll(),
      ])
      const kelasArr = Array.isArray(resKelas?.data) ? resKelas.data : (resKelas?.data?.data ?? [])
      const myKelas = kelasArr.filter((c: any) => c.mentorId === mentorId || c.mentor?.id === mentorId)
      setMyClasses(myKelas)
      const myIds = myKelas.map((k: any) => k.id)

      const santriArr = Array.isArray(resSantri?.data) ? resSantri.data : (resSantri?.data?.data ?? [])
      const mySantri = santriArr.filter((s: any) => myIds.includes(s.classId) || myIds.includes(s.class?.id))
      setSantriList(mySantri)

      const nilaiArr = Array.isArray(resNilai?.data) ? resNilai.data : (resNilai?.data?.data ?? [])
      const filtered = nilaiArr.filter((n: any) => myIds.includes(n.classId) || myIds.includes(n.class?.id))
      setScores(filtered)
      setError("")
    } catch (err: any) {
      setError(err.message || "Gagal memuat data nilai")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [mentorId])

  const openAdd = () => {
    setEditTarget(null)
    setForm({ ...emptyForm, classId: myClasses[0]?.id ?? "", santriId: "" })
    setModalOpen(true)
  }

  const openEdit = (n: any) => {
    setEditTarget(n)
    setForm({
      santriId: n.santriId ?? n.santri?.id ?? "",
      classId: n.classId ?? n.class?.id ?? "",
      month: n.month,
      year: n.year,
      taskAvg: n.taskAvg ?? 0,
      attendancePoin: n.attendancePoin ?? 0,
      maxAttendPoin: n.maxAttendPoin ?? 0,
      attitudeAvg: n.attitudeAvg ?? 0,
      notes: n.notes ?? "",
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.santriId) { toast.error("Pilih santri terlebih dahulu."); return }
    if (!form.classId) { toast.error("Pilih kelas terlebih dahulu."); return }

    setSaving(true)
    try {
      const payload = {
        santriId: form.santriId,
        classId: form.classId,
        month: Number(form.month),
        year: Number(form.year),
        taskAvg: Number(form.taskAvg),
        attendancePoin: Number(form.attendancePoin),
        maxAttendPoin: Number(form.maxAttendPoin),
        attitudeAvg: Number(form.attitudeAvg),
        notes: form.notes || undefined,
      }
      if (editTarget) {
        await ScoreAPI.update(editTarget.id, {
          taskAvg: payload.taskAvg,
          attendancePoin: payload.attendancePoin,
          maxAttendPoin: payload.maxAttendPoin,
          attitudeAvg: payload.attitudeAvg,
          notes: payload.notes,
        })
        toast.success("Nilai berhasil diperbarui.")
      } else {
        await ScoreAPI.create(payload)
        toast.success("Nilai berhasil ditambahkan.")
      }
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan nilai.")
    } finally {
      setSaving(false)
    }
  }

  const filtered = scores.filter((n: any) => {
    const name = n.santri?.user?.fullName ?? n.santriName ?? ""
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
    if (score >= 70) return "text-sky-600 bg-sky-50 dark:bg-sky-950/30"
    if (score >= 55) return "text-amber-600 bg-amber-50 dark:bg-amber-950/30"
    return "text-red-600 bg-red-50 dark:bg-red-950/30"
  }

  const santriForSelectedClass = santriList.filter(s =>
    s.classId === form.classId || s.class?.id === form.classId
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Nilai Santri</h1>
        </div>
        <p className="text-sm text-muted-foreground">Rekap & input penilaian bulanan santri di kelas yang Anda ampu.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama santri..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          id="btn-tambah-nilai"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Tambah Nilai
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
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Santri</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kelas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Bulan/Tahun</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tugas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kehadiran</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Sikap</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Catatan</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                  <BarChart3 className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  Belum ada data nilai. Klik "Tambah Nilai" untuk memulai.
                </td></tr>
              ) : filtered.map((n: any, idx: number) => {
                const name = n.santri?.user?.fullName ?? n.santriName ?? "-"
                const kelasName = n.class?.name ?? myClasses.find(k => k.id === n.classId)?.name ?? "-"
                const month = MONTHS[(n.month ?? 1) - 1] ?? "-"
                return (
                  <tr key={n.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase() || <UserCircle className="h-4 w-4" />}
                        </div>
                        <span className="font-medium">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{kelasName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{month} {n.year}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${getScoreColor(n.taskAvg ?? 0)}`}>{n.taskAvg ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{n.attendancePoin ?? 0}/{n.maxAttendPoin ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${getScoreColor(n.attitudeAvg ?? 0)}`}>{n.attitudeAvg ?? 0}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{n.notes ?? "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(n)}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editTarget ? "Edit Nilai Bulanan" : "Tambah Nilai Bulanan"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Kelas <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={form.classId}
                    onChange={e => setForm({ ...form, classId: e.target.value, santriId: "" })}
                    disabled={!!editTarget}
                    className="w-full appearance-none rounded-lg border bg-background px-3 py-2 pr-8 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                  >
                    <option value="">Pilih Kelas</option>
                    {myClasses.map((k: any) => <option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Santri <span className="text-red-500">*</span></label>
                <div className="relative">
                  <select
                    value={form.santriId}
                    onChange={e => setForm({ ...form, santriId: e.target.value })}
                    disabled={!!editTarget || !form.classId}
                    className="w-full appearance-none rounded-lg border bg-background px-3 py-2 pr-8 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                  >
                    <option value="">Pilih Santri</option>
                    {santriForSelectedClass.map((s: any) => (
                      <option key={s.userId ?? s.id} value={s.userId ?? s.id}>{s.user?.fullName ?? s.fullName}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Bulan <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <select
                      value={form.month}
                      onChange={e => setForm({ ...form, month: Number(e.target.value) })}
                      disabled={!!editTarget}
                      className="w-full appearance-none rounded-lg border bg-background px-3 py-2 pr-8 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                    >
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Tahun <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={2020}
                    max={2099}
                    value={form.year}
                    onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                    disabled={!!editTarget}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Rata-rata Tugas (0–100)</label>
                  <input type="number" min={0} max={100} value={form.taskAvg}
                    onChange={e => setForm({ ...form, taskAvg: Number(e.target.value) })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Rata-rata Sikap (0–100)</label>
                  <input type="number" min={0} max={100} value={form.attitudeAvg}
                    onChange={e => setForm({ ...form, attitudeAvg: Number(e.target.value) })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Poin Kehadiran</label>
                  <input type="number" min={0} value={form.attendancePoin}
                    onChange={e => setForm({ ...form, attendancePoin: Number(e.target.value) })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Maks Poin Kehadiran</label>
                  <input type="number" min={0} value={form.maxAttendPoin}
                    onChange={e => setForm({ ...form, maxAttendPoin: Number(e.target.value) })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Catatan</label>
                <textarea
                  placeholder="Catatan untuk santri ini (opsional)..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">Batal</button>
              <button
                id="btn-simpan-nilai"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editTarget ? "Simpan Perubahan" : "Tambah Nilai"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
