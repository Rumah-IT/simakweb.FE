import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Send, Search, Loader2, AlertCircle,
  UserCircle, Star, MessageSquare, X, CheckCircle2, Clock
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { ClassAPI, SubmissionAPI } from "@/services/api"

function loadUser() {
  try { return JSON.parse(localStorage.getItem("user") ?? "{}") } catch { return {} }
}

interface Submission {
  id: string
  santriName: string
  assignmentTitle: string
  className: string
  contentType: string
  fileUrl: string[]
  score?: number
  mentorFeedback?: string
  status: "PENDING" | "GRADED"
  submittedAt: string
}

export default function MentorSubmisiPage() {
  const user = loadUser()
  const mentorId: string = user.id ?? ""

  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "PENDING" | "GRADED">("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [gradeModal, setGradeModal] = useState<Submission | null>(null)
  const [gradeForm, setGradeForm] = useState({ score: "", mentorFeedback: "" })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [resKelas, resSub] = await Promise.all([
        ClassAPI.getAll(),
        SubmissionAPI.getAll(),
      ])
      const kelasArr = Array.isArray(resKelas?.data) ? resKelas.data : (resKelas?.data?.data ?? [])
      const myKelas = kelasArr.filter((c: any) => c.mentorId === mentorId || c.mentor?.id === mentorId)
      const myKelasIds = myKelas.map((k: any) => k.id)

      const subArr = Array.isArray(resSub?.data) ? resSub.data : (resSub?.data?.data ?? [])
      const mySubs: Submission[] = subArr
        .filter((s: any) => {
          const classId = s.assignment?.classId ?? s.classId
          return myKelasIds.includes(classId) || s.assignment?.mentorId === mentorId
        })
        .map((s: any) => ({
          id: s.id,
          santriName: s.santri?.user?.fullName ?? s.santri?.fullName ?? s.santriName ?? "-",
          assignmentTitle: s.assignment?.title ?? "-",
          className: s.assignment?.class?.name ?? "-",
          contentType: s.contentType,
          fileUrl: Array.isArray(s.fileUrl) ? s.fileUrl : (s.fileUrl ? [s.fileUrl] : []),
          score: s.score,
          mentorFeedback: s.mentorFeedback,
          status: s.status ?? (s.score != null ? "GRADED" : "PENDING"),
          submittedAt: s.createdAt ?? s.submittedAt ?? "",
        }))
      setSubmissions(mySubs)
      setError("")
    } catch (err: any) {
      setError(err.message || "Gagal memuat data submisi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [mentorId])

  const openGrade = (sub: Submission) => {
    setGradeModal(sub)
    setGradeForm({
      score: sub.score != null ? String(sub.score) : "",
      mentorFeedback: sub.mentorFeedback ?? "",
    })
  }

  const handleGrade = async () => {
    if (!gradeModal) return
    const scoreNum = Number(gradeForm.score)
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast.error("Nilai harus antara 0 dan 100.")
      return
    }
    setSaving(true)
    try {
      await SubmissionAPI.gradeSubmission(gradeModal.id, {
        score: scoreNum,
        mentorFeedback: gradeForm.mentorFeedback,
        status: "GRADED",
      })
      toast.success("Nilai berhasil disimpan.")
      setGradeModal(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan nilai. (Kemungkinan BE belum izinkan MENTOR)")
    } finally {
      setSaving(false)
    }
  }

  const filtered = submissions.filter(s => {
    const matchSearch =
      s.santriName.toLowerCase().includes(search.toLowerCase()) ||
      s.assignmentTitle.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || s.status === filterStatus
    return matchSearch && matchStatus
  })

  const pendingCount = submissions.filter(s => s.status === "PENDING").length
  const gradedCount = submissions.filter(s => s.status === "GRADED").length

  const formatDate = (d: string) => {
    if (!d) return "-"
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40"
    if (score >= 70) return "text-sky-700 bg-sky-100 dark:bg-sky-950/40"
    if (score >= 55) return "text-amber-700 bg-amber-100 dark:bg-amber-950/40"
    return "text-red-700 bg-red-100 dark:bg-red-950/40"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Penilaian Submisi</h1>
        </div>
        <p className="text-sm text-muted-foreground">Nilai dan berikan feedback atas submisi tugas santri.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 px-3 py-1 text-xs font-semibold">
          <Clock className="h-3 w-3" /> Menunggu: {pendingCount}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold">
          <CheckCircle2 className="h-3 w-3" /> Sudah Dinilai: {gradedCount}
        </span>
        <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          Total: {submissions.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Cari nama santri atau judul tugas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-1">
          {(["all", "PENDING", "GRADED"] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition border ${filterStatus === s ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background hover:bg-muted"}`}
            >
              {s === "all" ? "Semua" : s === "PENDING" ? "Menunggu" : "Sudah Dinilai"}
            </button>
          ))}
        </div>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-border/60 overflow-hidden relative min-h-[300px]">
        {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-sm"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
        {error && !loading && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center"><AlertCircle className="h-8 w-8 text-red-500 mb-2" /><p className="text-sm text-muted-foreground">{error}</p></div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Santri</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Tugas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kelas</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Dikumpulkan</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nilai</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  <Send className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  Belum ada submisi dari santri bimbingan Anda.
                </td></tr>
              ) : filtered.map((s, idx) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {s.santriName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || <UserCircle className="h-4 w-4" />}
                      </div>
                      <span className="font-medium">{s.santriName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="font-medium leading-tight line-clamp-1">{s.assignmentTitle}</p>
                    <p className="text-xs text-muted-foreground">{s.contentType}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{s.className}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(s.submittedAt)}</td>
                  <td className="px-4 py-3">
                    {s.status === "PENDING"
                      ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 px-2.5 py-0.5 text-xs font-medium"><Clock className="h-3 w-3" />Menunggu</span>
                      : <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-medium"><CheckCircle2 className="h-3 w-3" />Dinilai</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {s.score != null
                      ? <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${getScoreColor(s.score)}`}>{s.score}</span>
                      : <span className="text-muted-foreground text-xs">-</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openGrade(s)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition"
                    >
                      <Star className="h-3.5 w-3.5" />
                      {s.status === "GRADED" ? "Edit Nilai" : "Nilai"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {gradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setGradeModal(null)}>
          <div className="relative w-full max-w-md rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Beri Nilai</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{gradeModal.santriName} — {gradeModal.assignmentTitle}</p>
              </div>
              <button onClick={() => setGradeModal(null)} className="rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>

            {gradeModal.fileUrl.length > 0 && (
              <div className="mb-4 rounded-lg border bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">File Submisi:</p>
                {gradeModal.fileUrl.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary hover:underline truncate">{url}</a>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nilai (0–100) <span className="text-red-500">*</span></label>
                <input
                  id="input-nilai-submisi"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="85"
                  value={gradeForm.score}
                  onChange={e => setGradeForm({ ...gradeForm, score: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Feedback / Komentar</label>
                <textarea
                  placeholder="Berikan feedback kepada santri..."
                  value={gradeForm.mentorFeedback}
                  onChange={e => setGradeForm({ ...gradeForm, mentorFeedback: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setGradeModal(null)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted">Batal</button>
              <button
                id="btn-simpan-nilai-submisi"
                onClick={handleGrade}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 transition"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                <MessageSquare className="h-4 w-4" />
                Simpan Nilai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
