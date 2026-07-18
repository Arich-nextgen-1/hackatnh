'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  MessageSquare,
  Building2,
  Dumbbell,
  History,
  User,
  X,
  LogOut,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useRouter } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Главная', icon: Home },
  { href: '/dashboard/consultation', label: 'AI Консультация', icon: MessageSquare },
  { href: '/dashboard/clinics', label: 'Клиники', icon: Building2 },
  { href: '/dashboard/rehabilitation', label: 'Реабилитация', icon: Dumbbell },
  { href: '/dashboard/history', label: 'История', icon: History },
  { href: '/dashboard/profile', label: 'Профиль', icon: User },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile, removeProfile } = useProfile();
  const router = useRouter();

  const handleLogout = () => {
    removeProfile();
    router.push('/');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 h-screen bg-card border-r border-[#DCE5EE] shrink-0">
        <SidebarContent
          navItems={navItems}
          isActive={isActive}
          profile={profile}
          onLogout={handleLogout}
          onClose={onClose}
          isMobile={false}
        />
      </aside>

      {/* Mobile sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -260 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        className="fixed top-0 left-0 z-40 flex flex-col w-60 h-screen bg-card border-r border-[#DCE5EE] lg:hidden shadow-xl"
      >
        <SidebarContent
          navItems={navItems}
          isActive={isActive}
          profile={profile}
          onLogout={handleLogout}
          onClose={onClose}
          isMobile={true}
        />
      </motion.aside>
    </>
  );
}

function SidebarContent({
  navItems,
  isActive,
  profile,
  onLogout,
  onClose,
  isMobile,
}: {
  navItems: NavItem[];
  isActive: (href: string) => boolean;
  profile: ReturnType<typeof useProfile>['profile'];
  onLogout: () => void;
  onClose: () => void;
  isMobile: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[#DCE5EE]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="8" cy="8" r="2.5" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-[15px] text-[#172033] tracking-tight">
            MediRoute<span className="text-[#2563EB]"> AI</span>
          </span>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#EEF3F8] transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="flex flex-col gap-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium nav-link ${
                  active ? 'active' : ''
                }`}
              >
                <item.icon
                  size={16}
                  className={active ? 'text-[#2563EB]' : 'text-[#94A3B8]'}
                />
                {item.label}
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-[#2563EB]"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-[#DCE5EE]">
        {profile && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#EEF3F8] transition-colors cursor-default mb-1">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#172033] truncate">
                {profile.name}
              </div>
              <div className="text-[11px] text-[#94A3B8]">{profile.city}</div>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs text-[#64748B] hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={13} />
          Выйти из профиля
        </button>
      </div>
    </div>
  );
}
