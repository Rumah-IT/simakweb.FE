import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Users, Search, MoreHorizontal,
  Pencil, Trash2, X, Phone, Mail,
  Loader2, AlertCircle, UserPlus, Eye, EyeOff,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserAPI } from "@/services/api"

interface Mentor {
  id: string
  fullName: string
  email: string
  phone: string | null
  isActive: boolean
}

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
}

export default function MentorPage() {
  const [data, setData] = useState<Mentor[]>([])
  const [search, setSearch] = useState("")
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Mentor | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await UserAPI.getAll()
      const arr = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? [])
      const mentors = arr.filter((u: any) => u.role === "MENTOR")
      setData(mentors)
      setError("")
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Gagal memuat data mentor")
      toast.error("Gagal memuat daftar mentor")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = data.filter(m =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (m.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.phone || "").includes(search)
  )

  const openAdd = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setShowPassword(false)
    setModalOpen(true)
  }

  const openEdit = (m: Mentor) => {
    setEditTarget(m)
    setForm({ fullName: m.fullName, email: m.email, phone: m.phone ?? "", password: "" })
    setShowPassword(false)
    setMenuOpen(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.fullName.trim()) { toast.error("Nama lengkap wajib diisi."); return }
    if (!form.email.trim()) { toast.error("Email wajib diisi."); return }
    if (!editTarget && form.password.length < 6) { toast.error("Password minimal 6 karakter."); return }

    setSaving(true)
    try {
      if (editTarget) {
        const payload: any = {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          role: "MENTOR",
        }
        if (form.password && form.password.length >= 6) {
          payload.password = form.password
        }
        await UserAPI.update(editTarget.id, payload)
        toast.success("Data mentor berhasil diperbarui.")
      } else {
        await UserAPI.create({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          role: "MENTOR",
        })
        toast.success("Akun mentor berhasil dibuat. Mentor dapat langsung login.")
      }
      setModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan data mentor.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await UserAPI.delete(id)
      toast.success("Akun mentor berhasil dihapus.")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus akun mentor.")
    } finally {
      setDeleteConfirm(null)
      setMenuOpen(null)
    }
  }

  const activeCount = data.filter(m => m.isActive).length

  return (
    <div className="space-y-8">

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Mentor</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Kelola akun mentor yang bertugas membimbing santri. Akun dibuat langsung oleh Admin dan dapat langsung digunakan tanpa verifikasi email.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2">
        {[
          { label: "Total Mentor", value: loading ? "..." : data.length, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
          { label: "Mentor Aktif", value: loading ? "..." : activeCount, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
        ].map(card => (
          <Card key={card.label} className="border-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <Users className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold tracking-tight">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            id="search-mentor"
            type="text"
            placeholder="Cari nama, email, atau telepon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button
          id="btn-tambah-mentor"
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <UserPlus className="h-4 w-4" />
          Tambah Mentor
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
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nama Mentor</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Kontak</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    Belum ada mentor terdaftar.
                  </td>
                </tr>
              ) : filtered.map((m, idx) => (
                <tr key={m.id} className="border-b last:border-0 transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {m.fullName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <span className="font-medium">{m.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {m.email}
                    </div>
                    {m.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {m.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${m.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400"}`}>
                      {m.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="relative inline-block">
                      <button
                        id={`menu-mentor-${m.id}`}
                        onClick={() => setMenuOpen(menuOpen === m.id ? null : m.id)}
                        className="rounded-md p-1.5 transition hover:bg-muted"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {menuOpen === m.id && (
                        <div className="absolute right-0 top-8 z-20 min-w-[130px] rounded-lg border bg-popover shadow-lg">
                          <button onClick={() => openEdit(m)} className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted">
                            <Pencil className="h-3.5 w-3.5" />Edit
                          </button>
                          <button onClick={() => { setDeleteConfirm(m.id); setMenuOpen(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30">
                            <Trash2 className="h-3.5 w-3.5" />Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="relative w-full max-w-md rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{editTarget ? "Edit Akun Mentor" : "Tambah Mentor Baru"}</h2>
                {!editTarget && (
                  <p className="mt-0.5 text-xs text-muted-foreground">Akun mentor dapat langsung login tanpa verifikasi email.</p>
                )}
              </div>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 transition hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nama Lengkap <span className="text-red-500">*</span></label>
                <input
                  id="input-nama-mentor"
                  type="text"
                  placeholder="Nama lengkap mentor"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Email <span className="text-red-500">*</span></label>
                <input
                  id="input-email-mentor"
                  type="email"
                  placeholder="email@contoh.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Nomor Telepon</label>
                <input
                  id="input-telepon-mentor"
                  type="text"
                  placeholder="0821xxxxxxxx"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Password {editTarget ? "(Kosongkan jika tidak ingin mengubah)" : <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    id="input-password-mentor"
                    type={showPassword ? "text" : "password"}
                    placeholder={editTarget ? "Password baru (opsional)" : "Minimal 6 karakter"}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} disabled={saving} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">
                Batal
              </button>
              <button
                id="btn-simpan-mentor"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editTarget ? "Simpan Perubahan" : "Buat Akun Mentor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border/60" onClick={e => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold">Hapus Akun Mentor</h3>
                <p className="text-xs text-muted-foreground">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Akun mentor beserta semua aksesnya akan dihapus secara permanen dari sistem.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted">Batal</button>
              <button
                id="btn-konfirm-hapus-mentor"
                onClick={() => handleDelete(deleteConfirm)}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen !== null && <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />}
    </div>
  )
}
