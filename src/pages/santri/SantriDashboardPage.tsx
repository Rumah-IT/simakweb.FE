import { useEffect, useState } from "react"
import {
  ClipboardCheck, FileText, BarChart3,
  BookOpenCheck, TrendingUp, CheckCircle2,
  Clock, XCircle, AlertCircle, Activity,
  GraduationCap, ArrowRight
} from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/services/api"

function loadUser() {
  try { return JSON.parse(localStorage.getItem("user") ?? "{}") } catch { return {} }
}

export default function SantriDashboardPage() {
  const user = loadUser()
  const displayName: string = user.name ?? user.fullName ?? "Santri"

  const [stats, setStats] = useState({ hadir: 0, izin: 0, sakit: 0, alfa: 0, tugas: 0, nilai: 0 })
  const [recentAbsensi, setRecentAbsensi] = useState<any[]>([])
  const [recentTugas, setRecentTugas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [resAbsensi, resTugas, resNilai] = await Promise.all([
          api.AttendanceAPI.getAll().catch(() => null),
          api.AssignmentAPI.getAll().catch(() => null),
          api.ScoreAPI.getAll().catch(() => null),
        ])

        const absensiArr = Array.isArray(resAbsensi?.data) ? resAbsensi.data : (resAbsensi?.data?.data ?? [])
        const tugasArr = Array.isArray(resTugas?.data) ? resTugas.data : (resTugas?.data?.data ?? [])
        const nilaiArr = Array.isArray(resNilai?.data) ? resNilai.data : (resNilai?.data?.data ?? [])

        setStats({
          hadir: absensiArr.filter((a: any) => a.status === "HADIR").length,
          izin: absensiArr.filter((a: any) => a.status === "IZIN").length,
          sakit: absensiArr.filter((a: any) => a.status === "SAKIT").length,
          alfa: absensiArr.filter((a: any) => a.status === "ALFA").length,
          tugas: tugasArr.length,
          nilai: nilaiArr.length,
        })

        setRecentAbsensi(absensiArr.slice(0, 5))
        setRecentTugas(tugasArr.slice(0, 4))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const totalAbsensi = stats.hadir + stats.izin + stats.sakit + stats.alfa
  const persenHadir = totalAbsensi > 0 ? Math.round((stats.hadir / totalAbsensi) * 100) : 0

  const statusCfg: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    HADIR: { label: "Hadir", color: "text-emerald-600", icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> },
    IZIN:  { label: "Izin",  color: "text-sky-600",     icon: <Clock className="h-3.5 w-3.5 text-sky-500" /> },
    SAKIT: { label: "Sakit", color: "text-amber-600",   icon: <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> },
    ALFA:  { label: "Alpha", color: "text-red-600",     icon: <XCircle className="h-3.5 w-3.5 text-red-500" /> },
  }

  return (
    <div className="space-y-8">

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Selamat datang, <span className="font-semibold text-foreground">{displayName}</span> — ini ringkasan akademik kamu hari ini.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Kehadiran", value: loading ? "—" : `${persenHadir}%`, sub: `${stats.hadir} dari ${totalAbsensi} pertemuan`, icon: ClipboardCheck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { title: "Total Tugas", value: loading ? "—" : stats.tugas, sub: "Tugas tersedia di kelasmu", icon: FileText, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
          { title: "Evaluasi Nilai", value: loading ? "—" : stats.nilai, sub: "Rekapan penilaian bulanan", icon: BarChart3, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/40" },
          { title: "Alpha", value: loading ? "—" : stats.alfa, sub: "Absensi tanpa keterangan", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/40" },
        ].map(card => (
          <Card key={card.title} className="group relative overflow-hidden border-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold tracking-tight ${loading ? "animate-pulse text-muted-foreground/40" : ""}`}>{card.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

{!loading && totalAbsensi > 0 && (
        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" />
              Rekap Kehadiran
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                <span>Tingkat Kehadiran</span>
                <span className="font-semibold text-foreground">{persenHadir}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${persenHadir >= 80 ? "bg-emerald-500" : persenHadir >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${persenHadir}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              {[
                { label: "Hadir", val: stats.hadir, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                { label: "Izin",  val: stats.izin,  color: "text-sky-600",     bg: "bg-sky-50 dark:bg-sky-950/30" },
                { label: "Sakit", val: stats.sakit, color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/30" },
                { label: "Alpha", val: stats.alfa,  color: "text-red-600",     bg: "bg-red-50 dark:bg-red-950/30" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl ${s.bg} p-3`}>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

<div className="grid gap-6 lg:grid-cols-5">
        
        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Riwayat Absensi Terakhir</h2>
            <Link to="/santri/absensi" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Lihat semua <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <Card className="border-0 shadow-sm ring-1 ring-border/60 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Memuat...</div>
            ) : recentAbsensi.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Belum ada data absensi.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tanggal</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kelas</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAbsensi.map((a: any, i: number) => {
                      const cfg = statusCfg[a.status] ?? { label: a.status, color: "text-muted-foreground", icon: null }
                      return (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3 text-muted-foreground text-xs">{a.date ? new Date(a.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}</td>
                          <td className="px-4 py-3 text-xs">{a.className ?? a.class?.name ?? "-"}</td>
                          <td className="px-4 py-3">
                            <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                              {cfg.icon}{cfg.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

<div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Tugas Tersedia</h2>
            <Link to="/santri/tugas" className="flex items-center gap-1 text-xs text-primary hover:underline">
              Lihat semua <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <Card className="border-0 shadow-sm ring-1 ring-border/60">
            <CardContent className="p-4 space-y-3">
              {loading ? (
                <p className="text-center text-sm text-muted-foreground py-6">Memuat...</p>
              ) : recentTugas.length === 0 ? (
                <div className="text-center py-6">
                  <BookOpenCheck className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Belum ada tugas tersedia.</p>
                </div>
              ) : (
                recentTugas.map((t: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl bg-muted/40 p-3 transition hover:bg-muted/60">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40">
                      <FileText className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight truncate">{t.title ?? t.name ?? "Tugas"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{t.class?.name ?? t.className ?? "Kelas tidak diketahui"}</p>
                      {t.dueDate && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          Deadline: {new Date(t.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

<div>
        <h2 className="mb-3 text-base font-semibold">Akses Cepat</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Absensi Saya", desc: "Lihat riwayat kehadiran", icon: ClipboardCheck, href: "/santri/absensi", color: "from-emerald-500 to-teal-600" },
            { title: "Tugas Saya", desc: "Lihat dan kumpulkan tugas", icon: FileText, href: "/santri/tugas", color: "from-violet-500 to-purple-600" },
            { title: "Jurnal Belajar", desc: "Catat aktivitas harianmu", icon: BookOpenCheck, href: "/santri/jurnal", color: "from-sky-500 to-blue-600" },
            { title: "Nilai Saya", desc: "Lihat evaluasi bulanan", icon: GraduationCap, href: "/santri/nilai", color: "from-orange-500 to-amber-600" },
          ].map(action => (
            <Link
              key={action.title}
              to={action.href}
              className="group relative flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:ring-primary/30"
            >
              <div className={`rounded-lg bg-gradient-to-br ${action.color} p-2.5 text-white shadow-sm`}>
                <action.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight">{action.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{action.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
