'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Shield, Clock } from 'lucide-react';

interface HeroSectionProps {
  onStart: () => void;
}

const floatingCards = [
  {
    id: 1,
    label: 'AI-анализ',
    value: '2.3 сек',
    sub: 'время обработки',
    color: '#2563EB',
    icon: Sparkles,
    delay: 0,
    x: 0,
    y: 0,
  },
  {
    id: 2,
    label: 'Клиники найдены',
    value: '14',
    sub: 'в вашем городе',
    color: '#06B6D4',
    icon: Shield,
    delay: 0.15,
    x: 20,
    y: 0,
  },
  {
    id: 3,
    label: 'Маршрут готов',
    value: '100%',
    sub: 'персонализация',
    color: '#059669',
    icon: Clock,
    delay: 0.3,
    x: 0,
    y: 0,
  },
];

const stats = [
  { value: '50 000+', label: 'пациентов' },
  { value: '340+', label: 'клиник' },
  { value: '98%', label: 'точность AI' },
];

export default function HeroSection({ onStart }: HeroSectionProps) {
  const handleScroll = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden gradient-hero">
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-40" />

      {/* Gradient orbs */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#2563EB] opacity-[0.06] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-20 w-[500px] h-[500px] rounded-full bg-[#06B6D4] opacity-[0.08] blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-20">
        {/* Nav */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-20"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="8" cy="8" r="2.5" fill="white" />
              </svg>
            </div>
            <span className="font-semibold text-[17px] text-[#172033] tracking-tight">
              MediRoute<span className="text-[#2563EB]"> AI</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {([
              ['Главная', 'hero'],
              ['Возможности', 'features'],
              ['FAQ', 'faq'],
            ] as const).map(([label, targetId]) => (
              <button
                key={targetId}
                onClick={() => handleScroll(targetId)}
                className="px-4 py-2 text-sm font-medium text-[#64748B] hover:text-[#172033] rounded-lg hover:bg-white/60 transition-all duration-150 cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            Начать бесплатно
          </motion.button>
        </motion.nav>

        {/* Hero content */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-primary text-xs font-semibold mb-6"
            >
              <Sparkles size={12} />
              Powered by AI • Казахстан
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl lg:text-6xl xl:text-[68px] font-bold text-[#172033] leading-[1.08] tracking-tight mb-6"
            >
              Умная
              <br />
              <span className="text-[#2563EB]">медицинская</span>
              <br />
              маршрутизация
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="text-lg text-[#64748B] leading-relaxed mb-10 max-w-[440px]"
            >
              MediRoute AI анализирует ваш медицинский профиль и за секунды
              подбирает оптимальный маршрут лечения — от первичной консультации
              до реабилитации.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-3 mb-14"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStart}
                className="btn-primary flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold"
              >
                Начать бесплатно
                <ArrowRight size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onStart}
                className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-medium text-[#172033] bg-white border border-[#DCE5EE] hover:border-[#B8CADF] shadow-[0_1px_3px_0_rgb(0,0,0,0.08)] transition-all"
              >
                Перейти в приложение
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex items-center gap-8"
            >
              {stats.map((stat, i) => (
                <div key={i} className="flex flex-col">
                  <span className="text-2xl font-bold text-[#172033] tracking-tight">
                    {stat.value}
                  </span>
                  <span className="text-xs text-[#64748B] font-medium mt-0.5">
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — illustration + floating cards */}
          <div className="relative hidden lg:flex items-center justify-center">
            {/* Main illustration card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="relative w-[420px] h-[420px]"
            >
              {/* Central SVG illustration */}
              <div className="absolute inset-0 flex items-center justify-center">
                <MedicalIllustration />
              </div>

              {/* Floating stat cards */}
              {floatingCards.map((card, i) => {
                const positions = [
                  { top: '8%', left: '-12%' },
                  { top: '50%', right: '-14%', transform: 'translateY(-50%)' },
                  { bottom: '8%', left: '10%' },
                ];
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.6 + card.delay,
                    }}
                    style={positions[i]}
                    className="absolute glass rounded-2xl px-4 py-3 shadow-card-md min-w-[140px]"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                      style={{ background: `${card.color}1A` }}
                    >
                      <card.icon size={14} style={{ color: card.color }} />
                    </div>
                    <div className="text-[11px] text-[#64748B] font-medium mb-0.5">
                      {card.label}
                    </div>
                    <div
                      className="text-xl font-bold tracking-tight"
                      style={{ color: card.color }}
                    >
                      {card.value}
                    </div>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5">
                      {card.sub}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MedicalIllustration() {
  return (
    <svg
      width="380"
      height="380"
      viewBox="0 0 380 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background circle */}
      <circle cx="190" cy="190" r="165" fill="#EEF3F8" />
      <circle cx="190" cy="190" r="140" fill="#F8FAFC" stroke="#DCE5EE" strokeWidth="1.5" />

      {/* Outer ring dashes */}
      <circle cx="190" cy="190" r="160" stroke="#DCE5EE" strokeWidth="1" strokeDasharray="4 8" />

      {/* Cross / plus medical symbol */}
      <rect x="168" y="130" width="44" height="120" rx="10" fill="#2563EB" opacity="0.12" />
      <rect x="130" y="168" width="120" height="44" rx="10" fill="#2563EB" opacity="0.12" />
      <rect x="172" y="136" width="36" height="108" rx="8" fill="#2563EB" opacity="0.3" />
      <rect x="136" y="172" width="108" height="36" rx="8" fill="#2563EB" opacity="0.3" />
      <rect x="174" y="140" width="32" height="100" rx="7" fill="#2563EB" opacity="0.7" />
      <rect x="140" y="174" width="100" height="32" rx="7" fill="#2563EB" opacity="0.7" />

      {/* Heart pulse line */}
      <path
        d="M90 220 L130 220 L145 200 L160 240 L175 190 L185 220 L200 220 L215 210 L225 230 L245 220 L290 220"
        stroke="#06B6D4"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.7"
      />

      {/* Nodes */}
      <circle cx="145" cy="200" r="4" fill="#06B6D4" opacity="0.6" />
      <circle cx="175" cy="190" r="4" fill="#2563EB" opacity="0.6" />
      <circle cx="215" cy="210" r="4" fill="#06B6D4" opacity="0.6" />

      {/* Decorative small circles */}
      <circle cx="300" cy="120" r="18" fill="#06B6D4" opacity="0.12" />
      <circle cx="300" cy="120" r="10" fill="#06B6D4" opacity="0.2" />
      <circle cx="80" cy="280" r="14" fill="#2563EB" opacity="0.12" />
      <circle cx="80" cy="280" r="8" fill="#2563EB" opacity="0.2" />
      <circle cx="320" cy="280" r="10" fill="#059669" opacity="0.15" />
      <circle cx="60" cy="150" r="8" fill="#F59E0B" opacity="0.2" />

      {/* DNA-like curved lines */}
      <path d="M330 90 Q340 130 330 170 Q320 210 330 250" stroke="#DCE5EE" strokeWidth="2" fill="none" />
      <path d="M338 90 Q348 130 338 170 Q328 210 338 250" stroke="#DCE5EE" strokeWidth="2" fill="none" />

      {/* Connecting dots on DNA */}
      {[105, 130, 155, 180, 205, 230].map((y, i) => (
        <line
          key={i}
          x1="330"
          y1={y}
          x2="338"
          y2={y}
          stroke="#B8CADF"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}
