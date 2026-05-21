import { useState, useEffect } from "react"
import { Users, Search, GraduationCap, Loader2, AlertCircle, UserCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ClassAPI, SantriAPI } from "@/services/api"

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

export default function MentorSantriPage() {
  const user = loadUser()
  const mentorId: string = user.id ?? ""

  const [myClasses, setMyClasses] = useState<any[]>([])
  const [santriList, setSantriList] = useState<any[]>([])
  const [selectedKelasId, setSelectedKelasId] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const kelasId = params.get("kelasId")
    if (kelasId) setSelectedKelasId(kelasId)
  }, [])

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const [resKelas, resSantri] = await Promise.all([
          ClassAPI.getAll().catch(() => null),
          SantriAPI.getAll().catch(() => null),
        ])
        const kelasArr = Array.isArray(resKelas?.data) ? resKelas.data : (resKelas?.data?.data ?? [])
        const myKelas = kelasArr.filter((c: any) => isMentorClass(c, mentorId))
        setMyClasses(myKelas)

        const santriArr = Array.isArray(resSantri?.data) ? resSantri.data : (resSantri?.data?.data ?? [])
        setSantriList(santriArr)
        setError("")
      } catch (err: any) {
        setError(err.message || "Gagal memuat data")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [mentorId])

  const myKelasIds = myClasses.map((k: any) => k.id)
  const filtered = santriList.filter((s: any) => {
    const inMyClass = myKelasIds.includes(s.classId) || myKelasIds.includes(s.class?.id)
    if (!inMyClass) return false
    if (selectedKelasId !== "all" && s.classId !== selectedKelasId && s.class?.id !== selectedKelasId) return false
    const name = s.fullName ?? s.user?.fullName ?? ""
    const nis = s.nis ?? s.user?.nis ?? ""
    return name.toLowerCase().includes(search.toLowerCase()) || nis.includes(search)
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Santri Bimbingan</h1>
        </div>
        <p className="text-sm text-muted-foreground">Daftar santri di kelas yang Anda ampu.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={selectedKelasId}
          onChange={e => setSelectedKelasId(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Semua Kelas</option>
          {myClasses.map((k: any) => (
            <option key={k.id} value={k.id}>{k.name}</option>
          ))}
        </select>
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
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NIS</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kelas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Divisi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    Tidak ada santri ditemukan.
                  </td>
                </tr>
              ) : filtered.map((s: any, idx: number) => {
                const name = s.fullName ?? s.user?.fullName ?? "-"
                const nis = s.nis ?? s.user?.nis ?? "-"
                const kelasName = s.class?.name ?? myClasses.find(k => k.id === s.classId)?.name ?? "-"
                const divisiName = s.class?.division?.name ?? "-"
                const initials = name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()
                return (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {s.photoUrl ? (
                            <img src={s.photoUrl} alt={name} className="h-8 w-8 rounded-full object-cover" />
                          ) : initials || <UserCircle className="h-5 w-5" />}
                        </div>
                        <span className="font-medium">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{nis}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        <GraduationCap className="h-3 w-3" />{kelasName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{divisiName}</td>
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
