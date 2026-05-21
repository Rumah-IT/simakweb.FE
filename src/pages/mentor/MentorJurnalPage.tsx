import { useState, useEffect } from "react"
import { BookOpenCheck, Search, Loader2, AlertCircle, Calendar } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ClassAPI, DailyJournalAPI } from "@/services/api"

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

export default function MentorJurnalPage() {
  const user = loadUser()
  const mentorId: string = user.id ?? ""

  const [journals, setJournals] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const [resKelas, resJurnal] = await Promise.all([
          ClassAPI.getAll().catch(() => null),
          DailyJournalAPI.getAll().catch(() => null),
        ])
        const kelasArr = Array.isArray(resKelas?.data) ? resKelas.data : (resKelas?.data?.data ?? [])
        const myKelas = kelasArr.filter((c: any) => isMentorClass(c, mentorId))
        const ids = myKelas.map((k: any) => k.id)

        const jArr = Array.isArray(resJurnal?.data) ? resJurnal.data : (resJurnal?.data?.data ?? [])
        const filtered = jArr.filter((j: any) => ids.includes(j.classId) || ids.includes(j.class?.id))
        setJournals(filtered)
        setError("")
      } catch (err: any) {
        setError(err.message || "Gagal memuat data jurnal")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [mentorId])

  const filtered = journals.filter((j: any) => {
    const name = j.santri?.user?.fullName ?? j.santriName ?? ""
    const title = j.title ?? j.activity ?? ""
    return name.toLowerCase().includes(search.toLowerCase()) || title.toLowerCase().includes(search.toLowerCase())
  })

  const formatDate = (d: string) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Jurnal Santri</h1>
        </div>
        <p className="text-sm text-muted-foreground">Jurnal harian santri di kelas yang Anda ampu.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari nama santri atau judul jurnal..."
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
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Judul / Aktivitas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tanggal</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kelas</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <BookOpenCheck className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    Belum ada jurnal dari santri bimbingan Anda.
                  </td>
                </tr>
              ) : filtered.map((j: any, idx: number) => {
                const name = j.santri?.user?.fullName ?? j.santriName ?? "-"
                const title = j.title ?? j.activity ?? "-"
                const date = j.date ?? j.createdAt ?? ""
                const kelasName = j.class?.name ?? "-"
                return (
                  <tr key={j.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{name}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium leading-tight">{title}</p>
                      {j.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{j.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(date)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{kelasName}</td>
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
