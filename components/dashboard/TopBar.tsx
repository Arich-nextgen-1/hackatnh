'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Search, Menu } from 'lucide-react';
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
  onMenuToggle: () => void;
}

export default function TopBar({ onMenuToggle }: TopBarProps) {
  const pathname = usePathname();
  const { profile } = useProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [hasNotif] = useState(true);

  const title = pageTitles[pathname] ?? 'MediRoute AI';

  return (
    <header className="h-14 bg-card border-b border-[#DCE5EE] flex items-center px-4 lg:px-6 gap-4 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        id="topbar-menu-toggle"
        className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#EEF3F8] transition-colors"
      >
        <Menu size={18} />
      </button>

      {/* Page title */}
      <h1 className="text-sm font-semibold text-[#172033] hidden sm:block shrink-0">
        {title}
      </h1>

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            id="topbar-search"
            type="text"
            placeholder="Поиск клиник, симптомов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full input-field pl-9 pr-4 py-2 rounded-xl text-sm h-9"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <button
          id="topbar-notifications"
          className="relative w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#EEF3F8] transition-colors"
        >
          <Bell size={16} />
          {hasNotif && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#2563EB] border-2 border-card" />
          )}
        </button>

        {/* User avatar */}
        {profile && (
          <div className="flex items-center gap-2.5 pl-2 border-l border-[#DCE5EE]">
            <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold">
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
