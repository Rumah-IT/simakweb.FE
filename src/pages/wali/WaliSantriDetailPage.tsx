import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { 
  SantriAPI, 
  AttendanceAPI, 
  ScoreAPI, 
  DailyJournalAPI,
  AssignmentAPI,
  SubmissionAPI
} from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Calendar, BookOpen, GraduationCap, ClipboardList, CheckCircle } from "lucide-react"

export default function WaliSantriDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("profil")
  
  const [santri, setSantri] = useState<any>(null)
  const [attendances, setAttendances] = useState<any[]>([])
  const [scores, setScores] = useState<any[]>([])
  const [journals, setJournals] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      setLoading(true)
      try {
        const [
          santriRes,
          attRes,
          scoreRes,
          journalRes,
          assignRes,
          subRes
        ] = await Promise.all([
          SantriAPI.getById(id),
          AttendanceAPI.getBySantri(id).catch(() => ({ data: [] })),
          ScoreAPI.getAll().catch(() => ({ data: [] })),
          DailyJournalAPI.getAll().catch(() => ({ data: [] })),
          AssignmentAPI.getAll().catch(() => ({ data: [] })),
          SubmissionAPI.getAll().catch(() => ({ data: [] }))
        ])

        setSantri(santriRes.data)
        setAttendances(attRes.data || [])
        
        const santriScores = (scoreRes.data || []).filter((s: any) => s.santri?.id === id)
        setScores(santriScores)

        const santriJournals = (journalRes.data || []).filter((j: any) => j.santri?.id === id)
        setJournals(santriJournals)

        const santriSubs = (subRes.data || []).filter((s: any) => s.santri?.id === id)
        setSubmissions(santriSubs)
        
        const classId = santriRes.data?.classId
        if (classId) {
            const classAssigns = (assignRes.data || []).filter((a: any) => a.classId === classId)
            setAssignments(classAssigns)
        }

      } catch (error) {
        console.error("Gagal memuat data detail:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return <div className="p-8 text-center">Memuat data...</div>
  }

  if (!santri) {
    return (
      <div className="p-8 text-center space-y-4">
        <p>Data santri tidak ditemukan.</p>
        <Button variant="outline" onClick={() => navigate("/wali")}>Kembali ke Dashboard</Button>
      </div>
    )
  }

  const tabs = [
    { id: "profil", label: "Profil", icon: User },
    { id: "kehadiran", label: "Kehadiran", icon: Calendar },
    { id: "jurnal", label: "Jurnal Harian", icon: BookOpen },
    { id: "nilai", label: "Nilai & Evaluasi", icon: GraduationCap },
    { id: "tugas", label: "Tugas", icon: ClipboardList },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/wali")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Detail Santri</h2>
          <p className="text-muted-foreground">Monitoring perkembangan {santri.fullName}</p>
        </div>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeTab === "profil" && (
          <Card>
            <CardHeader>
              <CardTitle>Profil Santri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                  <p className="font-medium">{santri.fullName || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NIS</p>
                  <p className="font-medium">{santri.nis || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kelas</p>
                  <p className="font-medium">{santri.class?.name || "Belum ada kelas"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Divisi</p>
                  <p className="font-medium">{santri.division?.name || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "kehadiran" && (
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Kehadiran</CardTitle>
              <CardDescription>Catatan kehadiran santri di kelas</CardDescription>
            </CardHeader>
            <CardContent>
              {attendances.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Belum ada riwayat kehadiran.</p>
              ) : (
                <div className="space-y-4">
                  {attendances.map((att: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{new Date(att.date).toLocaleDateString("id-ID")}</p>
                        <p className="text-sm text-muted-foreground">Kelas: {att.class?.name || "-"}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        att.status === "PRESENT" ? "bg-green-100 text-green-800" :
                        att.status === "ABSENT" ? "bg-red-100 text-red-800" :
                        att.status === "SICK" ? "bg-yellow-100 text-yellow-800" :
                        att.status === "LATE" ? "bg-orange-100 text-orange-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {att.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "jurnal" && (
          <Card>
            <CardHeader>
              <CardTitle>Jurnal Harian / Mutabaah</CardTitle>
              <CardDescription>Catatan aktivitas harian santri</CardDescription>
            </CardHeader>
            <CardContent>
              {journals.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Belum ada catatan jurnal.</p>
              ) : (
                <div className="space-y-4">
                  {journals.map((journal: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-primary">{journal.title}</p>
                        <span className="text-xs text-muted-foreground">{new Date(journal.date).toLocaleDateString("id-ID")}</span>
                      </div>
                      <p className="text-sm">{journal.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "nilai" && (
          <Card>
            <CardHeader>
              <CardTitle>Nilai & Evaluasi Bulanan</CardTitle>
            </CardHeader>
            <CardContent>
              {scores.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Belum ada evaluasi nilai.</p>
              ) : (
                <div className="space-y-4">
                  {scores.map((score: any, i: number) => (
                    <div key={i} className="p-4 border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold">{score.month} {score.year}</p>
                        <p className="text-sm text-muted-foreground">{score.notes || "Tidak ada catatan"}</p>
                      </div>
                      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary font-bold">
                        {score.averageScore || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "tugas" && (
          <Card>
            <CardHeader>
              <CardTitle>Daftar Tugas</CardTitle>
              <CardDescription>Tugas kelas dan status pengerjaan</CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Tidak ada tugas di kelas ini.</p>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment: any, i: number) => {
                    const submission = submissions.find((s: any) => s.assignment?.id === assignment.id)
                    const isSubmitted = !!submission
                    return (
                      <div key={i} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{assignment.title}</p>
                            <p className="text-sm text-muted-foreground">Tenggat: {new Date(assignment.dueDate).toLocaleDateString("id-ID")}</p>
                          </div>
                          {isSubmitted ? (
                            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-md">
                              <CheckCircle className="h-3 w-3" /> Dikumpulkan
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2 py-1 rounded-md">
                              Belum Dikumpulkan
                            </span>
                          )}
                        </div>
                        <p className="text-sm line-clamp-2">{assignment.description}</p>
                        {isSubmitted && submission.score !== null && (
                          <div className="mt-2 text-sm bg-muted p-2 rounded">
                            <span className="font-medium">Nilai:</span> {submission.score}
                            {submission.mentorFeedback && <p className="mt-1"><span className="font-medium">Komentar:</span> {submission.mentorFeedback}</p>}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
