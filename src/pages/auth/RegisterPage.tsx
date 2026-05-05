import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { AuthAPI } from "@/services/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AuthCarousel } from "@/components/AuthCarousel"


export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("SANTRI")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.")
      return
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.")
      return
    }

    setLoading(true)
    try {
      const response = await AuthAPI.register({
        fullName: name,
        email,
        phone,
        password,
        role
      })

      navigate("/otp", { replace: true, state: { email, userId: response?.data?.id, fromRegister: true } })
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      setError(apiError?.message ?? "Registrasi gagal. Silakan coba lagi.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <RegisterForm
          name={name}
          email={email}
          phone={phone}
          role={role}
          password={password}
          confirmPassword={confirmPassword}
          error={error}
          loading={loading}
          onNameChange={setName}
          onEmailChange={setEmail}
          onPhoneChange={setPhone}
          onRoleChange={setRole}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}

interface RegisterFormProps extends React.ComponentProps<"div"> {
  name: string
  email: string
  phone: string
  role: string
  password: string
  confirmPassword: string
  error: string
  loading: boolean
  onNameChange: (val: string) => void
  onEmailChange: (val: string) => void
  onPhoneChange: (val: string) => void
  onRoleChange: (val: string) => void
  onPasswordChange: (val: string) => void
  onConfirmPasswordChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
}

function RegisterForm({
  className,
  name,
  email,
  phone,
  role,
  password,
  confirmPassword,
  error,
  loading,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onRoleChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  ...props
}: RegisterFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Buat Akun Baru</h1>
                <p className="text-balance text-muted-foreground">
                  Isi data di bawah untuk mendaftar
                </p>
              </div>

              {error && (
                <div className="rounded-md bg-destructive/10 px-4 py-3">
                  <FieldError className="text-center">{error}</FieldError>
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nama lengkap Anda"
                  required
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@contoh.com"
                  required
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="phone">Nomor Telepon</FieldLabel>
                <Input
                  id="phone"
                  type="text"
                  placeholder="Minimal 10 karakter"
                  required
                  value={phone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="role">Peran</FieldLabel>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={role === "SANTRI" ? "default" : "outline"}
                    onClick={() => onRoleChange("SANTRI")}
                    disabled={loading}
                    className="w-full"
                  >
                    Santri
                  </Button>
                  <Button
                    type="button"
                    variant={role === "WALI_SANTRI" ? "default" : "outline"}
                    onClick={() => onRoleChange("WALI_SANTRI")}
                    disabled={loading}
                    className="w-full"
                  >
                    Wali Santri
                  </Button>
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  required
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="confirmPassword">Konfirmasi Password</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  required
                  value={confirmPassword}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Mendaftar..." : "Daftar"}
                </Button>
              </Field>

              <FieldDescription className="text-center">
                Sudah punya akun ?{" "}
                <Link
                  to="/login"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Masuk di sini
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>

          <AuthCarousel />
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        Dengan mendaftar, Anda menyetujui{" "}
        <a href="#" className="underline underline-offset-4">
          Syarat Layanan
        </a>{" "}
        dan{" "}
        <a href="#" className="underline underline-offset-4">
          Kebijakan Privasi
        </a>
        .
      </FieldDescription>
    </div>
  )
}
