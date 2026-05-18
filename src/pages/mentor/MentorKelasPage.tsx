import { useState, useEffect } from "react"
import { GraduationCap, Users, BookOpenCheck, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"
import { Card } from "@/components/ui/card"
import { ClassAPI } from "@/services/api"

function loadUser() {
  try { return JSON.parse(localStorage.getItem("user") ?? "{}") } catch { return {} }
}

export default function MentorKelasPage() {
  const user = loadUser()
  const mentorId: string = user.id ?? ""

  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        const res = await ClassAPI.getAll()
        const arr = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? [])
        const myClasses = arr.filter((c: any) => c.mentorId === mentorId || c.mentor?.id === mentorId)
        setClasses(myClasses)
        setError("")
      } catch (err: any) {
        setError(err.message || "Gagal memuat data kelas")
      } finally {
        setLoading(false)
      }
    }
    fetchClasses()
  }, [mentorId])

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Kelas Saya</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Daftar kelas yang Anda ampu sebagai mentor.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}

      {!loading && !error && classes.length === 0 && (
        <Card className="border-0 shadow-sm ring-1 ring-border/60 p-12 text-center">
          <GraduationCap className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Anda belum ditugaskan ke kelas manapun.</p>
          <p className="text-xs text-muted-foreground mt-1">Hubungi Admin untuk penugasan kelas.</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((kelas: any) => (
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
              <p className="text-xs text-muted-foreground mt-0.5">
                Divisi: {kelas.division?.name ?? "-"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{kelas._count?.santriProfiles ?? 0} Santri</span>
              <BookOpenCheck className="h-3.5 w-3.5 ml-2" />
              <span>{kelas._count?.assignments ?? 0} Tugas</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
