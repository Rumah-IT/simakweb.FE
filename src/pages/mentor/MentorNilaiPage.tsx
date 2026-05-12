import { useState, useEffect } from "react"
import { BarChart3, Search, Loader2, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ClassAPI, ScoreAPI } from "@/services/api"

function loadUser() {
  try { return JSON.parse(localStorage.getItem("user") ?? "{}") } catch { return {} }
}

export default function MentorNilaiPage() {
  const user = loadUser()
  const mentorId: string = user.id ?? ""

  const [scores, setScores] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const [resKelas, resNilai] = await Promise.all([
          ClassAPI.getAll(),
          ScoreAPI.getAll(),
        ])
        const kelasArr = Array.isArray(resKelas?.data) ? resKelas.data : (resKelas?.data?.data ?? [])
        const myKelas = kelasArr.filter((c: any) => c.mentorId === mentorId || c.mentor?.id === mentorId)
        const myIds = myKelas.map((k: any) => k.id)

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
    fetchAll()
  }, [mentorId])

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Nilai Santri</h1>
        </div>
        <p className="text-sm text-muted-foreground">Rekap penilaian bulanan santri di kelas yang Anda ampu.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari nama santri..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
        />
      </div>

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
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kelas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Bulan</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nilai</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <BarChart3 className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    Belum ada data nilai dari santri bimbingan Anda.
                  </td>
                </tr>
              ) : filtered.map((n: any, idx: number) => {
                const name = n.santri?.user?.fullName ?? n.santriName ?? "-"
                const kelasName = n.class?.name ?? "-"
                const month = n.month ?? (n.date ? new Date(n.date).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : "-")
                const score = Number(n.score ?? n.nilai ?? 0)
                const note = n.note ?? n.catatan ?? "-"
                return (
                  <tr key={n.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{kelasName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{month}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${getScoreColor(score)}`}>
                        {score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{note}</td>
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
