import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  CalendarCheck, Search, Loader2, AlertCircle,
  UserCircle, ChevronDown, Save
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { ClassAPI, SantriAPI, AttendanceAPI } from "@/services/api"

function loadUser() {
  try { return JSON.parse(localStorage.getItem("user") ?? "{}") } catch { return {} }
}

function isMentorClass(c: any, userId: string) {
  return (
    c.mentorId === userId ||
    c.mentor?.id === userId ||
    c.mentor?.userId === userId
  )
}

type AttendanceStatus = "HADIR" | "SAKIT" | "IZIN" | "ALFA"

interface SantriRow {
  profileId: string
  userId: string
  name: string
  nis: string
  photoUrl: string | null
  status: AttendanceStatus
  notes: string
  existingId?: string
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string; bg: string }[] = [
  { value: "HADIR", label: "Hadir", color: "text-emerald-700", bg: "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-300" },
  { value: "SAKIT", label: "Sakit", color: "text-sky-700", bg: "bg-sky-100 dark:bg-sky-950/40 border-sky-300" },
  { value: "IZIN", label: "Izin", color: "text-amber-700", bg: "bg-amber-100 dark:bg-amber-950/40 border-amber-300" },
  { value: "ALFA", label: "Alfa", color: "text-red-700", bg: "bg-red-100 dark:bg-red-950/40 border-red-300" },
]

