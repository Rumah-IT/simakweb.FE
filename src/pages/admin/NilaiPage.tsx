import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  BarChart3, Search, MoreHorizontal,
  Pencil, Trash2, X, Star, TrendingUp, TrendingDown,
  Minus, Calendar, User, Loader2, AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/services/api"

interface Nilai {
  id: string
  santriId: string
  santriName: string
  nis: string
  classId: string
  className: string
  month: number
  year: number
  taskAvg: number
  attitudeAvg: number
  attendancePoin: number
  maxAttendPoin: number
  rataRata: number
  predikat: "A" | "B" | "C" | "D"
  notes: string
}

const getPredikat = (avg: number): Nilai["predikat"] => {
  if (avg >= 85) return "A"
  if (avg >= 70) return "B"
  if (avg >= 55) return "C"
  return "D"
}

const calcAvg = (task: number, attitude: number, attend: number, maxAttend: number) => {
  const attendPercent = maxAttend ? (attend / maxAttend) * 100 : 0
  return Math.round((task + attitude + attendPercent) / 3)
}

const predikatConfig: Record<Nilai["predikat"], string> = {
  A: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  B: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  C: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  D: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

type FormState = {
  santriId: string
  classId: string
  bulan: string 
  taskAvg: number
  attitudeAvg: number
  attendancePoin: number
  maxAttendPoin: number
  notes: string
}

const currentYearMonth = new Date().toISOString().slice(0, 7)
const emptyForm: FormState = { santriId: "", classId: "", bulan: currentYearMonth, taskAvg: 0, attitudeAvg: 0, attendancePoin: 0, maxAttendPoin: 100, notes: "" }

export default function NilaiPage() {
  const [data, setData] = useState<Nilai[]>([])
  const [classesList, setClassesList] = useState<{id: string, nama: string}[]>([])
  const [santriList, setSantriList] = useState<{id: string, nama: string, nis: string}[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [filterPredikat, setFilterPredikat] = useState("semua")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Nilai | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resScores, resClass, resSantri] = await Promise.all([
        api.ScoreAPI.getAll(),
        api.ClassAPI.getAll(),
        api.SantriAPI.getAll()
      ])

      const classesArray = Array.isArray(resClass.data) ? resClass.data : (resClass.data?.data || [])
      setClassesList(classesArray.map((c: any) => ({ id: c.id, nama: c.name })))

      const santriArray = Array.isArray(resSantri.data) ? resSantri.data : (resSantri.data?.data || [])
      setSantriList(santriArray.map((s: any) => ({ id: s.id, nama: s.fullName, nis: s.santriProfile?.nis || "-" })))

      const sArray = Array.isArray(resScores.data) ? resScores.data : (resScores.data?.data || [])
      const mapped = sArray.map((s: any) => {
        const rataRata = calcAvg(s.taskAvg || 0, s.attitudeAvg || 0, s.attendancePoin || 0, s.maxAttendPoin || 100)
        return {
          id: s.id,
          santriId: s.santriId,
          santriName: s.santri?.fullName || "-",
          nis: s.santri?.nis || "-",
          classId: s.classId,
          className: s.class?.name || "-",
          month: s.month,
          year: s.year,
          taskAvg: s.taskAvg || 0,
          attitudeAvg: s.attitudeAvg || 0,
          attendancePoin: s.attendancePoin || 0,
          maxAttendPoin: s.maxAttendPoin || 100,
          rataRata,
          predikat: getPredikat(rataRata),
          notes: s.notes || ""
        }
      })
      setData(mapped)
      setError("")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Gagal memuat rekap nilai")
      toast.error("Gagal memuat rekap nilai")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const avgAll = data.length ? Math.round(data.reduce((a, d) => a + d.rataRata, 0) / data.length) : 0
  const statCards = [
    { label: "Total Rekap", value: data.length, icon: BarChart3, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
    { label: "Predikat A", value: data.filter(d => d.predikat === "A").length, icon: Star, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Rata-rata", value: avgAll, icon: TrendingUp, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/40" },
    { label: "Perlu Perhatian", value: data.filter(d => d.predikat === "C" || d.predikat === "D").length, icon: TrendingDown, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/40" },
  ]

  const filtered = data.filter(n => {
    const q = search.toLowerCase()
    const matchSearch = n.santriName.toLowerCase().includes(q) || n.className.toLowerCase().includes(q)
    const matchPred = filterPredikat === "semua" || n.predikat === filterPredikat
    return matchSearch && matchPred
  })

  const openEdit = (n: Nilai) => { 
    setEditTarget(n); 
    const monthStr = n.month.toString().padStart(2, "0")
    setForm({ 
      santriId: n.santriId, 
      classId: n.classId, 
      bulan: `${n.year}-${monthStr}`, 
      taskAvg: n.taskAvg, 
      attitudeAvg: n.attitudeAvg, 
      attendancePoin: n.attendancePoin,
      maxAttendPoin: n.maxAttendPoin,
      notes: n.notes 
    }); 
    setMenuOpen(null); 
    setModalOpen(true) 
  }

  const handleSave = async () => {
    if (!form.santriId || !form.classId || !form.bulan) { 
      toast.error("Harap lengkapi semua field wajib.")
      return 
    }
    
    setSaving(true)
    try {
      const [yearStr, monthStr] = form.bulan.split("-")
      const payload = {
        santriId: form.santriId,
        classId: form.classId,
        year: parseInt(yearStr),
        month: parseInt(monthStr),
        taskAvg: form.taskAvg,
        attitudeAvg: form.attitudeAvg,
        attendancePoin: form.attendancePoin,
        maxAttendPoin: form.maxAttendPoin,
        notes: form.notes
      }

      if (editTarget) {
        await api.ScoreAPI.update(editTarget.id, payload)
        toast.success("Nilai berhasil diperbarui.")
      } else {
        await api.ScoreAPI.create(payload)
        toast.success("Evaluasi nilai berhasil disimpan.")
      }
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan evaluasi nilai.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => { 
    try {
      await api.ScoreAPI.delete(id)
      toast.success("Rekap nilai berhasil dihapus.")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus rekap nilai.")
    } finally {
      setDeleteConfirm(null)
      setMenuOpen(null)
    }
  }

  const ScoreBar = ({ value, max = 100 }: { value: number, max?: number }) => {
    const pct = max > 0 ? (value / max) * 100 : 0
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full ${pct >= 85 ? "bg-emerald-500" : pct >= 70 ? "bg-sky-500" : pct >= 55 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <span className="text-xs font-mono">{value}</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Evaluasi Bulanan</h1>
        </div>
        <p className="text-sm text-muted-foreground">Rekap penilaian dan evaluasi perkembangan santri setiap bulan.</p>
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
            <input id="search-nilai" type="text" placeholder="Cari santri atau kelas..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
          </div>
          <Select value={filterPredikat} onValueChange={v => setFilterPredikat(v || "")}>
            <SelectTrigger id="filter-predikat-nilai" className="w-40">
              <SelectValue placeholder="Semua Predikat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Predikat</SelectItem>
              <SelectItem value="A">Predikat A</SelectItem>
              <SelectItem value="B">Predikat B</SelectItem>
              <SelectItem value="C">Predikat C</SelectItem>
              <SelectItem value="D">Predikat D</SelectItem>
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
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Santri</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Bulan</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Akademik</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Akhlak</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kehadiran</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Rata-rata</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Predikat</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground"><BarChart3 className="mx-auto mb-2 h-8 w-8 opacity-30" />Tidak ada rekap nilai ditemukan.</td></tr>
              ) : filtered.map((n, idx) => {
                const monthStr = n.month.toString().padStart(2, "0")
                return (
                  <tr key={n.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" /><div><div className="font-medium">{n.santriName}</div><div className="text-xs text-muted-foreground">{n.className}</div></div></div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />{new Date(`${n.year}-${monthStr}-01`).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</div>
                    </td>
                    <td className="px-4 py-3"><ScoreBar value={n.taskAvg} /></td>
                    <td className="px-4 py-3"><ScoreBar value={n.attitudeAvg} /></td>
                    <td className="px-4 py-3"><ScoreBar value={n.attendancePoin} max={n.maxAttendPoin} /></td>
                    <td className="px-4 py-3 font-bold">{n.rataRata}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${predikatConfig[n.predikat]}`}>{n.predikat}</span></td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button id={`menu-nilai-${n.id}`} onClick={() => setMenuOpen(menuOpen === n.id ? null : n.id)} className="rounded-md p-1.5 transition hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
                        {menuOpen === n.id && (
                          <div className="absolute right-0 top-8 z-20 min-w-[130px] rounded-lg border bg-popover shadow-lg">
                            <button onClick={() => openEdit(n)} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"><Pencil className="h-3.5 w-3.5" />Edit</button>
                            <button onClick={() => { setDeleteConfirm(n.id); setMenuOpen(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="h-3.5 w-3.5" />Hapus</button>
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
              <h2 className="text-lg font-bold">{editTarget ? "Edit Nilai" : "Input Nilai Bulanan"}</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 transition hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Santri <span className="text-red-500">*</span></label>
                  <Select value={form.santriId} onValueChange={v => setForm({ ...form, santriId: v || "" })}>
                    <SelectTrigger id="input-santri-nilai" className="w-full">
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
                    <SelectTrigger id="input-kelas-nilai" className="w-full">
                      <SelectValue placeholder="Pilih kelas..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classesList.map(k => <SelectItem key={k.id} value={k.id}>{k.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Bulan & Tahun <span className="text-red-500">*</span></label>
                <input id="input-bulan-nilai" type="month" value={form.bulan} onChange={e => setForm({ ...form, bulan: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Akademik / Tugas (0–100)</label>
                  <input id="input-akademik-nilai" type="number" min={0} max={100} value={form.taskAvg} onChange={e => setForm({ ...form, taskAvg: Number(e.target.value) })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Akhlak (0–100)</label>
                  <input id="input-akhlak-nilai" type="number" min={0} max={100} value={form.attitudeAvg} onChange={e => setForm({ ...form, attitudeAvg: Number(e.target.value) })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Kehadiran ({`Max: ${form.maxAttendPoin}`})</label>
                  <input id="input-kehadiran-nilai" type="number" min={0} max={form.maxAttendPoin} value={form.attendancePoin} onChange={e => setForm({ ...form, attendancePoin: Number(e.target.value) })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
                </div>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm flex items-center gap-2">
                <Minus className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Rata-rata otomatis: </span>
                <strong>{calcAvg(form.taskAvg, form.attitudeAvg, form.attendancePoin, form.maxAttendPoin)}</strong>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${predikatConfig[getPredikat(calcAvg(form.taskAvg, form.attitudeAvg, form.attendancePoin, form.maxAttendPoin))]}`}>{getPredikat(calcAvg(form.taskAvg, form.attitudeAvg, form.attendancePoin, form.maxAttendPoin))}</span>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Catatan Tambahan</label>
                <input id="input-catatan-nilai" type="text" placeholder="Catatan opsional..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Batal</button>
              <button id="btn-simpan-nilai" onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editTarget ? "Simpan Perubahan" : "Simpan"}
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
              <div><h3 className="font-semibold">Hapus Rekap Nilai</h3><p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p></div>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">Apakah kamu yakin ingin menghapus rekap nilai ini?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} disabled={loading} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Batal</button>
              <button id="btn-konfirm-hapus-nilai" onClick={() => handleDelete(deleteConfirm)} disabled={loading} className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50">
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
