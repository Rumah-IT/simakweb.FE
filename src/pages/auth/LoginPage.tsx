import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
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

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from ?? null
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await AuthAPI.login({ email, password })
      const { user, token, refreshToken } = response.data

      localStorage.setItem("token", token)
      localStorage.setItem("refreshToken", refreshToken)
      localStorage.setItem("user", JSON.stringify(user))
      
      const role: string = user?.role ?? ""
      const defaultPath = role === "SANTRI" ? "/santri" : "/dashboard"
      navigate(from ?? defaultPath, { replace: true })
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      setError(apiError?.message ?? "Email atau password salah.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm
          email={email}
          password={password}
          error={error}
          loading={loading}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  )
}

interface LoginFormProps extends React.ComponentProps<"div"> {
  email: string
  password: string
  error: string
  loading: boolean
  onEmailChange: (val: string) => void
  onPasswordChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
}

function LoginForm({
  className,
  email,
  password,
  error,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  ...props
}: LoginFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Selamat Datang</h1>
                <p className="text-balance text-muted-foreground">
                  Masuk ke akun Anda untuk melanjutkan
                </p>
              </div>


              {error && (
                <div className="rounded-md bg-destructive/10 px-4 py-3">
                  <FieldError className="text-center">{error}</FieldError>
                </div>
              )}

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
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Lupa password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  disabled={loading}
                />
              </Field>

              <Field>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Masuk..." : "Masuk"}
                </Button>
              </Field>

              <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 p-4 border border-blue-100 dark:border-blue-900">
                <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                  <strong>Hint Login Admin:</strong><br />
                  <span className="font-mono mt-1 block">admin@pesantren.id</span>
                  <span className="font-mono">Password123!</span>
                </p>
              </div>


              <FieldDescription className="text-center">
                Belum punya akun?{" "}
                <Link
                  to="/register"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Daftar sekarang
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>

              

          <AuthCarousel />
        </CardContent>
      </Card>



      <FieldDescription className="px-6 text-center">
        Dengan masuk, Anda menyetujui{" "}
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
