'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Save, Check, Clock, ArrowRight, Stethoscope } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { UserProfile } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function ProfileView() {
  const { profile, updateProfile } = useProfile();
  const router = useRouter();
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) setForm(profile);
  }, [profile]);

  // Load last consultation preview
  const [lastConsult, setLastConsult] = useState<any | null>(null);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('mediroute_history');
      if (stored) {
        const historyList = JSON.parse(stored);
        if (historyList.length > 0) {
          setLastConsult(historyList[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleOpenLastConsult = () => {
    if (!lastConsult) return;
    window.localStorage.setItem('mediroute_active_restore', JSON.stringify(lastConsult));
    router.push('/dashboard');
  };

  const update = (key: keyof UserProfile, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    if (!profile) return;
    updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inputCls =
    'w-full input-field rounded-xl px-4 py-3 text-sm';

  if (!profile) return null;

  const sections = [
    {
      title: 'Основная информация',
      fields: [
        {
          label: 'Полное имя',
          key: 'name' as keyof UserProfile,
          type: 'text',
          placeholder: 'Иван Иванов',
        },
        {
          label: 'Город',
          key: 'city' as keyof UserProfile,
          type: 'text',
          placeholder: 'Шымкент',
        },
      ],
    },
    {
      title: 'Физические параметры',
      fields: [
        {
          label: 'Возраст',
          key: 'age' as keyof UserProfile,
          type: 'number',
          placeholder: '35',
        },
        {
          label: 'Рост (см)',
          key: 'height' as keyof UserProfile,
          type: 'number',
          placeholder: '175',
        },
        {
          label: 'Вес (кг)',
          key: 'weight' as keyof UserProfile,
          type: 'number',
          placeholder: '70',
        },
      ],
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-7"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white text-lg font-bold shadow-md">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#172033]">{profile.name}</h2>
            <p className="text-xs text-[#64748B]">Профиль пациента</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
          <User size={12} />
          <span>ID: {profile.id.slice(0, 8)}</span>
        </div>
      </motion.div>

      <div className="flex flex-col gap-5">
        {/* Section cards */}
        {sections.map((section, si) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.07 }}
            className="bg-card rounded-2xl border border-[#DCE5EE] shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] p-6"
          >
            <h3 className="text-sm font-semibold text-[#172033] mb-4">{section.title}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
                    {field.label}
                  </label>
                  <input
                    id={`profile-field-${field.key}`}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form[field.key] as string | number) ?? ''}
                    onChange={(e) =>
                      update(
                        field.key,
                        field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                      )
                    }
                    className={inputCls}
                  />
                </div>
              ))}

              {/* Gender (only in first section) */}
              {si === 0 && (
                <div>
                  <label className="text-xs font-medium text-[#64748B] mb-1.5 block">
                    Пол
                  </label>
                  <select
                    id="profile-field-gender"
                    value={(form.gender as string) ?? 'male'}
                    onChange={(e) => update('gender', e.target.value)}
                    className={inputCls}
                  >
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                    <option value="other">Другой</option>
                  </select>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Medical card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="bg-card rounded-2xl border border-[#DCE5EE] shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] p-6"
        >
          <h3 className="text-sm font-semibold text-[#172033] mb-4">Медицинская информация</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-[#64748B] mb-1.5 block">Аллергии</label>
              <textarea
                id="profile-field-allergies"
                placeholder="Пенициллин, пыльца березы..."
                value={(form.allergies as string) ?? ''}
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
                id="profile-field-chronic"
                placeholder="Сахарный диабет 2 типа..."
                value={(form.chronicDiseases as string) ?? ''}
                onChange={(e) => update('chronicDiseases', e.target.value)}
                rows={3}
                className="w-full input-field rounded-xl px-4 py-3 text-sm resize-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Последняя консультация Card */}
        {lastConsult && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-card rounded-2xl border border-[#DCE5EE] shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-[#2563EB]" />
              <h3 className="text-sm font-semibold text-[#172033]">Последняя консультация</h3>
            </div>
            
            <div className="bg-[#F8FAFC] border border-[#DCE5EE] p-4 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] text-[#94A3B8] font-bold">
                <span>{lastConsult.date}</span>
                <span className="badge-primary px-2 py-0.5 rounded-full">{lastConsult.route?.specialist ?? 'Консультация'}</span>
              </div>
              <p className="text-xs font-bold text-[#172033] line-clamp-1">{lastConsult.query}</p>
              <p className="text-[11px] text-[#64748B] line-clamp-2 leading-relaxed">{lastConsult.response}</p>
            </div>

            <button
              onClick={handleOpenLastConsult}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-[#2563EB] bg-[#EEF3F8] hover:bg-[#E2EBF4] border border-[#DCE5EE] hover:border-[#B8CADF] transition-all"
            >
              Открыть в чате <ArrowRight size={13} />
            </button>
          </motion.div>
        )}

        {/* Meta info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.24 }}
          className="px-4 py-3 rounded-xl bg-[#EEF3F8] border border-[#DCE5EE] flex items-center justify-between"
        >
          <div className="text-xs text-[#94A3B8]">
            Создан: {new Date(profile.createdAt).toLocaleDateString('ru-RU')}
            {' · '}
            Обновлён: {new Date(profile.updatedAt).toLocaleDateString('ru-RU')}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-[#64748B]">Локально</span>
          </div>
        </motion.div>

        {/* Save button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleSave}
          id="profile-save-btn"
          className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
            saved
              ? 'bg-emerald-500 text-white shadow-[0_4px_14px_0_rgb(16_185_129_/_0.35)]'
              : 'btn-primary'
          }`}
        >
          {saved ? (
            <>
              <Check size={16} /> Сохранено
            </>
          ) : (
            <>
              <Save size={16} /> Сохранить изменения
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
