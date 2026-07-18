'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Activity, Shield, Clock, Zap } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

const quickActions = [
  { label: 'Боль в груди', icon: Activity },
  { label: 'Давление', icon: Zap },
  { label: 'Спина', icon: Shield },
  { label: 'Головная боль', icon: Clock },
];

export default function HomeView() {
  const { profile } = useProfile();
  const [description, setDescription] = useState('');
  const [showStub, setShowStub] = useState(false);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const handleContinue = () => {
    if (!description.trim()) return;
    setShowStub(true);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <p className="text-sm text-[#64748B] font-medium mb-1">
          {greeting()},{' '}
          <span className="text-[#172033]">{profile?.name?.split(' ')[0] ?? 'Пользователь'}</span>
        </p>
        <h2 className="text-2xl lg:text-3xl font-bold text-[#172033] tracking-tight">
          Как вы себя чувствуете?
        </h2>
      </motion.div>

      {/* Main consultation card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="bg-card rounded-2xl border border-[#DCE5EE] shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] p-6 mb-6"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#172033]">AI Консультация</div>
            <div className="text-xs text-[#64748B]">Опишите ситуацию — AI подберёт маршрут</div>
          </div>
        </div>

        <textarea
          id="home-description"
          placeholder="Опишите ваши симптомы или вопрос... Например: у меня боли в правом боку уже 3 дня, температура 37.5°C."
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (showStub) setShowStub(false);
          }}
          rows={4}
          className="w-full input-field rounded-xl px-4 py-3.5 text-sm resize-none mb-4 leading-relaxed"
        />

        {/* Quick chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setDescription((prev) =>
                  prev ? `${prev} ${action.label.toLowerCase()}` : action.label
                );
                setShowStub(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748B] bg-[#EEF3F8] hover:bg-[#E2EBF4] hover:text-[#172033] transition-all border border-transparent hover:border-[#DCE5EE]"
            >
              <action.icon size={11} />
              {action.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-[#94A3B8]">
            {description.length}/1000 символов
          </span>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleContinue}
            disabled={!description.trim()}
            id="home-continue-btn"
            className={`btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold ${
              !description.trim() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Продолжить
            <ArrowRight size={15} />
          </motion.button>
        </div>
      </motion.div>

      {/* AI stub */}
      <AnimatePresence>
        {showStub && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-2xl border border-[#2563EB]/20 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] p-6 mb-6"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EEF3F8] border border-[#DCE5EE] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles size={16} className="text-[#2563EB]" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#172033] mb-1.5">
                  MediRoute AI
                </div>
                <div className="text-sm text-[#64748B] leading-relaxed mb-3">
                  Анализ вашего запроса получен. В данный момент AI-модуль находится в
                  стадии интеграции.
                </div>
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#EEF3F8] border border-[#DCE5EE]">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-medium text-[#64748B]">
                    Анализ станет доступен после подключения AI
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-4"
      >
        {[
          { label: 'Клиник в базе', value: '340+', color: '#2563EB' },
          { label: 'Реабилитационных центров', value: '48', color: '#06B6D4' },
          { label: 'Консультаций сегодня', value: '—', color: '#64748B' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl border border-[#DCE5EE] px-4 py-4 shadow-[0_1px_2px_0_rgb(0,0,0,0.04)]"
          >
            <div
              className="text-2xl font-bold tracking-tight mb-0.5"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <div className="text-xs text-[#64748B] font-medium">{stat.label}</div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
