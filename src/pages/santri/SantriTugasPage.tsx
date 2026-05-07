import { useState, useEffect } from "react"
import { toast } from "sonner"
import { FileText, Search, Calendar, BookOpen, Loader2, AlertCircle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/services/api"

interface Tugas {
  id: string
  title: string
  description: string
  dueDate: string
  className: string
  mentorName: string
}

export default function SantriTugasPage() {
  const [data, setData] = useState<Tugas[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  const fetchData = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await api.AssignmentAPI.getAll()
      const all = Array.isArray(res.data) ? res.data : (res.data?.data || [])

      const mapped: Tugas[] = all.map((t: any) => ({
        id: t.id,
        title: t.title ?? t.name ?? "Tugas",
        description: t.description ?? "-",
        dueDate: t.dueDate ?? "",
        className: t.class?.name ?? t.classId ?? "-",
        mentorName: t.mentor?.fullName ?? t.createdBy?.fullName ?? "-",
      }))

      mapped.sort((a, b) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })

      setData(mapped)
    } catch (err: any) {
      const msg = err?.message || "Gagal mengambil data tugas"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const now = new Date()
  const filtered = data.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.className.toLowerCase().includes(search.toLowerCase())
  )
  const upcoming = filtered.filter(t => !t.dueDate || new Date(t.dueDate) >= now)
  const past = filtered.filter(t => t.dueDate && new Date(t.dueDate) < now)

  const isDueSoon = (dueDate: string) => {
    const diff = new Date(dueDate).getTime() - now.getTime()
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000 
  }

  const TugasCard = ({ t }: { t: Tugas }) => {
    const overdue = t.dueDate && new Date(t.dueDate) < now
    const soon = t.dueDate && isDueSoon(t.dueDate)

    return (
      <div className="flex items-start gap-4 rounded-xl border bg-card p-4 shadow-sm ring-1 ring-border/50 transition-all hover:shadow-md hover:-translate-y-0.5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${overdue ? "bg-red-100 dark:bg-red-900/30" : soon ? "bg-amber-100 dark:bg-amber-900/30" : "bg-violet-100 dark:bg-violet-900/30"}`}>
          <FileText className={`h-5 w-5 ${overdue ? "text-red-600" : soon ? "text-amber-600" : "text-violet-600"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-sm leading-tight">{t.title}</p>
            {overdue && <span className="rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 px-2 py-0.5 text-xs font-medium">Lewat Deadline</span>}
            {soon && !overdue && <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 text-xs font-medium">Segera</span>}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{t.description}</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{t.className}</span>
            {t.dueDate && (
              <span className={`flex items-center gap-1 ${overdue ? "text-red-600" : soon ? "text-amber-600" : ""}`}>
                <Clock className="h-3.5 w-3.5" />
                Deadline: {new Date(t.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Tugas</h1>
        </div>
        <p className="text-sm text-muted-foreground">Daftar tugas yang tersedia di kelasmu.</p>
      </div>

<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Total Tugas", value: data.length, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40", icon: FileText },
          { label: "Segera Deadline", value: data.filter(t => t.dueDate && isDueSoon(t.dueDate)).length, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40", icon: Clock },
          { label: "Lewat Deadline", value: data.filter(t => t.dueDate && new Date(t.dueDate) < now).length, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/40", icon: AlertCircle },
        ].map(card => (
          <Card key={card.label} className="border-0 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md hover:-translate-y-0.5">
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

<div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari judul tugas atau kelas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
        />
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
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <FileText className="h-8 w-8 opacity-30 mb-2" />
          <p className="text-sm">{data.length === 0 ? "Belum ada tugas tersedia." : "Tidak ada tugas yang cocok."}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />Tugas Aktif ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map(t => <TugasCard key={t.id} t={t} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />Tugas Lalu ({past.length})
              </h2>
              <div className="space-y-3 opacity-70">
                {past.map(t => <TugasCard key={t.id} t={t} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
