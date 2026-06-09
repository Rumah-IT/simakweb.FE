import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { RelasiAPI } from "@/services/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, GraduationCap } from "lucide-react"

export default function WaliDashboardPage() {
  const navigate = useNavigate()
  const [relasi, setRelasi] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") ?? "{}")
    setUser(storedUser)

    const fetchRelasi = async () => {
      try {
        const response = await RelasiAPI.getAll()
        const allRelasi = response.data || []
        const myRelasi = allRelasi.filter((r: any) => r.wali?.id === storedUser.id)
        setRelasi(myRelasi)
      } catch (error) {
        console.error("Gagal mengambil data relasi:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelasi()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard Wali</h2>
        <p className="text-muted-foreground">
          Selamat datang, {user?.fullName || user?.name || "Wali Santri"}. Berikut adalah daftar santri yang terkait dengan Anda.
        </p>
      </div>

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Santri
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{loading ? "..." : relasi.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Daftar Santri</h3>
        {loading ? (
          <p>Memuat data santri...</p>
        ) : relasi.length === 0 ? (
          <p className="text-muted-foreground">Tidak ada santri yang terkait.</p>
        ) : (
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
            {relasi.map((r) => (
              <Card 
                key={r.id} 
                className="overflow-hidden cursor-pointer hover:border-primary transition-colors"
                onClick={() => navigate(`/wali/santri/${r.santri?.id}`)}
              >
                <div className="bg-primary/10 p-4 flex justify-center items-center">
                  <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-md">
                    <GraduationCap className="h-10 w-10" />
                  </div>
                </div>
                <CardHeader>
                  <CardTitle>{r.santri?.fullName || "Nama Santri"}</CardTitle>
                  <CardDescription>NIS: {r.santri?.nis || "-"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <span className="font-medium">Hubungan:</span> {r.category}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
