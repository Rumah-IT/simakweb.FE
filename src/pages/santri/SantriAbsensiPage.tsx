import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  CalendarCheck, Search, CheckCircle2, XCircle, Clock,
  AlertCircle, Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/services/api"

type AttendanceStatus = "HADIR" | "IZIN" | "SAKIT" | "ALFA"

interface Attendance {
  id: string
  className: string
  date: string
  status: AttendanceStatus
  notes: string
  mentorName: string
}

const STATUS_CFG: Record<AttendanceStatus, { label: string; className: string; icon: React.ReactNode }> = {
  HADIR: { label: "Hadir", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: <CheckCircle2 className="h-3 w-3" /> },
  IZIN:  { label: "Izin",  className: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",                icon: <Clock       className="h-3 w-3" /> },
  SAKIT: { label: "Sakit", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",        icon: <AlertCircle className="h-3 w-3" /> },
  ALFA:  { label: "Alpha", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",                icon: <XCircle     className="h-3 w-3" /> },
}

function loadUser() {
  try { return JSON.parse(localStorage.getItem("user") ?? "{}") } catch { return {} }
}

export default function SantriAbsensiPage() {
  const user = loadUser()

  const [data, setData] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"semua" | AttendanceStatus>("semua")

  const fetchData = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await api.AttendanceAPI.getAll()
      const all = Array.isArray(res.data) ? res.data : (res.data?.data || [])

const mine = all.filter((a: any) => a.santriId === user.id)

      const mapped: Attendance[] = mine.map((a: any) => ({
        id: a.id,
        className: a.class?.name ?? a.classId ?? "-",
        date: a.date,
        status: a.status as AttendanceStatus,
        notes: a.notes ?? "-",
        mentorName: a.mentor?.fullName ?? "-",
      }))

mapped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setData(mapped)
    } catch (err: any) {
      const msg = err?.message || "Gagal mengambil rekap absensi"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = data.filter(a => {
    const matchSearch = a.className.toLowerCase().includes(search.toLowerCase()) ||
      a.mentorName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "semua" || a.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = {
    total: data.length,
    hadir: data.filter(a => a.status === "HADIR").length,
    izinSakit: data.filter(a => a.status === "IZIN" || a.status === "SAKIT").length,
    alfa: data.filter(a => a.status === "ALFA").length,
  }

  return (
    <div className="space-y-8">
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Absensi</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Rekap kehadiran santri per kelas per hari. Satu santri hanya dapat diabsen satu kali per kelas per tanggal.
        </p>
      </div>

<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Rekap", value: counts.total, icon: CalendarCheck, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
          { label: "Hadir", value: counts.hadir, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Izin / Sakit", value: counts.izinSakit, icon: Clock, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/40" },
          { label: "Alpha", value: counts.alfa, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/40" },
        ].map(card => (
          <Card key={card.label} className="border-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold tracking-tight ${loading ? "opacity-40 animate-pulse" : ""}`}>
                {loading ? "—" : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari kelas, mentor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Semua" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="HADIR">Hadir</SelectItem>
            <SelectItem value="IZIN">Izin</SelectItem>
            <SelectItem value="SAKIT">Sakit</SelectItem>
            <SelectItem value="ALFA">Alpha</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
            <button onClick={fetchData} className="mt-4 rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">
              Coba Lagi
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kelas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Mentor</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <CalendarCheck className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    {data.length === 0 ? "Belum ada data absensi." : "Tidak ada data yang cocok dengan filter."}
                  </td>
                </tr>
              ) : filtered.map((a, idx) => {
                const cfg = STATUS_CFG[a.status]
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{a.className}</td>
                    <td className="px-4 py-3 text-muted-foreground">{a.mentorName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.date ? new Date(a.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{a.notes || "-"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
