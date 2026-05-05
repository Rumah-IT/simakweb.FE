import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Inbox, Search, Filter, MoreHorizontal,
  Eye, Star, X, CheckCircle2, Clock,
  AlertCircle, FileText, Calendar, User,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/services/api"

interface Submission {
  id: string
  santriName: string
  nis: string
  assignmentTitle: string
  submittedAt: string
  status: "PENDING" | "GRADED"
  score: number | null
  mentorFeedback: string
  contentType: string
  fileUrl: string[]
}

const statusConfig = {
  GRADED: { label: "Dinilai", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: <CheckCircle2 className="h-3 w-3" /> },
  PENDING: { label: "Belum Dinilai", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: <Clock className="h-3 w-3" /> },
}

export default function SubmissionPage() {
  const [data, setData] = useState<Submission[]>([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("semua")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [detailModal, setDetailModal] = useState<Submission | null>(null)
  const [nilaiModal, setNilaiModal] = useState<Submission | null>(null)
  const [nilaiForm, setNilaiForm] = useState({ score: 0, mentorFeedback: "", status: "GRADED" })

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.SubmissionAPI.getAll()
      const sArray = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      
      const mapped = sArray.map((s: any) => ({
        id: s.id,
        santriName: s.santri?.fullName || "-",
        nis: s.santri?.nis || "-",
        assignmentTitle: s.assignment?.title || "-",
        submittedAt: s.submittedAt || s.createdAt || new Date().toISOString(),
        status: s.status || "PENDING",
        score: s.score,
        mentorFeedback: s.mentorFeedback || "",
        contentType: s.contentType || "TEXT",
        fileUrl: Array.isArray(s.fileUrl) ? s.fileUrl : (typeof s.fileUrl === 'string' ? JSON.parse(s.fileUrl) : [])
      }))
      setData(mapped)
      setError("")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Gagal memuat submisi")
      toast.error("Gagal memuat submisi tugas")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const statCards = [
    { label: "Total Submisi", value: data.length, icon: Inbox, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
    { label: "Dinilai", value: data.filter(d => d.status === "GRADED").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Belum Dinilai", value: data.filter(d => d.status === "PENDING").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
  ]

  const filtered = data.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = s.santriName.toLowerCase().includes(q) || s.assignmentTitle.toLowerCase().includes(q)
    const matchStatus = filterStatus === "semua" || s.status === filterStatus
    return matchSearch && matchStatus
  })

  const openNilai = (s: Submission) => { 
    setNilaiModal(s); 
    setNilaiForm({ score: s.score ?? 0, mentorFeedback: s.mentorFeedback, status: "GRADED" }); 
    setMenuOpen(null) 
  }

  const handleSaveNilai = async () => {
    if (!nilaiModal) return
    if (nilaiForm.score < 0 || nilaiForm.score > 100) { toast.error("Nilai harus antara 0 – 100."); return }
    
    setSaving(true)
    try {
      await api.SubmissionAPI.gradeSubmission(nilaiModal.id, {
        score: nilaiForm.score,
        mentorFeedback: nilaiForm.mentorFeedback,
        status: "GRADED"
      })
      toast.success("Nilai berhasil disimpan.")
      setNilaiModal(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan nilai.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Submisi Tugas</h1>
        </div>
        <p className="text-sm text-muted-foreground">Lihat dan beri nilai tugas yang telah dikumpulkan santri.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(card => (
          <Card key={card.label} className="border-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}><card.icon className={`h-4 w-4 ${card.color}`} /></div>
            </CardHeader>
            <CardContent><div className="text-3xl font-bold tracking-tight">{loading ? "..." : card.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input id="search-submission" type="text" placeholder="Cari santri atau judul tugas..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="relative flex items-center gap-1 rounded-lg border bg-background px-3 py-2 text-sm">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select id="filter-status-submission" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent text-sm outline-none cursor-pointer">
              <option value="semua">Semua</option>
              <option value="GRADED">Dinilai</option>
              <option value="PENDING">Belum Dinilai</option>
            </select>
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-border/60 overflow-hidden relative min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 text-center px-4">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm font-medium">{error}</p>
            <button onClick={fetchData} className="mt-4 rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Coba Lagi</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Santri</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tugas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Dikumpulkan</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nilai</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground"><Inbox className="mx-auto mb-2 h-8 w-8 opacity-30" />Tidak ada submisi ditemukan.</td></tr>
              ) : filtered.map((s, idx) => {
                const cfg = statusConfig[s.status] || statusConfig.PENDING
                return (
                  <tr key={s.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.santriName}</div>
                      <div className="text-xs font-mono text-muted-foreground">{s.nis}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.assignmentTitle}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" />{new Date(s.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.icon}{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      {s.score !== null
                        ? <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" /><span className="font-bold">{s.score}</span></div>
                        : <span className="text-xs text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button id={`menu-submission-${s.id}`} onClick={() => setMenuOpen(menuOpen === s.id ? null : s.id)} className="rounded-md p-1.5 transition hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
                        {menuOpen === s.id && (
                          <div className="absolute right-0 top-8 z-20 min-w-[150px] rounded-lg border bg-popover shadow-lg">
                            <button onClick={() => { setDetailModal(s); setMenuOpen(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"><Eye className="h-3.5 w-3.5" />Lihat Detail</button>
                            <button onClick={() => openNilai(s)} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"><Star className="h-3.5 w-3.5" />Beri Nilai</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDetailModal(null)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Detail Submisi</h2>
              <button onClick={() => setDetailModal(null)} className="rounded-md p-1.5 transition hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-2">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{detailModal.santriName}</span><span className="font-mono text-xs text-muted-foreground">({detailModal.nis})</span></div>
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{detailModal.assignmentTitle}</div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />Dikumpulkan: {new Date(detailModal.submittedAt).toLocaleString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
              
              <div>
                <strong className="block text-xs text-muted-foreground mb-1">File/Lampiran ({detailModal.contentType}):</strong>
                {detailModal.fileUrl && detailModal.fileUrl.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {detailModal.fileUrl.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate inline-block max-w-full">
                        Lampiran {i + 1}
                      </a>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-xs italic">Tidak ada lampiran.</span>
                )}
              </div>

              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" />Nilai: <strong>{detailModal.score ?? "Belum dinilai"}</strong></div>
              {detailModal.mentorFeedback && (
                <div className="mt-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground"><strong className="text-foreground block mb-1">Feedback Mentor:</strong> {detailModal.mentorFeedback}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nilai Modal */}
      {nilaiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setNilaiModal(null)}>
          <div className="relative w-full max-w-md rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Beri Nilai</h2>
              <button onClick={() => setNilaiModal(null)} className="rounded-md p-1.5 transition hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground"><strong className="text-foreground">{nilaiModal.santriName}</strong> — {nilaiModal.assignmentTitle}</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nilai (0 – 100) <span className="text-red-500">*</span></label>
                <input id="input-nilai-submission" type="number" min={0} max={100} value={nilaiForm.score} onChange={e => setNilaiForm({ ...nilaiForm, score: Number(e.target.value) })} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Feedback Mentor</label>
                <textarea id="input-feedback-submission" rows={3} placeholder="Catatan untuk santri..." value={nilaiForm.mentorFeedback} onChange={e => setNilaiForm({ ...nilaiForm, mentorFeedback: e.target.value })} className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setNilaiModal(null)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Batal</button>
              <button id="btn-simpan-nilai-submission" onClick={handleSaveNilai} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Nilai
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen !== null && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  )
}
