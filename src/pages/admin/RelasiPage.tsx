import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Link2,  Search, MoreHorizontal,
  Trash2, X, User, UserCog, Heart,
  ArrowRight, Loader2, AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/services/api"

interface Relasi {
  id: string
  santriId: string
  santriName: string
  nisSantri: string
  waliId: string
  waliName: string
  emailWali: string
  category: "FATHER" | "MOTHER" | "GUARDIAN" | "OTHER"
  createdAt: string
}

const hubunganConfig = {
  FATHER: { label: "Ayah", className: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
  MOTHER: { label: "Ibu", className: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
  GUARDIAN: { label: "Wali", className: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  OTHER: { label: "Lainnya", className: "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300" },
}

export default function RelasiPage() {
  const [data, setData] = useState<Relasi[]>([])
  const [santriList, setSantriList] = useState<{id: string, nama: string, nis: string}[]>([])
  const [waliList, setWaliList] = useState<{id: string, nama: string}[]>([])

  const [search, setSearch] = useState("")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<{waliId: string, santriId: string, category: string}>({ waliId: "", santriId: "", category: "FATHER" })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)

      const [resSantri, resWali] = await Promise.all([
        api.SantriAPI.getAll(),
        api.AuthAPI.getUsers()
      ])

      const sArray = Array.isArray(resSantri.data) ? resSantri.data : (resSantri.data?.data || [])
      setSantriList(sArray.map((s: any) => ({
        id: s.userId || s.id,
        nama: s.fullName || s.user?.fullName,
        nis: s.nis
      })))

      const wArray = Array.isArray(resWali.data) ? resWali.data : (resWali.data?.data || [])
      setWaliList(wArray.filter((u: any) => u.role === "WALI_SANTRI" || u.role === "WALI").map((w: any) => ({
        id: w.id,
        nama: w.fullName
      })))

      try {
        const resRelasi = await api.RelasiAPI.getAll()
        const relArray = Array.isArray(resRelasi.data) ? resRelasi.data : (resRelasi.data?.data || [])
        const mapped = relArray.map((r: any) => ({
          id: r.id,
          santriId: r.santriId,
          santriName: r.santri?.fullName || "-",
          nisSantri: r.santri?.nis || "-",
          waliId: r.waliId,
          waliName: r.wali?.fullName || "-",
          emailWali: r.wali?.email || "-",
          category: r.category || "OTHER",
          createdAt: r.createdAt || new Date().toISOString()
        }))
        setData(mapped)
      } catch {
        setData([])
      }

      setError("")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Gagal memuat relasi")
      toast.error("Gagal memuat daftar relasi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const statCards = [
    { label: "Total Relasi", value: data.length, icon: Link2, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
    { label: "Santri Terdaftar", value: [...new Set(data.map(d => d.santriId))].length, icon: User, color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-950/40" },
    { label: "Wali Terdaftar", value: [...new Set(data.map(d => d.waliId))].length, icon: UserCog, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  ]

  const filtered = data.filter(r =>
    r.santriName.toLowerCase().includes(search.toLowerCase()) || 
    r.waliName.toLowerCase().includes(search.toLowerCase()) || 
    r.nisSantri.includes(search)
  )

const handleSave = async () => {
    if (!form.santriId || !form.waliId || !form.category) { 
      toast.error("Harap lengkapi semua field wajib."); 
      return 
    }
    
    setSaving(true)
    try {
      await api.RelasiAPI.create({
        waliId: form.waliId,
        santriId: form.santriId,
        category: form.category
      })
      toast.success("Relasi wali-santri berhasil ditambahkan.")
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan relasi.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.RelasiAPI.delete(id)
      toast.success("Relasi berhasil dihapus.")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus relasi.")
    } finally {
      setDeleteConfirm(null)
      setMenuOpen(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Relasi Wali–Santri</h1>
        </div>
        <p className="text-sm text-muted-foreground">Kelola pemetaan hubungan antara wali dan santri.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        {statCards.map(card => (
          <Card key={card.label} className="border-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}><card.icon className={`h-4 w-4 ${card.color}`} /></div>
            </CardHeader>
            <CardContent><div className="text-2xl md:text-3xl font-bold tracking-tight">{loading ? "..." : card.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input id="search-relasi" type="text" placeholder="Cari santri, NIS, atau wali..." value={search} onChange={e => setSearch(e.target.value)} className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30" />
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Link2 className="h-4 w-4" />
          Tambah Relasi
        </button>
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
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground"></th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Wali</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Hubungan</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Terdaftar</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground"><Link2 className="mx-auto mb-2 h-8 w-8 opacity-30" />Tidak ada relasi ditemukan.</td></tr>
              ) : filtered.map((r, idx) => {
                const cfg = hubunganConfig[r.category] || hubunganConfig.OTHER
                return (
                  <tr key={r.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-900/40"><User className="h-4 w-4 text-sky-600" /></div>
                        <div>
                          <div className="font-medium">{r.santriName}</div>
                          <div className="text-xs text-muted-foreground">NIS {r.nisSantri}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Heart className="h-3.5 w-3.5 text-pink-500" />
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40"><UserCog className="h-4 w-4 text-violet-600" /></div>
                        <div>
                          <div className="font-medium">{r.waliName}</div>
                          <div className="text-xs text-muted-foreground">{r.emailWali}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.label}</span></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block">
                        <button id={`menu-relasi-${r.id}`} onClick={() => setMenuOpen(menuOpen === r.id ? null : r.id)} className="rounded-md p-1.5 transition hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
                        {menuOpen === r.id && (
                          <div className="absolute right-0 top-8 z-20 min-w-[130px] rounded-lg border bg-popover shadow-lg">
                            <button onClick={() => { setDeleteConfirm(r.id); setMenuOpen(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"><Trash2 className="h-3.5 w-3.5" />Putus Relasi</button>
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="relative w-full max-w-lg rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Tambah Relasi Wali–Santri</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 transition hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border-2 border-dashed border-sky-300 bg-sky-50 dark:bg-sky-950/20 p-3 text-center">
                <User className="mx-auto mb-1 h-5 w-5 text-sky-500" />
                <p className="text-xs font-semibold text-sky-700 dark:text-sky-300">Data Santri</p>
              </div>
              <div className="rounded-lg border-2 border-dashed border-violet-300 bg-violet-50 dark:bg-violet-950/20 p-3 text-center">
                <UserCog className="mx-auto mb-1 h-5 w-5 text-violet-500" />
                <p className="text-xs font-semibold text-violet-700 dark:text-violet-300">Data Wali</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Akun Santri <span className="text-red-500">*</span></label>
                <Select value={form.santriId} onValueChange={v => setForm({ ...form, santriId: v || "" })}>
                  <SelectTrigger id="input-santri-relasi" className="w-full">
                    <SelectValue placeholder="Pilih santri...">
                      {form.santriId ? santriList.find(s => s.id === form.santriId)?.nama : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {santriList.map(s => <SelectItem key={s.id} value={s.id}>{s.nama} - {s.nis}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Akun Wali <span className="text-red-500">*</span></label>
                  <Select value={form.waliId} onValueChange={v => setForm({ ...form, waliId: v || "" })}>
                    <SelectTrigger id="input-wali-relasi" className="w-full">
                      <SelectValue placeholder="Pilih wali...">
                        {form.waliId ? waliList.find(w => w.id === form.waliId)?.nama : undefined}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {waliList.map(w => <SelectItem key={w.id} value={w.id}>{w.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Hubungan</label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v || "" })}>
                    <SelectTrigger id="input-hubungan-relasi" className="w-full">
                      <SelectValue placeholder="Pilih hubungan..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FATHER">Ayah</SelectItem>
                      <SelectItem value="MOTHER">Ibu</SelectItem>
                      <SelectItem value="GUARDIAN">Wali</SelectItem>
                      <SelectItem value="OTHER">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Batal</button>
              <button id="btn-simpan-relasi" onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Relasi
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border/60" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40"><Trash2 className="h-5 w-5 text-red-500" /></div>
              <div><h3 className="font-semibold">Putus Relasi</h3><p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p></div>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">Apakah kamu yakin ingin memutus relasi wali–santri ini?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} disabled={loading} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Batal</button>
              <button id="btn-konfirm-hapus-relasi" onClick={() => handleDelete(deleteConfirm)} disabled={loading} className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50">
                Ya, Putus
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen !== null && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  )
}