export default function MentorAbsensiPage() {
  const user = loadUser()
  const mentorId: string = user.id ?? ""

  const [myClasses, setMyClasses] = useState<any[]>([])
  const [selectedKelasId, setSelectedKelasId] = useState<string>("")
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [rows, setRows] = useState<SantriRow[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const [resKelas, resSantri, resAbsensi] = await Promise.all([
          ClassAPI.getAll().catch(() => null),
          SantriAPI.getAll().catch(() => null),
          AttendanceAPI.getAll().catch(() => null),
        ])
        const kelasArr = Array.isArray(resKelas?.data) ? resKelas.data : (resKelas?.data?.data ?? [])
        const myKelas = kelasArr.filter((c: any) => isMentorClass(c, mentorId))
        setMyClasses(myKelas)
        if (myKelas.length > 0 && !selectedKelasId) setSelectedKelasId(myKelas[0].id)

        const santriArr = Array.isArray(resSantri?.data) ? resSantri.data : (resSantri?.data?.data ?? [])
        const absenArr = Array.isArray(resAbsensi?.data) ? resAbsensi.data : (resAbsensi?.data?.data ?? [])
        buildRows(myKelas[0]?.id ?? selectedKelasId, santriArr, absenArr, date)
        setError("")
      } catch (err: any) {
        setError(err.message || "Gagal memuat data")
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [mentorId])

  const buildRows = (kelasId: string, santriArr: any[], absenArr: any[], forDate: string) => {
    if (!kelasId) return
    const inClass = santriArr.filter((s: any) => s.classId === kelasId || s.class?.id === kelasId)
    const dateStr = forDate

    const built: SantriRow[] = inClass.map((s: any) => {
      const existing = absenArr.find((a: any) => {
        const aDate = a.date ? a.date.slice(0, 10) : ""
        return (a.santriId === s.userId || a.santri?.id === s.userId) &&
          (a.classId === kelasId || a.class?.id === kelasId) &&
          aDate === dateStr
      })
      return {
        profileId: s.id,
        userId: s.userId ?? s.id,
        name: s.user?.fullName ?? s.fullName ?? "-",
        nis: s.user?.nis ?? s.nis ?? "-",
        photoUrl: s.photoUrl ?? null,
        status: existing?.status ?? "HADIR",
        notes: existing?.notes ?? "",
        existingId: existing?.id,
      }
    })
    setRows(built)
  }

  useEffect(() => {
    if (!selectedKelasId) return
    const refetch = async () => {
      try {
        const [resSantri, resAbsensi] = await Promise.all([SantriAPI.getAll(), AttendanceAPI.getAll()])
        const santriArr = Array.isArray(resSantri?.data) ? resSantri.data : (resSantri?.data?.data ?? [])
        const absenArr = Array.isArray(resAbsensi?.data) ? resAbsensi.data : (resAbsensi?.data?.data ?? [])
        buildRows(selectedKelasId, santriArr, absenArr, date)
      } catch { }
    }
    refetch()
  }, [selectedKelasId, date])

  const updateRow = (userId: string, field: keyof SantriRow, value: string) => {
    setRows(prev => prev.map(r => r.userId === userId ? { ...r, [field]: value } : r))
  }

  const handleSaveAll = async () => {
    if (!selectedKelasId) { toast.error("Pilih kelas terlebih dahulu."); return }
    setSaving(true)
    let successCount = 0
    let failCount = 0
    try {
      for (const row of rows) {
        const payload = {
          classId: selectedKelasId,
          santriId: row.userId,
          mentorId,
          date: new Date(date).toISOString(),
          status: row.status,
          notes: row.notes || undefined,
        }
        try {
          if (row.existingId) {
            await AttendanceAPI.update(row.existingId, { status: row.status, notes: row.notes || undefined, date: new Date(date).toISOString() })
          } else {
            await AttendanceAPI.submitAttendance(payload)
          }
          successCount++
        } catch {
          failCount++
        }
      }
      if (failCount === 0) {
        toast.success(`Absensi ${successCount} santri berhasil disimpan.`)
      } else {
        toast.warning(`${successCount} berhasil, ${failCount} gagal. (Kemungkinan BE belum izinkan MENTOR)`)
      }
      const [resSantri, resAbsensi] = await Promise.all([SantriAPI.getAll(), AttendanceAPI.getAll()])
      const santriArr = Array.isArray(resSantri?.data) ? resSantri.data : (resSantri?.data?.data ?? [])
      const absenArr = Array.isArray(resAbsensi?.data) ? resAbsensi.data : (resAbsensi?.data?.data ?? [])
      buildRows(selectedKelasId, santriArr, absenArr, date)
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan absensi.")
    } finally {
      setSaving(false)
    }
  }

  const setAll = (status: AttendanceStatus) => {
    setRows(prev => prev.map(r => ({ ...r, status })))
  }

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.nis.includes(search)
  )

  const stats = {
    hadir: rows.filter(r => r.status === "HADIR").length,
    sakit: rows.filter(r => r.status === "SAKIT").length,
    izin: rows.filter(r => r.status === "IZIN").length,
    alfa: rows.filter(r => r.status === "ALFA").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Absensi Santri</h1>
        </div>
        <p className="text-sm text-muted-foreground">Input dan kelola kehadiran santri di kelas Anda.</p>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-border/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground">Kelas</label>
            <div className="relative">
              <select
                value={selectedKelasId}
                onChange={e => setSelectedKelasId(e.target.value)}
                className="w-full appearance-none rounded-lg border bg-background px-3 py-2 pr-8 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
              >
                {myClasses.map((k: any) => (
                  <option key={k.id} value={k.id}>{k.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Set Semua</label>
            <div className="flex gap-1">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setAll(s.value)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition hover:opacity-80 ${s.bg} ${s.color}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground">Cari Santri</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Cari nama atau NIS..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>
      </Card>

      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: `Hadir: ${stats.hadir}`, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40" },
            { label: `Sakit: ${stats.sakit}`, color: "bg-sky-100 text-sky-700 dark:bg-sky-950/40" },
            { label: `Izin: ${stats.izin}`, color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40" },
            { label: `Alfa: ${stats.alfa}`, color: "bg-red-100 text-red-700 dark:bg-red-950/40" },
          ].map(s => (
            <span key={s.label} className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${s.color}`}>{s.label}</span>
          ))}
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Total: {rows.length}</span>
        </div>
      )}

      <Card className="border-0 shadow-sm ring-1 ring-border/60 overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Santri</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NIS</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <CalendarCheck className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    {myClasses.length === 0 ? "Anda belum ditugaskan ke kelas manapun." : "Tidak ada santri ditemukan."}
                  </td>
                </tr>
              ) : filtered.map((row, idx) => {
                const initials = row.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
                return (
                  <tr key={row.userId} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary overflow-hidden">
                          {row.photoUrl
                            ? <img src={row.photoUrl} alt={row.name} className="h-full w-full object-cover" />
                            : initials || <UserCircle className="h-5 w-5" />
                          }
                        </div>
                        <span className="font-medium">{row.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.nis}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {STATUS_OPTIONS.map(s => (
                          <button
                            key={s.value}
                            onClick={() => updateRow(row.userId, "status", s.value)}
                            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${row.status === s.value ? `${s.bg} ${s.color} ring-2 ring-offset-1 ring-current/30` : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Catatan opsional..."
                        value={row.notes}
                        onChange={e => updateRow(row.userId, "notes", e.target.value)}
                        className="w-full min-w-[160px] rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none transition focus:ring-2 focus:ring-primary/30"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {rows.length > 0 && (
        <div className="flex justify-end">
          <button
            id="btn-simpan-absensi"
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Menyimpan..." : "Simpan Absensi"}
          </button>
        </div>
      )}
    </div>
  )
}
