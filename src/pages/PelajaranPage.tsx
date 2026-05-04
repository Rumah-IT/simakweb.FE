import { useState } from "react"
import { toast } from "sonner"
import {
  BookOpen,
  Search,
  Filter,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Layers,
  GraduationCap,
  Clock,
  Users,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Pelajaran {
  id: number
  nama: string
  kode: string
  kategori: "agama" | "teknologi" | "bisnis" | "umum"
  kelas: string
  pengajar: string
  durasi: number
  deskripsi: string
}



const kategoriConfig: Record<
  Pelajaran["kategori"],
  { label: string; className: string }
> = {
  agama: {
    label: "Agama",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  teknologi: {
    label: "Teknologi",
    className:
      "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  },
  bisnis: {
    label: "Bisnis",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  umum: {
    label: "Umum",
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
}

const emptyForm: Omit<Pelajaran, "id"> = {
  nama: "",
  kode: "",
  kategori: "teknologi",
  kelas: "",
  pengajar: "",
  durasi: 60,
  deskripsi: "",
}

export default function PelajaranPage() {
  const [data, setData] = useState<Pelajaran[]>([])
  const [search, setSearch] = useState("")
  const [filterKategori, setFilterKategori] = useState<string>("semua")
  const [menuOpen, setMenuOpen] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Pelajaran | null>(null)
  const [form, setForm] = useState<Omit<Pelajaran, "id">>(emptyForm)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const statCards = [
    {
      label: "Total Pelajaran",
      value: data.length,
      icon: BookOpen,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-950/40",
    },
    {
      label: "Teknologi",
      value: data.filter((d) => d.kategori === "teknologi").length,
      icon: Layers,
      color: "text-sky-600",
      bg: "bg-sky-50 dark:bg-sky-950/40",
    },
    {
      label: "Agama",
      value: data.filter((d) => d.kategori === "agama").length,
      icon: GraduationCap,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Pengajar",
      value: [...new Set(data.map((d) => d.pengajar))].length,
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950/40",
    },
  ]

  const filtered = data.filter((p) => {
    const matchSearch =
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.kode.toLowerCase().includes(search.toLowerCase()) ||
      p.pengajar.toLowerCase().includes(search.toLowerCase())
    const matchKategori =
      filterKategori === "semua" || p.kategori === filterKategori
    return matchSearch && matchKategori
  })

  const openEdit = (pelajaran: Pelajaran) => {
    setEditTarget(pelajaran)
    setForm({
      nama: pelajaran.nama,
      kode: pelajaran.kode,
      kategori: pelajaran.kategori,
      kelas: pelajaran.kelas,
      pengajar: pelajaran.pengajar,
      durasi: pelajaran.durasi,
      deskripsi: pelajaran.deskripsi,
    })
    setMenuOpen(null)
    setModalOpen(true)
  }

  const handleSave = () => {
    if (!form.nama || !form.kode || !form.kelas || !form.pengajar) {
      toast.error("Harap lengkapi semua field wajib.")
      return
    }
    if (editTarget) {
      setData((prev) =>
        prev.map((p) => (p.id === editTarget.id ? { ...p, ...form } : p))
      )
      toast.success("Pelajaran berhasil diperbarui.")
    } else {
      const newId = Math.max(0, ...data.map((p) => p.id)) + 1
      setData((prev) => [...prev, { id: newId, ...form }])
      toast.success("Pelajaran berhasil ditambahkan.")
    }
    setModalOpen(false)
  }

  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((p) => p.id !== id))
    setDeleteConfirm(null)
    setMenuOpen(null)
    toast.success("Pelajaran berhasil dihapus.")
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Pelajaran</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Kelola mata pelajaran yang diajarkan di setiap kelas pesantren.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card
            key={card.label}
            className="border-0 shadow-sm ring-1 ring-border/60 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight">
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="search-pelajaran"
              type="text"
              placeholder="Cari nama, kode, atau pengajar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm outline-none ring-0 transition focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="relative flex items-center gap-1 rounded-lg border bg-background px-3 py-2 text-sm">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              id="filter-kategori-pelajaran"
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="bg-transparent text-sm outline-none cursor-pointer"
            >
              <option value="semua">Semua</option>
              <option value="teknologi">Teknologi</option>
              <option value="agama">Agama</option>
              <option value="bisnis">Bisnis</option>
              <option value="umum">Umum</option>
            </select>
          </div>
        </div>

      </div>

      <Card className="border-0 shadow-sm ring-1 ring-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  #
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Nama Pelajaran
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Kode
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Kelas
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Pengajar
                </th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                  Durasi
                </th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    <BookOpen className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    Tidak ada pelajaran ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((pelajaran, idx) => {
                  const cfg = kategoriConfig[pelajaran.kategori]
                  return (
                    <tr
                      key={pelajaran.id}
                      className="border-b last:border-0 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{pelajaran.nama}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {pelajaran.deskripsi}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-mono font-medium">
                          {pelajaran.kode}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{pelajaran.kelas}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                          {pelajaran.pengajar}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {pelajaran.durasi} mnt
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            id={`menu-pelajaran-${pelajaran.id}`}
                            onClick={() =>
                              setMenuOpen(
                                menuOpen === pelajaran.id ? null : pelajaran.id
                              )
                            }
                            className="rounded-md p-1.5 transition hover:bg-muted"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menuOpen === pelajaran.id && (
                            <div className="absolute right-0 top-8 z-20 min-w-[130px] rounded-lg border bg-popover shadow-lg">
                              <button
                                onClick={() => openEdit(pelajaran)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirm(pelajaran.id)
                                  setMenuOpen(null)
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl bg-background shadow-2xl ring-1 ring-border/60 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editTarget ? "Edit Pelajaran" : "Tambah Pelajaran"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1.5 transition hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Nama Pelajaran <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-nama-pelajaran"
                    type="text"
                    placeholder="Contoh: Pemrograman Web"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Kode <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="input-kode-pelajaran"
                    type="text"
                    placeholder="Contoh: TK-101"
                    value={form.kode}
                    onChange={(e) => setForm({ ...form, kode: e.target.value })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Kategori
                  </label>
                  <select
                    id="input-kategori-pelajaran"
                    value={form.kategori}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        kategori: e.target.value as Pelajaran["kategori"],
                      })
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="teknologi">Teknologi</option>
                    <option value="agama">Agama</option>
                    <option value="bisnis">Bisnis</option>
                    <option value="umum">Umum</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Durasi (menit)
                  </label>
                  <input
                    id="input-durasi-pelajaran"
                    type="number"
                    min={30}
                    step={15}
                    value={form.durasi}
                    onChange={(e) =>
                      setForm({ ...form, durasi: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Kelas <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-kelas-pelajaran"
                  type="text"
                  placeholder="Contoh: Kelas A, B"
                  value={form.kelas}
                  onChange={(e) => setForm({ ...form, kelas: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Pengajar <span className="text-red-500">*</span>
                </label>
                <input
                  id="input-pengajar-pelajaran"
                  type="text"
                  placeholder="Contoh: Ust. Budi Santoso"
                  value={form.pengajar}
                  onChange={(e) =>
                    setForm({ ...form, pengajar: e.target.value })
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Deskripsi
                </label>
                <textarea
                  id="input-deskripsi-pelajaran"
                  rows={3}
                  placeholder="Deskripsi singkat pelajaran..."
                  value={form.deskripsi}
                  onChange={(e) =>
                    setForm({ ...form, deskripsi: e.target.value })
                  }
                  className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted"
              >
                Batal
              </button>
              <button
                id="btn-simpan-pelajaran"
                onClick={handleSave}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                {editTarget ? "Simpan Perubahan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-2xl ring-1 ring-border/60"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold">Hapus Pelajaran</h3>
                <p className="text-xs text-muted-foreground">
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
            </div>
            <p className="mb-5 text-sm text-muted-foreground">
              Apakah kamu yakin ingin menghapus pelajaran ini?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border px-4 py-2 text-sm transition hover:bg-muted"
              >
                Batal
              </button>
              <button
                id="btn-konfirm-hapus-pelajaran"
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-red-600"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {menuOpen !== null && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuOpen(null)}
        />
      )}
    </div>
  )
}
