'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

const faqs = [
  {
    q: 'Как MediRoute AI подбирает клинику?',
    a: 'Алгоритм анализирует ваш медицинский профиль (возраст, хронические заболевания, аллергии), описанные симптомы и геолокацию, затем ранжирует клиники по специализации, рейтингу, доступности и расстоянию.',
  },
  {
    q: 'Мои медицинские данные в безопасности?',
    a: 'На данном этапе все данные хранятся исключительно в вашем браузере (LocalStorage) и не передаются на серверы. В будущем будет реализовано шифрование уровня AES-256 и соответствие стандартам HIPAA.',
  },
  {
    q: 'Платформа заменяет врача?',
    a: 'Нет. MediRoute AI — это навигационный инструмент, который помогает найти нужного специалиста. Все медицинские решения принимаются исключительно врачами. Платформа ускоряет путь к правильному специалисту.',
  },
  {
    q: 'В каких городах работает сервис?',
    a: 'Сейчас сервис охватывает Шымкент с базой из 340+ медицинских учреждений. В ближайшие кварталы планируется расширение на Алматы, Астану и другие крупные города Казахстана.',
  },
  {
    q: 'Можно ли использовать MediRoute AI без создания профиля?',
    a: 'Базовый поиск клиник доступен без профиля. Однако для персонализированной маршрутизации, учёта аллергий и хронических заболеваний необходимо создать медицинский профиль — это занимает менее 2 минут.',
  },
  {
    q: 'Когда появится реальный AI?',
    a: 'Интеграция AI-движка на основе больших языковых моделей с медицинской специализацией запланирована на Q3 2025. Сейчас платформа работает в режиме «умной фильтрации» по структурированным параметрам.',
  },
];

function FAQItem({ q, a, isOpen, onToggle }: { q: string; a: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-colors duration-200 ${
        isOpen ? 'border-[#2563EB]/30 bg-white' : 'border-[#DCE5EE] bg-white hover:border-[#B8CADF]'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-[#172033] text-[15px]">{q}</span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            isOpen ? 'bg-[#2563EB] text-white' : 'bg-[#EEF3F8] text-[#64748B]'
          }`}
        >
          <Plus size={16} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          >
            <div className="px-6 pb-5 text-[#64748B] text-sm leading-relaxed border-t border-[#EEF3F8] pt-4">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-28 bg-[#F8FAFC]">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full badge-primary text-xs font-semibold mb-4">
            FAQ
          </div>
          <h2 className="text-4xl font-bold text-[#172033] tracking-tight mb-4">
            Часто задаваемые вопросы
          </h2>
          <p className="text-[#64748B]">
            Не нашли ответ? Напишите нам — ответим в течение часа.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col gap-3"
        >
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              q={faq.q}
              a={faq.a}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
