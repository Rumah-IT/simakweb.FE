import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Users, GraduationCap, Layers, BookOpen,
  TrendingUp, ClipboardCheck, FileText, ArrowUpRight,
  Activity, CheckCircle2, AlertCircle, Clock, School
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/services/api"

const statusIcon = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />,
  info: <Clock className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />,
}

const quickActions = [
  { title: "Data Santri",   desc: "Kelola data santri",       icon: Users,          href: "/dashboard/santri",  color: "from-sky-500 to-blue-600" },
  { title: "Rekap Absensi", desc: "Kehadiran per kelas",      icon: ClipboardCheck, href: "/dashboard/absensi", color: "from-emerald-500 to-teal-600" },
  { title: "Daftar Tugas",  desc: "Penugasan per kelas",      icon: FileText,       href: "/dashboard/tugas",   color: "from-violet-500 to-purple-600" },
  { title: "Kelola Kelas",  desc: "Atur kelas & divisi",      icon: GraduationCap,  href: "/dashboard/kelas",   color: "from-orange-500 to-amber-600" },
  { title: "Divisi",        desc: "Lihat daftar divisi",      icon: Layers,         href: "/dashboard/divisi",  color: "from-pink-500 to-rose-600" },
  { title: "Mentor",        desc: "Manajemen akun mentor",    icon: School,         href: "/dashboard/mentor",  color: "from-indigo-500 to-violet-600" },
]

export default function DashboardPage() {
  const [stats, setStats] = useState({ totalSantri: 0, totalDivisi: 0, totalKelas: 0, totalPelajaran: 0 })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("Admin")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const stored = localStorage.getItem("user")
        if (stored) {
          try { const u = JSON.parse(stored); if (u.fullName) setUserName(u.fullName) } catch { /* ignore */ }
        }

        const [resSantri, resDivisi, resKelas, resTugas] = await Promise.all([
          api.SantriAPI.getAll(),
          api.DivisiAPI.getAll(),
          api.ClassAPI.getAll(),
          api.AssignmentAPI.getAll().catch(() => null),
        ])

        const totalSantri   = Array.isArray(resSantri?.data)  ? resSantri.data.length  : (resSantri?.data?.data?.length   || 0)
        const totalDivisi   = Array.isArray(resDivisi?.data)  ? resDivisi.data.length  : (resDivisi?.data?.data?.length   || 0)
        const totalKelas    = Array.isArray(resKelas?.data)   ? resKelas.data.length   : (resKelas?.data?.data?.length    || 0)
        const totalPelajaran = Array.isArray(resTugas?.data)  ? resTugas.data.length   : (resTugas?.data?.data?.length    || 0)

        setStats({ totalSantri, totalDivisi, totalKelas, totalPelajaran })
        setRecentActivities([
          { id: 1, message: "Sinkronisasi data divisi berhasil",          time: "Baru saja",   status: "success" },
          { id: 2, message: `${totalSantri} santri aktif ditemukan`,       time: "10 mnt lalu", status: "info"    },
          { id: 3, message: `${totalKelas} kelas sedang berjalan`,         time: "1 jam lalu",  status: "success" },
          { id: 4, message: `${totalPelajaran} tugas tersedia`,            time: "2 jam lalu",  status: "info"    },
        ])
      } catch (e) {
        console.error("Gagal memuat dashboard:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const statCards = [
    { title: "Total Santri",   value: stats.totalSantri,   label: "Aktif",      trend: true,  icon: Users,         color: "text-sky-600",    bg: "bg-sky-50 dark:bg-sky-950/40" },
    { title: "Total Divisi",   value: stats.totalDivisi,   label: "Tersedia",   trend: false, icon: Layers,        color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
    { title: "Total Kelas",    value: stats.totalKelas,    label: "Terjadwal",  trend: true,  icon: GraduationCap, color: "text-emerald-600",bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { title: "Total Pelajaran",value: stats.totalPelajaran,label: "Tugas & Ujian",trend: true,icon: BookOpen,      color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/40" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Selamat datang kembali, <span className="font-medium text-foreground">{userName}</span> — berikut ringkasan data hari ini.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="group relative overflow-hidden border-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl md:text-3xl font-bold tracking-tight transition-all ${loading ? "animate-pulse text-muted-foreground/30" : ""}`}>
                {loading ? "—" : card.value}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {card.trend && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                <span className={card.trend ? "text-emerald-600 font-medium" : ""}>{card.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold">Aksi Cepat</h2>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                to={action.href}
                className="group flex items-start gap-3 rounded-xl border bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:ring-primary/30"
              >
                <div className={`shrink-0 rounded-lg bg-gradient-to-br ${action.color} p-2.5 text-white shadow-sm`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">{action.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">{action.desc}</p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 mt-0.5" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Aktivitas Terbaru</h2>
          <Card className="border-0 shadow-sm ring-1 ring-border/60">
            <CardContent className="p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <ul className="space-y-4">
                  {recentActivities.map((a) => (
                    <li key={a.id} className="flex items-start gap-3">
                      {statusIcon[a.status as keyof typeof statusIcon]}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{a.message}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{a.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
