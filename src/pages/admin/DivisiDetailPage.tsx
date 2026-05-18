import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft, Layers, School, Users, UserCircle,
  Loader2, AlertCircle, ChevronRight, Plus, X, Loader
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DivisiAPI, ClassAPI } from "@/services/api"

interface KelasItem {
  id: string
  name: string
  mentor: { id: string; fullName: string } | null
  _count: { santriProfiles: number }
}

interface DivisiDetail {
  id: string
  name: string
  description: string | null
  _count: { classes: number }
}

export default function DivisiDetailPage() {
  const { divisiId } = useParams<{ divisiId: string }>()
  const navigate = useNavigate()

  const [divisi, setDivisi] = useState<DivisiDetail | null>(null)
  const [classes, setClasses] = useState<KelasItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // State untuk tambah kelas inline
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [mentors, setMentors] = useState<{ id: string; fullName: string }[]>([])
  const [newKelasName, setNewKelasName] = useState("")
  const [newMentorId, setNewMentorId] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resKelas, resAllDivisi] = await Promise.all([
        ClassAPI.getAll(),
        DivisiAPI.getAll(),
      ])

      const allClasses = Array.isArray(resKelas?.data) ? resKelas.data : (resKelas?.data?.data ?? [])
      const filteredClasses = allClasses.filter((c: any) =>
        c.divisiId === divisiId || c.division?.id === divisiId
      )
      setClasses(filteredClasses)

      const allDivisi = Array.isArray(resAllDivisi?.data) ? resAllDivisi.data : (resAllDivisi?.data?.data ?? [])
      const found = allDivisi.find((d: any) => d.id === divisiId)
      if (found) setDivisi(found)

      setError("")
    } catch (err: any) {
      setError(err.message || "Gagal memuat data divisi")
    } finally {
      setLoading(false)
    }
  }

  const fetchMentors = async () => {
    try {
      const { AuthAPI } = await import("@/services/api")
      const res = await AuthAPI.getMentors()
      const arr = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? [])
      setMentors(arr)
    } catch { /* silent */ }
  }

  useEffect(() => {
    if (divisiId) {
      fetchData()
      fetchMentors()
    }
  }, [divisiId])

  const handleTambahKelas = async () => {
    if (!newKelasName || !newMentorId) {
      toast.error("Nama kelas dan mentor wajib diisi.")
      return
    }
    setSaving(true)
    try {
      await ClassAPI.create({ name: newKelasName, divisiId, mentorId: newMentorId })
      toast.success("Kelas berhasil ditambahkan!")
      setNewKelasName("")
      setNewMentorId("")
      setAddModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan kelas.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={fetchData} className="mt-4 rounded-lg border px-4 py-2 text-sm hover:bg-muted">
          Coba Lagi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Daftar Divisi
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/40">
              <Layers className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{divisi?.name ?? "Divisi"}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {divisi?.description || "Tidak ada deskripsi"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Tambah Kelas
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40">
              <School className="h-4 w-4 text-violet-600" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Kelas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{classes.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/40">
              <Users className="h-4 w-4 text-sky-600" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Santri</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {classes.reduce((acc, c) => acc + (c._count?.santriProfiles ?? 0), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">Daftar Kelas</h2>
        {classes.length === 0 ? (
          <Card className="border-0 shadow-sm ring-1 ring-border/60">
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <School className="h-10 w-10 opacity-20 mb-3" />
              <p className="text-sm font-medium">Belum ada kelas di divisi ini.</p>
              <p className="text-xs mt-1">Klik "Tambah Kelas" untuk membuat kelas pertama.</p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((kelas) => {
              const studentCount = kelas._count?.santriProfiles ?? 0
              const mentorName = kelas.mentor?.fullName ?? "Belum ada mentor"
              return (
                <button
                  key={kelas.id}
                  onClick={() => navigate(`/dashboard/kelas/${kelas.id}`)}
                  className="group relative flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm ring-1 ring-border/50 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:ring-primary/30"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40">
                      <School className="h-5 w-5 text-violet-600" />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div>
                    <p className="font-semibold text-base leading-tight">{kelas.name}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <UserCircle className="h-3.5 w-3.5" />
                      <span>{mentorName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{studentCount} Santri</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setAddModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Tambah Kelas ke {divisi?.name}</h2>
              <button onClick={() => setAddModalOpen(false)} className="rounded-md p-1.5 hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Nama Kelas <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kelas A"
                  value={newKelasName}
                  onChange={e => setNewKelasName(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Mentor <span className="text-red-500">*</span>
                </label>
                <select
                  value={newMentorId}
                  onChange={e => setNewMentorId(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">-- Pilih Mentor --</option>
                  {mentors.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setAddModalOpen(false)}
                disabled={saving}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-muted"
              >
                Batal
              </button>
              <button
                onClick={handleTambahKelas}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {saving && <Loader className="h-4 w-4 animate-spin" />}
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
