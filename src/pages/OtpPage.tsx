import { useState, useRef, useEffect, useCallback } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { AuthAPI } from "@/services/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import { ShieldCheck, RotateCcw, ArrowLeft, CheckCircle2 } from "lucide-react"

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60 

export default function OtpPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const state = location.state as { email?: string; userId?: string; fromRegister?: boolean } | null
  const email: string = state?.email ?? "****@****.***"
  const userId: string = state?.userId ?? ""
  const fromRegister: boolean = state?.fromRegister ?? false

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""))
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN)
  const [canResend, setCanResend] = useState(false)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true)
      return
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const focusInput = (index: number) => {
    inputRefs.current[index]?.focus()
  }

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError("")
    if (digit && index < OTP_LENGTH - 1) {
      focusInput(index + 1)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const next = [...digits]
        next[index] = ""
        setDigits(next)
      } else if (index > 0) {
        focusInput(index - 1)
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusInput(index - 1)
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      focusInput(index + 1)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill("")
    pasted.split("").forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    setError("")
    focusInput(pasted.length < OTP_LENGTH ? pasted.length : OTP_LENGTH - 1)
  }

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const otp = digits.join("")
    if (otp.length < OTP_LENGTH) {
      setError("Masukkan semua 6 digit kode OTP.")
      return
    }
    if (!userId) {
      setError("Data sesi tidak valid. Silakan daftar ulang.")
      return
    }
    setLoading(true)
    setError("")
    
    try {
      await AuthAPI.verifyOtp({ userId, otp })
      setSuccess(true)
      setTimeout(() => {
        if (fromRegister) {
          navigate("/login", { replace: true, state: { registered: true } })
        } else {
          navigate("/dashboard", { replace: true })
        }
      }, 1800)
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      setError(apiError?.message ?? "Kode OTP salah atau sudah kedaluwarsa. Silakan coba lagi.")
      setDigits(Array(OTP_LENGTH).fill(""))
      focusInput(0)
    } finally {
      setLoading(false)
    }
  }, [digits, email, userId, fromRegister, navigate])

  useEffect(() => {
    if (digits.every((d) => d !== "") && !loading && !success) {
      handleSubmit()
    }
  }, [digits])

  const handleResend = async () => {
    if (!canResend || resendLoading) return
    if (!userId || !email) {
      setError("Data sesi tidak valid. Silakan daftar ulang.")
      return
    }
    setResendLoading(true)
    setResendSuccess(false)
    setError("")
    
    try {
      await AuthAPI.resendOtp({ email, userId })
      setResendSuccess(true)
      setCanResend(false)
      setCountdown(RESEND_COOLDOWN)
      setDigits(Array(OTP_LENGTH).fill(""))
      focusInput(0)
      setTimeout(() => setResendSuccess(false), 3000)
    } catch (err: unknown) {
      const apiError = err as { message?: string }
      setError(apiError?.message ?? "Gagal mengirim ulang OTP.")
    } finally {
      setResendLoading(false)
    }
  }

  const isComplete = digits.every((d) => d !== "")

  const steps = fromRegister
    ? ["Daftar", "Verifikasi Email", "Masuk"]
    : ["Masuk", "Verifikasi OTP", "Dashboard"]

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">

              <form className="p-6 md:p-8" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">

                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-300",
                      success
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-primary/10 text-primary"
                    )}>
                      {success
                        ? <CheckCircle2 className="h-7 w-7" />
                        : <ShieldCheck className="h-7 w-7" />
                      }
                    </div>
                    <h1 className="text-2xl font-bold">
                      {success ? "Email Terverifikasi!" : "Verifikasi Email"}
                    </h1>
                    <p className="text-sm text-balance text-muted-foreground">
                      {success
                        ? fromRegister
                          ? "Akun berhasil dibuat. Mengalihkan ke halaman masuk…"
                          : "Verifikasi berhasil. Mengalihkan ke dashboard…"
                        : <>
                            Kode 6 digit telah dikirim ke{" "}
                            <span className="font-medium text-foreground">{email}</span>.
                            {fromRegister && (
                              <span className="block mt-1 text-xs">
                                Verifikasi email untuk menyelesaikan pendaftaran.
                              </span>
                            )}
                          </>
                      }
                    </p>
                  </div>

                  {!success && (
                    <>
                      <div
                        className="flex items-center justify-center gap-2 sm:gap-3"
                        onPaste={handlePaste}
                      >
                        {digits.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => { inputRefs.current[i] = el }}
                            id={`otp-${i}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            autoFocus={i === 0}
                            disabled={loading || success}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className={cn(
                              "h-12 w-10 sm:h-14 sm:w-12 rounded-lg border-2 bg-background text-center text-lg font-bold",
                              "outline-none ring-0 transition-all duration-150",
                              "focus:border-primary focus:ring-2 focus:ring-primary/30",
                              digit
                                ? "border-primary/60 bg-primary/5"
                                : "border-input",
                              error && !digit
                                ? "border-destructive/70 bg-destructive/5"
                                : "",
                              "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                          />
                        ))}
                      </div>

                      {error && (
                        <div className="rounded-md bg-destructive/10 px-4 py-3">
                          <FieldError className="text-center">{error}</FieldError>
                        </div>
                      )}

                      {resendSuccess && (
                        <p className="text-center text-sm text-emerald-600 font-medium">
                          ✓ Kode baru telah dikirim ulang ke email Anda.
                        </p>
                      )}



                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loading || !isComplete}
                      >
                        {loading ? "Memverifikasi…" : "Verifikasi"}
                      </Button>

                      <div className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
                        <span>Tidak menerima kode?</span>
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={!canResend || resendLoading}
                          className={cn(
                            "flex items-center gap-1.5 font-medium transition-colors",
                            canResend && !resendLoading
                              ? "text-primary hover:underline underline-offset-4 cursor-pointer"
                              : "text-muted-foreground cursor-not-allowed"
                          )}
                        >
                          <RotateCcw className={cn("h-3.5 w-3.5", resendLoading && "animate-spin")} />
                          {resendLoading
                            ? "Mengirim ulang…"
                            : canResend
                              ? "Kirim ulang kode"
                              : `Kirim ulang dalam ${countdown}d`
                          }
                        </button>
                      </div>

                      <Link
                        to={fromRegister ? "/register" : "/login"}
                        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        {fromRegister ? "Kembali ke halaman daftar" : "Kembali ke halaman masuk"}
                      </Link>
                    </>
                  )}
                </div>
              </form>

              <div className="relative hidden bg-gradient-to-br from-slate-800 to-slate-950 md:flex md:flex-col md:items-center md:justify-center md:p-10">
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-[-20%] left-[-20%] h-[60%] w-[60%] rounded-full bg-emerald-600/20 blur-[80px]" />
                  <div className="absolute bottom-[-20%] right-[-20%] h-[60%] w-[60%] rounded-full bg-blue-600/20 blur-[80px]" />
                </div>
                <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                  <div className="relative flex h-20 w-20 items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-30" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                      <ShieldCheck className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-white">
                      {fromRegister ? "Verifikasi Akun Baru" : "Keamanan Dua Langkah"}
                    </h2>
                    <p className="max-w-xs text-sm text-slate-400">
                      {fromRegister
                        ? "Masukkan kode yang dikirim ke email Anda untuk mengaktifkan akun dan mulai menggunakan sistem."
                        : "Kode OTP memastikan identitas Anda sebelum mengakses sistem."
                      }
                    </p>
                  </div>

                  <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                    {steps.map((step, i) => (
                      <div key={step} className="flex items-center gap-2">
                        <div className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0",
                          i === 0
                            ? "bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-500/50"
                            : i === 1
                              ? "bg-blue-500/30 text-blue-200 ring-1 ring-blue-400/60"
                              : "bg-white/10 text-slate-400"
                        )}>
                          {i === 0 ? "✓" : i + 1}
                        </div>
                        <span className={cn(
                          "text-xs",
                          i === 1 ? "text-white font-medium" : "text-slate-500"
                        )}>
                          {step}
                        </span>
                        {i < steps.length - 1 && (
                          <div className="h-px w-4 bg-slate-700 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          <p className="px-6 text-center text-sm text-muted-foreground">
            Butuh bantuan?{" "}
            <a href="#" className="underline underline-offset-4 hover:text-foreground">
              Hubungi Support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
