'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X, User, ChevronRight } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { UserProfile } from '@/lib/types';

interface OnboardingModalProps {
  onClose: () => void;
}

type FormData = Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>;

const defaultForm: FormData = {
  name: '',
  age: 0,
  gender: 'male',
  height: 0,
  weight: 0,
  allergies: '',
  chronicDiseases: '',
  city: 'Шымкент',
};

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const router = useRouter();
  const { saveProfile } = useProfile();
  const [form, setForm] = useState<FormData>(defaultForm);
  const [step, setStep] = useState<1 | 2>(1);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const update = (key: keyof FormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateStep1 = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Введите имя';
    if (!form.age || form.age < 1 || form.age > 120) e.age = 'Некорректный возраст';
    if (!form.city.trim()) e.city = 'Введите город';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSave = () => {
    saveProfile(form);
    router.push('/dashboard');
  };

  const inputCls = (field: keyof FormData) =>
    `w-full input-field rounded-xl px-4 py-3 text-sm ${
      errors[field] ? 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgb(239_68_68_/_0.1)]' : ''
    }`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#172033]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        className="relative bg-card rounded-2xl shadow-xl w-full max-w-md border border-[#DCE5EE] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#DCE5EE]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-[#172033] text-[15px]">
                Медицинский профиль
              </h2>
              <p className="text-xs text-[#64748B]">
                Шаг {step} из 2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#172033] hover:bg-[#EEF3F8] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-[#EEF3F8]">
          <motion.div
            className="h-full gradient-primary"
            initial={{ width: '50%' }}
            animate={{ width: step === 1 ? '50%' : '100%' }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-4"
            >
              <p className="text-sm text-[#64748B] mb-2">
                Базовая информация для персонализации
              </p>

              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
                  Полное имя *
                </label>
                <input
                  id="profile-name"
                  type="text"
                  placeholder="Иван Иванов"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  className={inputCls('name')}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
                    Возраст *
                  </label>
                  <input
                    id="profile-age"
                    type="number"
                    placeholder="35"
                    min={1}
                    max={120}
                    value={form.age || ''}
                    onChange={(e) => update('age', parseInt(e.target.value) || 0)}
                    className={inputCls('age')}
                  />
                  {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
                    Пол *
                  </label>
                  <select
                    id="profile-gender"
                    value={form.gender}
                    onChange={(e) => update('gender', e.target.value)}
                    className={inputCls('gender')}
                  >
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                    <option value="other">Другой</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
                    Рост (см)
                  </label>
                  <input
                    id="profile-height"
                    type="number"
                    placeholder="175"
                    value={form.height || ''}
                    onChange={(e) => update('height', parseInt(e.target.value) || 0)}
                    className={inputCls('height')}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
                    Вес (кг)
                  </label>
                  <input
                    id="profile-weight"
                    type="number"
                    placeholder="70"
                    value={form.weight || ''}
                    onChange={(e) => update('weight', parseInt(e.target.value) || 0)}
                    className={inputCls('weight')}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
                  Город *
                </label>
                <input
                  id="profile-city"
                  type="text"
                  placeholder="Шымкент"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  className={inputCls('city')}
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <p className="text-sm text-[#64748B] mb-2">
                Медицинская информация (необязательно, улучшает точность AI)
              </p>

              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
                  Аллергии
                </label>
                <textarea
                  id="profile-allergies"
                  placeholder="Пенициллин, пыльца березы, морепродукты..."
                  value={form.allergies}
                  onChange={(e) => update('allergies', e.target.value)}
                  rows={3}
                  className="w-full input-field rounded-xl px-4 py-3 text-sm resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
                  Хронические заболевания
                </label>
                <textarea
                  id="profile-chronic"
                  placeholder="Сахарный диабет 2 типа, гипертония..."
                  value={form.chronicDiseases}
                  onChange={(e) => update('chronicDiseases', e.target.value)}
                  rows={3}
                  className="w-full input-field rounded-xl px-4 py-3 text-sm resize-none"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#EEF3F8] border border-[#DCE5EE]">
                <p className="text-xs text-[#64748B] leading-relaxed">
                  🔒 Все данные хранятся только в вашем браузере и не передаются
                  третьим лицам.
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-[#DCE5EE] flex items-center justify-between gap-3">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="text-sm text-[#64748B] hover:text-[#172033] transition-colors px-4 py-2.5 rounded-xl hover:bg-[#EEF3F8]"
            >
              Назад
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-sm text-[#64748B] hover:text-[#172033] transition-colors px-4 py-2.5 rounded-xl hover:bg-[#EEF3F8]"
            >
              Отмена
            </button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={step === 1 ? handleNext : handleSave}
            className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold"
          >
            {step === 1 ? (
              <>
                Далее <ChevronRight size={16} />
              </>
            ) : (
              'Войти в Dashboard'
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
