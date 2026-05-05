import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, User, UserCog, Phone, Mail, MapPin,
  Briefcase, Heart, GraduationCap, School,
  CalendarCheck, BookOpenCheck, BarChart3,
  CheckCircle2, Clock, AlertCircle, Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/services/api"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusConfig: Record<string, any> = {
  aktif: { label: "Aktif", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
  nonaktif: { label: "Non-Aktif", className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
  lulus: { label: "Lulus", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
}

const hubunganConfig: Record<string, any> = {
  FATHER: { label: "Ayah", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  MOTHER: { label: "Ibu", className: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
  GUARDIAN: { label: "Wali", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  OTHER: { label: "Lainnya", className: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300" },
}

const activityIcon: Record<string, any> = {
  absensi: <CalendarCheck className="h-4 w-4 text-sky-500" />,
  jurnal: <BookOpenCheck className="h-4 w-4 text-emerald-500" />,
  nilai: <BarChart3 className="h-4 w-4 text-violet-500" />,
}

const activityBg: Record<string, any> = {
  absensi: "bg-sky-50 dark:bg-sky-950/30",
  jurnal: "bg-emerald-50 dark:bg-emerald-950/30",
  nilai: "bg-violet-50 dark:bg-violet-950/30",
}

// ─── Avatar component ─────────────────────────────────────────────────────────

const colorPairs = [
  ["bg-violet-100 dark:bg-violet-900/50", "text-violet-700 dark:text-violet-300"],
  ["bg-sky-100 dark:bg-sky-900/50", "text-sky-700 dark:text-sky-300"],
  ["bg-emerald-100 dark:bg-emerald-900/50", "text-emerald-700 dark:text-emerald-300"],
  ["bg-amber-100 dark:bg-amber-900/50", "text-amber-700 dark:text-amber-300"],
  ["bg-pink-100 dark:bg-pink-900/50", "text-pink-700 dark:text-pink-300"],
]
const getColor = (initials: string) => colorPairs[initials.charCodeAt(0) % colorPairs.length] || colorPairs[0]

function Avatar({ initials, size = "lg" }: { initials: string; size?: "md" | "lg" | "xl" }) {
  const cleanInitials = initials ? initials.substring(0, 2).toUpperCase() : "U"
  const [bg, text] = getColor(cleanInitials)
  const sizeClass = size === "xl" ? "h-20 w-20 text-2xl" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm"
  return (
    <div className={`${sizeClass} ${bg} ${text} flex items-center justify-center rounded-full font-bold tracking-wide`}>
      {cleanInitials}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex-shrink-0 text-muted-foreground">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  )
}

export default function WaliProfilePage() {
  const { santriId } = useParams<{ santriId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [santri, setSantri] = useState<any>(null)
  const [wali, setWali] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!santriId) return
      try {
        setLoading(true)
        const resSantri = await api.SantriAPI.getById(santriId)
        
        // Backend returns { success, message, data: UserObject }
        // getAll returns User objects, getById returns the same
        const raw = resSantri?.data ?? resSantri
        const s = raw?.data ?? raw // handle nested or flat

        if (s && s.id) {
          setSantri({
            id: s.id,
            nama: s.fullName ?? "-",
            nis: s.santriProfile?.nis ?? "-",
            kelas: s.santriProfile?.class?.name ?? s.santriProfile?.classId ?? "-",
            divisi: s.santriProfile?.division?.name ?? "-",
            telepon: s.phone ?? s.santriProfile?.phone ?? "-",
            alamat: s.santriProfile?.address ?? "-",
            status: s.isActive ? "aktif" : "nonaktif",
            avatar: s.fullName ?? "S"
          })

          // Find wali relation — santriId in relation uses the User's ID
          try {
            const resRelasi = await api.RelasiAPI.getAll()
            const rArray = Array.isArray(resRelasi.data) ? resRelasi.data : (resRelasi.data?.data || [])
            const relation = rArray.find((r: any) => r.santriId === santriId)

            if (relation && relation.wali) {
              setWali({
                nama: relation.wali.fullName ?? "-",
                email: relation.wali.email ?? "-",
                telepon: relation.wali.phone ?? "-",
                pekerjaan: "-",
                alamat: "-",
                hubungan: relation.category ?? "OTHER",
                avatar: relation.wali.fullName ?? "W"
              })
            } else {
              setWali({
                nama: "Belum ditambahkan",
                email: "-",
                telepon: "-",
                pekerjaan: "-",
                alamat: "-",
                hubungan: "OTHER",
                avatar: "W"
              })
            }
          } catch {
            setWali({ nama: "Belum ditambahkan", email: "-", telepon: "-", pekerjaan: "-", alamat: "-", hubungan: "OTHER", avatar: "W" })
          }

          setActivities([
            { type: "absensi", label: "Hadir", date: new Date().toLocaleDateString(), detail: "Absensi harian" }
          ])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [santriId])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-lg font-semibold">Memuat Profil...</p>
      </div>
    )
  }

  if (!santri) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <User className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
        <p className="text-lg font-semibold">Santri tidak ditemukan</p>
        <p className="text-sm text-muted-foreground">Data santri dengan ID ini tidak tersedia.</p>
        <button
          onClick={() => navigate("/dashboard/santri")}
          className="mt-2 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar Santri
        </button>
      </div>
    )
  }

  const statusCfg = statusConfig[santri.status] || statusConfig.aktif
  const hubunganCfg = hubunganConfig[wali?.hubungan] || hubunganConfig.OTHER

  return (
    <div className="space-y-6">
      <button
        id="btn-back-wali-profile"
        onClick={() => navigate("/dashboard/santri")}
        className="flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Daftar Santri
      </button>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent ring-1 ring-border/60 p-6">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar initials={santri.avatar} size="xl" />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{santri.nama}</h1>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground font-mono">NIS: {santri.nis}</p>

            <div className="mt-3 flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <School className="h-4 w-4" />
                <span>{santri.kelas}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>{santri.divisi}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{santri.telepon}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-0 shadow-sm ring-1 ring-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCog className="h-4 w-4 text-primary" />
                Profil Wali
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b">
                <Avatar initials={wali?.avatar || "W"} size="lg" />
                <div>
                  <p className="font-semibold">{wali?.nama}</p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${hubunganCfg.className}`}>
                    {hubunganCfg.label}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Nomor Telepon" value={wali?.telepon} />
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={wali?.email} />
                <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Pekerjaan" value={wali?.pekerjaan} />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Alamat" value={wali?.alamat} />
                <InfoRow icon={<Heart className="h-4 w-4" />} label="Hubungan dengan Santri" value={hubunganCfg.label} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hubungi Wali</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <a href={`tel:${wali?.telepon}`} className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition hover:bg-muted">
                <Phone className="h-4 w-4 text-emerald-500" />
                {wali?.telepon || "-"}
              </a>
              <a href={`mailto:${wali?.email}`} className="flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition hover:bg-muted">
                <Mail className="h-4 w-4 text-sky-500" />
                {wali?.email || "-"}
              </a>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm ring-1 ring-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" />
                Informasi Santri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">NIS</p>
                  <p className="font-mono font-semibold text-sm">{santri.nis}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Kelas</p>
                  <p className="font-semibold text-sm">{santri.kelas}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Divisi</p>
                  <p className="font-semibold text-sm">{santri.divisi}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <span className={`inline-flex text-xs font-medium rounded-full px-2 py-0.5 ${statusCfg.className}`}>
                    {statusCfg.label}
                  </span>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Telepon</p>
                  <p className="font-semibold text-sm">{santri.telepon}</p>
                </div>
                <div className="col-span-2 sm:col-span-1 rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Alamat</p>
                  <p className="text-sm leading-snug">{santri.alamat}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm ring-1 ring-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" />
                Aktivitas Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-6">Belum ada aktivitas tercatat.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((act, i) => (
                    <div key={i} className={`flex items-start gap-3 rounded-xl p-3 ${activityBg[act.type]}`}>
                      <div className="mt-0.5 flex-shrink-0">{activityIcon[act.type]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{act.label}</p>
                          <span className="text-xs text-muted-foreground flex-shrink-0">{act.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{act.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Kehadiran Bulan Ini", value: "-", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
              { label: "Tugas Dikumpulkan", value: "-", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
              { label: "Nilai Rata-rata", value: "-", icon: BarChart3, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
            ].map(s => (
              <Card key={s.label} className="border-0 shadow-sm ring-1 ring-border/60 transition-all hover:shadow-md hover:-translate-y-0.5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle>
                  <div className={`rounded-lg p-1.5 ${s.bg}`}><s.icon className={`h-3.5 w-3.5 ${s.color}`} /></div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{s.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
