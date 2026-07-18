'use client';

import { motion } from 'framer-motion';
import { Brain, MapPin, Activity, Navigation } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Подбор специалиста',
    description:
      'Опишите симптомы — поможем определить, к какому врачу обратиться и что уточнить перед посещением.',
    color: '#2563EB',
    bg: 'rgb(37 99 235 / 0.08)',
    highlights: ['Анализ симптомов', 'Уточняющие вопросы', 'Чёткая рекомендация'],
  },
  {
    icon: MapPin,
    title: 'Поиск клиники',
    description:
      'Подбор медицинского учреждения по вашему профилю, рейтингу и расположению — с фильтрами и картой.',
    color: '#06B6D4',
    bg: 'rgb(6 182 212 / 0.08)',
    highlights: ['Рейтинги и отзывы', 'Фильтр по специализации', 'Интерактивная карта'],
  },
  {
    icon: Activity,
    title: 'Реабилитация',
    description:
      'Поиск реабилитационных центров после лечения. Сравнение программ восстановления и подбор по диагнозу.',
    color: '#059669',
    bg: 'rgb(5 150 105 / 0.08)',
    highlights: ['Постоперационная', 'Неврологическая', 'Детская реабилитация'],
  },
  {
    icon: Navigation,
    title: 'Маршрут пациента',
    description:
      'Полный путь от первого обращения до записи — специалист, клиника, реабилитация в едином последовательном плане.',
    color: '#7C3AED',
    bg: 'rgb(124 58 237 / 0.08)',
    highlights: ['Единый маршрут', 'Персонализация', 'История обращений'],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#EEF3F8] to-[#F8FAFC]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-accent text-xs font-semibold mb-4">
            Возможности платформы
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#172033] tracking-tight mb-4">
            Что умеет MediRoute
          </h2>
          <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
            От описания симптомов до записи в клинику — MediRoute AI берёт на себя
            всю сложность медицинской навигации.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={item}
              whileHover={{ y: -4, boxShadow: '0 20px 40px -10px rgb(23 32 51 / 0.12)' }}
              className="bg-card rounded-2xl p-7 border border-[#DCE5EE] shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] card-hover cursor-default"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: feature.bg }}
              >
                <feature.icon size={22} style={{ color: feature.color }} />
              </div>

              <h3 className="text-lg font-semibold text-[#172033] mb-3">
                {feature.title}
              </h3>
              <p className="text-[#64748B] text-sm leading-relaxed mb-5">
                {feature.description}
              </p>

              <div className="flex flex-col gap-2">
                {feature.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: feature.color }}
                    />
                    <span className="text-xs font-medium text-[#64748B]">{h}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
