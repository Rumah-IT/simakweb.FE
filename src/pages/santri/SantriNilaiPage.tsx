import { useState, useEffect } from "react"
import { toast } from "sonner"
import { BarChart3, Loader2, AlertCircle, Calendar, BookOpen, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/services/api"

function loadUser() {
  try { return JSON.parse(localStorage.getItem("user") ?? "{}") } catch { return {} }
}

const MONTHS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]

export default function SantriNilaiPage() {
  const user = loadUser()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await api.ScoreAPI.getAll()
      const all = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      
      const mine = all.filter((n: any) => n.santriId === user.id)
      mine.sort((a: any, b: any) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })
      setData(mine)
    } catch (err: any) {
      const msg = err?.message || "Gagal mengambil data nilai"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const avgFinal = data.length > 0
    ? (data.reduce((s, n) => s + (n.finalScore ?? 0), 0) / data.length).toFixed(1)
    : "-"

  const getGrade = (score: number) => {
    if (score >= 90) return { label: "A", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30" }
    if (score >= 80) return { label: "B", color: "text-sky-600 bg-sky-50 dark:bg-sky-950/30" }
    if (score >= 70) return { label: "C", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30" }
    return { label: "D", color: "text-red-600 bg-red-50 dark:bg-red-950/30" }
  }

  return (
    <div className="space-y-8">
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Nilai & Evaluasi</h1>
        </div>
        <p className="text-sm text-muted-foreground">Rekap evaluasi bulanan kamu berdasarkan kehadiran, tugas, dan sikap.</p>
      </div>

<div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Evaluasi", value: loading ? "—" : data.length, icon: BarChart3, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
          { label: "Rata-rata Nilai", value: loading ? "—" : avgFinal, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Bulan Terkini", value: loading || !data[0] ? "—" : `${MONTHS[(data[0].month ?? 1) - 1]} ${data[0].year}`, icon: Calendar, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/40" },
        ].map(card => (
          <Card key={card.label} className="border-0 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold tracking-tight ${loading ? "opacity-40 animate-pulse" : ""}`}>{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

{loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button onClick={fetchData} className="mt-4 rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Coba Lagi</button>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 opacity-30 mb-2" />
          <p className="text-sm">Belum ada data evaluasi nilai.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((n: any) => {
            const grade = getGrade(n.finalScore ?? 0)
            return (
              <Card key={n.id} className="border-0 shadow-sm ring-1 ring-border/60 overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary/60 to-primary" />
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{MONTHS[(n.month ?? 1) - 1]} {n.year}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <BookOpen className="h-3 w-3" />
                        {n.class?.name ?? n.classId ?? "Kelas"}
                      </p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold ${grade.color}`}>
                      {grade.label}
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { label: "Nilai Akhir", value: n.finalScore?.toFixed(1) ?? "-", bold: true },
                      { label: "Rata-rata Tugas", value: n.taskAvg?.toFixed(1) ?? "-" },
                      { label: "Poin Kehadiran", value: `${n.attendancePoin ?? "-"} / ${n.maxAttendPoin ?? "-"}` },
                      { label: "Sikap", value: n.attitudeAvg?.toFixed(1) ?? "-" },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className={row.bold ? "font-bold text-sm" : "font-medium"}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  {n.notes && (
                    <p className="text-xs text-muted-foreground border-t pt-3 italic">{n.notes}</p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
