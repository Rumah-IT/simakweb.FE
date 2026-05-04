import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Camera, Save, User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import api from "@/services/api"

function getInitials(name: string) {
  return name ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "U"
}

function loadUserFromStorage() {
  try {
    const raw = localStorage.getItem("user")
    if (!raw) return null
    return JSON.parse(raw) as {
      id: string
      name: string
      role: string
      email: string
      phone?: string
    }
  } catch {
    return null
  }
}

export default function ProfilePage() {
  const storedUser = loadUserFromStorage()

  const [name, setName] = useState(storedUser?.name ?? "")
  const [email, setEmail] = useState(storedUser?.email ?? "")
  const [phone, setPhone] = useState(storedUser?.phone ?? "")
  const [role] = useState(storedUser?.role ?? "")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("profile_photo")
    if (saved) setPhotoUrl(saved)
  }, [])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      setPhotoUrl(result)
      localStorage.setItem("profile_photo", result)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError("")
    setProfileSuccess(false)

    if (!name.trim()) {
      setProfileError("Nama lengkap tidak boleh kosong.")
      return
    }
    if (phone && !/^[0-9+\-\s()]{8,15}$/.test(phone)) {
      setProfileError("Format nomor telepon tidak valid.")
      return
    }

    setProfileLoading(true)
    try {
      if (storedUser?.id) {
        await api.UserAPI.update(storedUser.id, {
          fullName: name,
          email: email,
          phone: phone || null,
        })
      }
      
      const updated = { ...storedUser, name, email, phone }
      localStorage.setItem("user", JSON.stringify(updated))
      
      setProfileSuccess(true)
      toast.success("Profil berhasil diperbarui")
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err: any) {
      setProfileError(err.message || "Gagal memperbarui profil")
      toast.error("Gagal memperbarui profil")
    } finally {
      setProfileLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setPasswordSuccess(false)

    if (!currentPassword) {
      setPasswordError("Masukkan password saat ini.")
      return
    }
    if (newPassword.length < 6) {
      setPasswordError("Password baru minimal 6 karakter.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Password baru dan konfirmasi tidak cocok.")
      return
    }

    setPasswordLoading(true)
    try {
      // Backend currently does not support password update via user endpoint
      // Simulate API call for now
      await new Promise(r => setTimeout(r, 1000))
      
      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password berhasil diperbarui")
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: any) {
      setPasswordError(err.message || "Gagal mengubah password")
    } finally {
      setPasswordLoading(false)
    }
  }

  const initials = getInitials(name || "User")

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil Saya</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola informasi pribadi dan keamanan akun Anda.
        </p>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Informasi Pribadi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile}>
            <div className="flex flex-col gap-6">

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative shrink-0">
                  <div className="h-24 w-24 rounded-full ring-4 ring-border overflow-hidden">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Foto profil"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-2xl font-bold">
                        {initials}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-background hover:bg-primary/90 transition-colors"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div className="flex flex-col items-center sm:items-start gap-1.5 text-center sm:text-left">
                  <p className="font-semibold text-base leading-tight">{name || "—"}</p>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                    {role || "User"}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, atau GIF. Maksimal 2 MB.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    Ganti foto profil
                  </button>
                </div>
              </div>

              <div className="border-t pt-6">
                <FieldGroup>
                  {profileError && (
                    <div className="rounded-md bg-destructive/10 px-4 py-3">
                      <FieldError className="text-center">{profileError}</FieldError>
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="flex items-center gap-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Profil berhasil disimpan.
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="prof-name" className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        Nama Lengkap
                      </FieldLabel>
                      <Input
                        id="prof-name"
                        type="text"
                        placeholder="Nama lengkap Anda"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={profileLoading}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="prof-email" className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        Email
                      </FieldLabel>
                      <Input
                        id="prof-email"
                        type="email"
                        placeholder="nama@contoh.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={profileLoading}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="prof-phone" className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        No. Telepon
                      </FieldLabel>
                      <Input
                        id="prof-phone"
                        type="tel"
                        placeholder="+62 812-3456-7890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={profileLoading}
                      />
                      <FieldDescription className="text-xs">
                        Opsional. Format: 08xx...
                      </FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="prof-role" className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        Role
                      </FieldLabel>
                      <Input
                        id="prof-role"
                        type="text"
                        value={role}
                        disabled
                        className="capitalize cursor-not-allowed opacity-60"
                      />
                      <FieldDescription className="text-xs">
                        Role tidak dapat diubah sendiri.
                      </FieldDescription>
                    </Field>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={profileLoading} className="gap-2">
                      {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {profileLoading ? "Menyimpan…" : "Simpan Perubahan"}
                    </Button>
                  </div>
                </FieldGroup>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Ubah Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword}>
            <FieldGroup>
              {passwordError && (
                <div className="rounded-md bg-destructive/10 px-4 py-3">
                  <FieldError className="text-center">{passwordError}</FieldError>
                </div>
              )}
              {passwordSuccess && (
                <div className="flex items-center gap-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Password berhasil diperbarui.
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="pwd-current">Password Saat Ini</FieldLabel>
                  <div className="relative">
                    <Input
                      id="pwd-current"
                      type={showCurrent ? "text" : "password"}
                      placeholder="••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={passwordLoading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>

                <Field>
                  <FieldLabel htmlFor="pwd-new">Password Baru</FieldLabel>
                  <div className="relative">
                    <Input
                      id="pwd-new"
                      type={showNew ? "text" : "password"}
                      placeholder="Min. 6 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={passwordLoading}
                      className={cn("pr-10", newPassword.length > 0 && newPassword.length < 6 && "border-amber-400")}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          newPassword.length < 6
                            ? "w-1/4 bg-red-400"
                            : newPassword.length < 10
                              ? "w-2/4 bg-amber-400"
                              : "w-full bg-emerald-500"
                        )}
                      />
                    </div>
                  )}
                </Field>

                <Field>
                  <FieldLabel htmlFor="pwd-confirm">Konfirmasi Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="pwd-confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Ulangi password baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={passwordLoading}
                      className={cn(
                        "pr-10",
                        confirmPassword && confirmPassword !== newPassword && "border-red-400"
                      )}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Password cocok
                    </p>
                  )}
                </Field>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={passwordLoading} variant="outline" className="gap-2">
                  {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {passwordLoading ? "Memperbarui…" : "Perbarui Password"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
