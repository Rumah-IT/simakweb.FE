import {
  Users, BookOpenCheck, BarChart3, Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function loadUser() {
  try { return JSON.parse(localStorage.getItem("user") ?? "{}") } catch { return {} }
}

export default function MentorDashboardPage() {
  const user = loadUser()
  const displayName: string = user.name ?? user.fullName ?? "Mentor"

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Mentor</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Selamat datang, <span className="font-semibold text-foreground">{displayName}</span> — ini ringkasan bimbingan Anda.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        {[
          { title: "Total Santri Bimbingan", value: "0", sub: "Santri yang dibimbing", icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
          { title: "Jurnal Menunggu Review", value: "0", sub: "Perlu ditinjau", icon: BookOpenCheck, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
          { title: "Penilaian Terakhir", value: "-", sub: "Bulan ini", icon: BarChart3, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
        ].map(card => (
          <Card key={card.title} className="group relative overflow-hidden border-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold tracking-tight">{card.value}</div>
              <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-border/60 p-8 text-center text-muted-foreground">
        <p>Fitur mentor lainnya sedang dalam pengembangan.</p>
      </Card>
    </div>
  )
}
