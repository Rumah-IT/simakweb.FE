import { Database, Layout, BookOpen, ArrowRight } from 'lucide-react';

export default function Beranda() {
  const cards = [
    {
      title: "Diagram Database",
      icon: <Database className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors" />,
      bg: "from-cyan-600/20 to-cyan-900/40",
      border: "border-purple-500/20",
      delay: "animation-delay-100",
      link: "https://dbdiagram.io/e/69e583b40aa78f6bc11159d4/69e584500aa78f6bc1115fc1"
    },
    {
      title: "Sketsa UI",
      icon: <Layout className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />,
      bg: "from-purple-600/20 to-purple-900/40",
      border: "border-purple-500/20",
      delay: "animation-delay-200",
      link: "#"
    },
    {
      title: "Link Swagger",
      icon: <BookOpen className="w-8 h-8 text-emerald-400 group-hover:text-emerald-300 transition-colors" />,
      bg: "from-emerald-600/20 to-emerald-900/40",
      border: "border-purple-500/20",
      delay: "animation-delay-300",
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
      
      <div className="max-w-6xl w-full z-10 relative">
        <header className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-medium text-slate-300 tracking-wide uppercase">Developer Portal</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-tight">
            Knowledge <span className="font-light italic text-slate-500">&</span> Documentation
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Akses cepat ke aset pengembangan penting. Desain, struktur data, dan panduan API tersedia dalam satu tempat sentral untuk kemudahan akses dan produktivitas tim.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {cards.map((card, index) => (
            <a 
              key={index}
              href={card.link}
              className={`group relative rounded-3xl p-1 bg-gradient-to-b ${card.bg} border-t ${card.border} hover:scale-[1.02] transition-all duration-300 shadow-xl overflow-hidden`}
            >
              <div className="h-full w-full rounded-[23px] bg-slate-900/80 backdrop-blur-xl p-8 flex flex-col items-start border border-white/5">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                  {card.icon}
                </div>
                
                <h3 className="text-2xl font-semibold mb-3 text-slate-100 group-hover:text-white">{card.title}</h3>

                <div className="mt-auto flex items-center gap-2 text-sm font-medium text-slate-300 group-hover:text-white transition-colors duration-300">
                  <span>Telusuri Modul</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
