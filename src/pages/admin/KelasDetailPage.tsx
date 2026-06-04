import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  ArrowLeft, GraduationCap, Users, UserPlus,
  Search, Loader2, AlertCircle, UserMinus,
  Mail, Layers, UserCircle, X
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClassAPI, SantriAPI } from "@/services/api"

interface SantriInClass {
  id: string
  userId: string
  photoUrl: string | null
  user: { fullName: string; nis: string }
}

interface KelasDetail {
  id: string
  name: string
  division: { id: string; name: string }
  mentor: { id: string; fullName: string; email: string }
  santriProfiles: SantriInClass[]
  _count?: { santriProfiles: number }
}

interface AllSantri {
  id: string
  userId: string
  classId: string | null
  fullName?: string
  user?: { fullName: string; nis: string }
  santriProfile?: { id: string; classId: string | null }
}

export default function KelasDetailPage() {
  const { kelasId } = useParams<{ kelasId: string }>()
  const navigate = useNavigate()

  const [kelas, setKelas] = useState<KelasDetail | null>(null)
  const [allSantri, setAllSantri] = useState<AllSantri[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [searchModal, setSearchModal] = useState("")
  const [assigning, setAssigning] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchDetail = async () => {
    try {
      setLoading(true)
      const [resKelas, resSantri] = await Promise.all([
        ClassAPI.getById(kelasId!),
        SantriAPI.getAll(),
      ])

      const kelasData = resKelas?.data ?? resKelas
      setKelas(kelasData)

      const santriArr = Array.isArray(resSantri?.data)
        ? resSantri.data
        : (resSantri?.data?.data ?? [])
      setAllSantri(santriArr)
      setError("")
    } catch (err: any) {
      setError(err.message || "Gagal memuat detail kelas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (kelasId) fetchDetail()
  }, [kelasId])

  const santriInClassIds = new Set(kelas?.santriProfiles.map(s => s.userId) ?? [])
  const availableSantri = allSantri.filter(s => {
    const uid = s.userId ?? s.id
    return !santriInClassIds.has(uid)
  })

  const filteredAvailable = availableSantri.filter(s => {
    const name = s.user?.fullName ?? s.fullName ?? ""
    const nis = s.user?.nis ?? ""
    return (
      name.toLowerCase().includes(searchModal.toLowerCase()) ||
      nis.includes(searchModal)
    )
  })

  const handleAssign = async (santri: AllSantri) => {
    const profileId = santri.id
    setAssigning(profileId)
    try {
      await ClassAPI.assignSantri(kelasId!, profileId)
      toast.success(`${santri.user?.fullName ?? "Santri"} berhasil ditambahkan ke kelas.`)
      setModalOpen(false)
      setSearchModal("")
      fetchDetail()
    } catch (err: any) {
      toast.error(err.message || "Gagal menambahkan santri ke kelas.")
    } finally {
      setAssigning(null)
    }
  }

  const handleRemove = async (profileId: string, name: string) => {
    setRemoving(profileId)
    try {
      await ClassAPI.removeSantri(profileId)
      toast.success(`${name} berhasil dikeluarkan dari kelas.`)
      setDeleteConfirm(null)
      fetchDetail()
    } catch (err: any) {
      toast.error(err.message || "Gagal mengeluarkan santri dari kelas.")
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !kelas) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-sm text-muted-foreground">{error || "Kelas tidak ditemukan"}</p>
        <button onClick={() => navigate(-1)} className="mt-4 rounded-lg border px-4 py-2 text-sm hover:bg-muted">
          Kembali
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
          Kembali ke Daftar Kelas
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{kelas.name}</h1>
              <p className="text-sm text-muted-foreground">Detail kelas dan daftar santri</p>
            </div>
          </div>
          <button
            id="btn-tambah-santri-kelas"
            onClick={() => { setModalOpen(true); setSearchModal("") }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Santri
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40">
              <Layers className="h-4 w-4 text-violet-600" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Divisi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{kelas.division?.name ?? "-"}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border/60 sm:col-span-1">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/40">
              <UserCircle className="h-4 w-4 text-sky-600" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Mentor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{kelas.mentor?.fullName ?? "-"}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Mail className="h-3 w-3" />
              {kelas.mentor?.email ?? "-"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
              <Users className="h-4 w-4 text-emerald-600" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Santri</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{kelas.santriProfiles?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">Daftar Santri di Kelas Ini</h2>
        <Card className="border-0 shadow-sm ring-1 ring-border/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Santri</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">NIS</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {kelas.santriProfiles?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                      <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                      Belum ada santri di kelas ini. Klik "Tambah Santri" untuk menambahkan.
                    </td>
                  </tr>
                ) : kelas.santriProfiles?.map((s, idx) => {
                  const name = s.user?.fullName ?? "-"
                  const nis = s.user?.nis ?? "-"
                  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
                  return (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary overflow-hidden">
                            {s.photoUrl
                              ? <img src={s.photoUrl} alt={name} className="h-full w-full object-cover" />
                              : initials || <UserCircle className="h-5 w-5" />
                            }
                          </div>
                          <span className="font-medium">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{nis}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteConfirm(s.id)}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          Keluarkan
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 pb-4 border-b">
              <div>
                <h2 className="text-lg font-bold">Tambah Santri ke Kelas</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Pilih santri yang akan ditambahkan ke <span className="font-medium">{kelas.name}</span></p>
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 transition hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Cari nama atau NIS santri..."
                  value={searchModal}
                  onChange={e => setSearchModal(e.target.value)}
                  className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-2">
              {filteredAvailable.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                  <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  {searchModal ? "Tidak ada santri yang cocok." : "Semua santri sudah masuk kelas."}
                </div>
              ) : filteredAvailable.map(s => {
                const name = s.user?.fullName ?? s.fullName ?? "-"
                const nis = s.user?.nis ?? "-"
                const profileId = s.id
                const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
                const isLoading = assigning === profileId
                return (
                  <button
                    key={profileId}
                    onClick={() => handleAssign(s)}
                    disabled={!!assigning}
                    className="w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-muted/60 disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {initials || <UserCircle className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{nis}</p>
                      </div>
                    </div>
                    {isLoading
                      ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      : <UserPlus className="h-4 w-4 text-muted-foreground" />
                    }
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {deleteConfirm !== null && (() => {
        const target = kelas.santriProfiles.find(s => s.id === deleteConfirm)
        const name = target?.user?.fullName ?? "santri ini"
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
            <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border/60" onClick={e => e.stopPropagation()}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
                  <UserMinus className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Keluarkan Santri</h3>
                  <p className="text-xs text-muted-foreground">Santri akan dikeluarkan dari kelas ini.</p>
                </div>
              </div>
              <p className="mb-5 text-sm text-muted-foreground">
                Apakah Anda yakin ingin mengeluarkan <span className="font-semibold text-foreground">{name}</span> dari kelas <span className="font-semibold text-foreground">{kelas.name}</span>?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleRemove(deleteConfirm, name)}
                  disabled={!!removing}
                  className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Ya, Keluarkan
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
