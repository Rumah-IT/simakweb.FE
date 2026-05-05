import * as React from "react"
import { useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import {
  GraduationCap,
  ClipboardCheck,
  FileText,
  BarChart3,
  Users,
} from "lucide-react"

const slides = [
  {
    icon: GraduationCap,
    title: "Manajemen Santri",
    description:
      "Kelola data santri lengkap — dari pendaftaran, kelas, hingga riwayat akademik dalam satu platform terpadu.",
    color: "from-blue-500/30 to-indigo-600/30",
    glow: "bg-blue-600/20",
  },
  {
    icon: ClipboardCheck,
    title: "Absensi Digital",
    description:
      "Catat dan pantau kehadiran santri secara real-time. Laporan otomatis tersedia kapan saja.",
    color: "from-emerald-500/30 to-teal-600/30",
    glow: "bg-emerald-600/20",
  },
  {
    icon: FileText,
    title: "Tugas & Penilaian",
    description:
      "Buat tugas, terima pengumpulan, dan beri penilaian langsung dari dashboard. Efisien dan terstruktur.",
    color: "from-violet-500/30 to-purple-600/30",
    glow: "bg-violet-600/20",
  },
  {
    icon: BarChart3,
    title: "Laporan Real-time",
    description:
      "Pantau perkembangan santri dengan grafik dan laporan yang diperbarui secara otomatis setiap saat.",
    color: "from-orange-500/30 to-amber-600/30",
    glow: "bg-orange-600/20",
  },
  {
    icon: Users,
    title: "Multi-peran",
    description:
      "Admin, Ustadz, dan Wali Santri memiliki akses yang disesuaikan. Satu sistem untuk semua pihak.",
    color: "from-rose-500/30 to-pink-600/30",
    glow: "bg-rose-600/20",
  },
]

interface AuthCarouselProps {
  className?: string
}

export function AuthCarousel({ className }: AuthCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)

  useEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    api.on("select", () => setCurrent(api.selectedScrollSnap()))
  }, [api])

  return (
    <div
      className={cn(
        "relative hidden bg-gradient-to-br from-slate-800 to-slate-950 md:flex md:flex-col md:items-center md:justify-center overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] h-[55%] w-[55%] rounded-full bg-blue-600/15 blur-[90px]" />
        <div className="absolute bottom-[-15%] right-[-15%] h-[55%] w-[55%] rounded-full bg-purple-600/15 blur-[90px]" />
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-6 px-6 py-10">
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Sistem Manajemen Pesantren
          </p>
        </div>

        <Carousel
          setApi={setApi}
          opts={{ loop: true, align: "center" }}
          plugins={[Autoplay({ delay: 3500, stopOnInteraction: false })]}
          className="w-full max-w-xs"
        >
          <CarouselContent>
            {slides.map((slide, i) => (
              <CarouselItem key={i}>
                <div className="flex flex-col items-center gap-5 text-center px-2">
                  <div
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br border border-white/10 shadow-lg",
                      slide.color
                    )}
                  >
                    <slide.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white">{slide.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-400">
                      {slide.description}
                    </p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => api?.scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === current
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
        </div>

        <p className="text-xs text-slate-500 text-center max-w-[200px]">
          Platform terpadu untuk manajemen santri, kelas, absensi, dan tugas.
        </p>
      </div>
    </div>
  )
}
