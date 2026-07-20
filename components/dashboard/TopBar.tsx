'use client';

import { usePathname } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Главная',
  '/dashboard/consultation': 'AI Консультация',
  '/dashboard/clinics': 'Клиники',
  '/dashboard/rehabilitation': 'Реабилитационные центры',
  '/dashboard/history': 'История консультаций',
  '/dashboard/profile': 'Мой профиль',
};

interface TopBarProps {
  onMenuToggle?: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const pathname = usePathname();
  const { profile } = useProfile();

  const title = pageTitles[pathname] ?? 'MediRoute AI';

  return (
    <header className="h-16 bg-card border-b border-[#DCE5EE] flex items-center justify-between px-4 lg:px-6 gap-4 shrink-0 z-30 pt-[env(safe-area-inset-top)]">
      {/* Page title */}
      <h1 className="text-base font-bold text-[#172033] tracking-tight">
        {title}
      </h1>

      {/* User profile info */}
      <div className="flex items-center gap-2">
        {profile && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-[#DCE5EE]">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-medium text-[#172033] leading-none">{profile.name}</div>
              <div className="text-[11px] text-[#94A3B8] mt-0.5">Пациент</div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

