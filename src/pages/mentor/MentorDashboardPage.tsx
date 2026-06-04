import { useState, useEffect } from "react"
import { Users, BookOpenCheck, BarChart3, Activity, GraduationCap, CalendarCheck, Clock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"
import { ClassAPI, SantriAPI, DailyJournalAPI, ScoreAPI, SubmissionAPI } from "@/services/api"

function loadUser() {
  try { return JSON.parse(localStorage.getItem("user") ?? "{}") } catch { return {} }
}




export default function MentorDashboardPage() {
  const user = loadUser()
  const mentorId: string = user.id ?? ""
  const displayName: string = user.name ?? user.fullName ?? "Mentor"

  const [stats, setStats] = useState({
    totalSantri: 0,
    totalKelas: 0,
    pendingSubmissions: 0,
    lastMonthScore: "-",
    jurnalCount: 0,
  })
  const [myClasses, setMyClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const [resKelas, resSantri, resJurnal, resNilai, resSub] = await Promise.all([
          ClassAPI.getAll().catch(() => null),
          SantriAPI.getAll().catch(() => null),
          DailyJournalAPI.getAll().catch(() => null),
          ScoreAPI.getAll().catch(() => null),
          SubmissionAPI.getAll().catch(() => null),
        ])

        const kelasArr = Array.isArray(resKelas?.data) ? resKelas.data : (resKelas?.data?.data ?? [])
        const myKelas = kelasArr.filter((c: any) => c.mentorId === mentorId)
        setMyClasses(myKelas)
        const myIds = myKelas.map((k: any) => k.id)

        const santriArr = Array.isArray(resSantri?.data) ? resSantri.data : (resSantri?.data?.data ?? [])
        const mySantri = santriArr.filter((s: any) => myIds.includes(s.classId) || myIds.includes(s.class?.id))

        const jArr = Array.isArray(resJurnal?.data) ? resJurnal.data : (resJurnal?.data?.data ?? [])
        const myJurnal = jArr.filter((j: any) => myIds.includes(j.classId) || myIds.includes(j.class?.id))

        const nilaiArr = Array.isArray(resNilai?.data) ? resNilai.data : (resNilai?.data?.data ?? [])
        const myNilai = nilaiArr.filter((n: any) => myIds.includes(n.classId) || myIds.includes(n.class?.id))
        const latestNilai = myNilai.sort((a: any, b: any) => (b.year * 12 + b.month) - (a.year * 12 + a.month))[0]
        const avgScore = latestNilai
          ? Math.round((latestNilai.taskAvg + latestNilai.attitudeAvg) / 2)
          : "-"

        const subArr = Array.isArray(resSub?.data) ? resSub.data : (resSub?.data?.data ?? [])
        const pendingSub = subArr.filter((s: any) => {
          const classId = s.assignment?.classId ?? s.classId
          return myIds.includes(classId) && (s.status === "PENDING" || s.score == null)
        })

        setStats({
          totalSantri: mySantri.length,
          totalKelas: myKelas.length,
          pendingSubmissions: pendingSub.length,
          lastMonthScore: String(avgScore),
          jurnalCount: myJurnal.length,
        })
      } catch (err) {
        console.error("Dashboard fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [mentorId])

  const statCards = [
    { title: "Total Santri Bimbingan", value: loading ? "..." : stats.totalSantri, sub: "Santri di kelas Anda", icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40", href: "/mentor/santri" },
    { title: "Kelas Diampu", value: loading ? "..." : stats.totalKelas, sub: "Kelas aktif", icon: GraduationCap, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40", href: "/mentor/kelas" },
    { title: "Submisi Menunggu", value: loading ? "..." : stats.pendingSubmissions, sub: "Perlu dinilai", icon: BookOpenCheck, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40", href: "/mentor/submisi" },
    { title: "Jurnal Masuk", value: loading ? "..." : stats.jurnalCount, sub: "Total jurnal santri", icon: Clock, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/40", href: "/mentor/jurnal" },
    { title: "Rata-rata Nilai Terakhir", value: loading ? "..." : stats.lastMonthScore, sub: "Bulan terakhir", icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40", href: "/mentor/nilai" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Mentor</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Selamat datang, <span className="font-semibold text-foreground">{displayName}</span> — ini ringkasan bimbingan Anda.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map(card => (
          <Link key={card.title} to={card.href} className="group">
            <Card className="border-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground leading-tight">{card.title}</CardTitle>
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl md:text-3xl font-bold tracking-tight">{card.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">Kelas Saya</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : myClasses.length === 0 ? (
          <Card className="border-0 shadow-sm ring-1 ring-border/60 p-8 text-center text-muted-foreground">
            <GraduationCap className="mx-auto mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm">Anda belum ditugaskan ke kelas manapun. Hubungi Admin.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {myClasses.map((kelas: any) => (
              <Link
                key={kelas.id}
                to={`/mentor/santri?kelasId=${kelas.id}`}
                className="group relative flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm ring-1 ring-border/50 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:ring-primary/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div>
                  <p className="font-semibold text-base leading-tight">{kelas.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Divisi: {kelas.division?.name ?? "-"}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{kelas._count?.santriProfiles ?? 0} Santri</span>
                  <span className="flex items-center gap-1"><BookOpenCheck className="h-3.5 w-3.5" />{kelas._count?.assignments ?? 0} Tugas</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">Akses Cepat</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Input Absensi", desc: "Catat kehadiran santri", href: "/mentor/absensi", icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
            { label: "Buat Tugas", desc: "Beri tugas ke santri", href: "/mentor/tugas", icon: BookOpenCheck, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
            { label: "Nilai Submisi", desc: "Review tugas santri", href: "/mentor/submisi", icon: Activity, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
            { label: "Nilai Bulanan", desc: "Input evaluasi bulanan", href: "/mentor/nilai", icon: BarChart3, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/40" },
          ].map(item => (
            <Link key={item.href} to={item.href} className="group flex items-center gap-3 rounded-xl border bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:-translate-y-0.5 hover:ring-primary/30">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.bg}`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
