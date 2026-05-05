import { useEffect, useState } from "react"
import {
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  TrendingUp,
  ClipboardCheck,
  FileText,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/services/api"

interface StatCard {
  title: string
  value: string | number
  change: string
  trend: "up" | "down" | "neutral"
  icon: React.ElementType
  color: string
  bg: string
}

const statusIcon = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
  info: <Clock className="h-4 w-4 text-sky-500" />,
}

const quickActions = [
  {
    title: "Data Santri",
    desc: "Lihat dan kelola data santri",
    icon: Users,
    href: "/dashboard/santri",
    color: "from-sky-500 to-blue-600",
  },
  {
    title: "Rekap Absensi",
    desc: "Lihat kehadiran santri per kelas",
    icon: ClipboardCheck,
    href: "/dashboard/absensi",
    color: "from-emerald-500 to-teal-600",
  },
  {
    title: "Daftar Tugas",
    desc: "Pantau penugasan untuk kelas",
    icon: FileText,
    href: "/dashboard/tugas",
    color: "from-violet-500 to-purple-600",
  },
  {
    title: "Kelola Kelas",
    desc: "Atur kelas dan divisi pesantren",
    icon: GraduationCap,
    href: "/dashboard/kelas",
    color: "from-orange-500 to-amber-600",
  },
]

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalSantri: 0,
    totalDivisi: 0,
    totalKelas: 0,
    totalPelajaran: 0,
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("Admin")

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const storedUser = localStorage.getItem('user')
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          if (parsedUser.fullName) setUserName(parsedUser.fullName)
        } catch(e) {}
      }

      const [resSantri, resDivisi, resKelas, resTugas] = await Promise.all([
        api.SantriAPI.getAll(),
        api.DivisiAPI.getAll(),
        api.ClassAPI.getAll(),
        api.AssignmentAPI.getAll().catch(() => null) 
      ])

      // Determine total counts
      const totalSantri = Array.isArray(resSantri?.data) ? resSantri.data.length : (resSantri?.data?.data?.length || 0)
      const totalDivisi = resDivisi?.data?.meta?.total || (Array.isArray(resDivisi?.data) ? resDivisi.data.length : (resDivisi?.data?.data?.length || 0))
      const totalKelas = resKelas?.data?.meta?.total || (Array.isArray(resKelas?.data) ? resKelas.data.length : (resKelas?.data?.data?.length || 0))
      const totalPelajaran = Array.isArray(resTugas?.data) ? resTugas.data.length : (resTugas?.data?.data?.length || 0)
      
      setStats({
        totalSantri,
        totalDivisi,
        totalKelas,
        totalPelajaran,
      })

      // Mock recent activities since backend doesn't have an audit log endpoint
      setRecentActivities([
        { id: 1, message: "Berhasil melakukan sinkronisasi data divisi", time: "Baru saja", status: "success" },
        { id: 2, message: `Menemukan ${totalSantri} santri aktif`, time: "10 menit lalu", status: "info" },
        { id: 3, message: `Sistem mendeteksi ${totalKelas} kelas berjalan`, time: "1 jam lalu", status: "success" },
      ])

    } catch (error) {
      console.error("Gagal memuat dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const statCards: StatCard[] = [
    {
      title: "Total Santri",
      value: loading ? "—" : stats.totalSantri,
      change: "Aktif",
      trend: "up",
      icon: Users,
      color: "text-sky-600",
      bg: "bg-sky-50 dark:bg-sky-950/40",
    },
    {
      title: "Total Divisi",
      value: loading ? "—" : stats.totalDivisi,
      change: "Tersedia",
      trend: "neutral",
      icon: Layers,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950/40",
    },
    {
      title: "Total Kelas",
      value: loading ? "—" : stats.totalKelas,
      change: "Terjadwal",
      trend: "up",
      icon: GraduationCap,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      title: "Total Pelajaran",
      value: loading ? "—" : stats.totalPelajaran,
      change: "Tugas & Ujian",
      trend: "up",
      icon: BookOpen,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/40",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Selamat datang kembali,{" "}
          <span className="font-medium text-foreground">{userName}</span> — berikut
          ringkasan data hari ini.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            className="group relative overflow-hidden border-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold tracking-tight transition-all duration-500 ${
                  loading ? "animate-pulse text-muted-foreground/40" : ""
                }`}
              >
                {card.value}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                {card.trend === "up" && (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                )}
                <span
                  className={
                    card.trend === "up" ? "text-emerald-600 font-medium" : ""
                  }
                >
                  {card.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-base font-semibold">Aksi Cepat</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <a
                key={action.title}
                href={action.href}
                className="group relative flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:ring-primary/30"
              >
                <div
                  className={`rounded-lg bg-gradient-to-br ${action.color} p-2.5 text-white shadow-sm`}
                >
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-tight">
                    {action.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {action.desc}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-semibold">Aktivitas Terbaru</h2>
          <Card className="border-0 shadow-sm ring-1 ring-border/60">
            <CardContent className="p-4">
              <ul className="space-y-4">
                {recentActivities.map((activity, i) => (
                  <li key={activity.id} className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {statusIcon[activity.status as keyof typeof statusIcon]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{activity.message}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                    {i < recentActivities.length - 1 && (
                      <div className="absolute left-[1.625rem] mt-5 h-full w-px bg-border" />
                    )}
                  </li>
                ))}
                {loading && (
                  <li className="flex items-center justify-center p-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
