'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Building2, History, User, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/dashboard', label: 'Главная', icon: Home },
  { href: '/dashboard/clinics', label: 'Клиники', icon: Building2 },
  { href: '/dashboard/rehabilitation', label: 'Реабил.', icon: Activity },
  { href: '/dashboard/history', label: 'История', icon: History },
  { href: '/dashboard/profile', label: 'Профиль', icon: User },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-40 bg-white/92 backdrop-blur-2xl border border-white/60 rounded-[30px] lg:hidden shadow-[0_16px_48px_rgba(0,0,0,0.12)] px-2.5 py-3">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 min-h-[48px] transition-all relative ${
                active ? 'text-[#2563EB] font-black scale-105' : 'text-[#64748B]'
              }`}
            >
              <div className="flex flex-col items-center gap-1.5 select-none active:scale-95 transition-transform duration-100">
                <item.icon
                  size={26}
                  className={`transition-all ${
                    active ? 'text-[#2563EB] stroke-[2.5px] scale-110 drop-shadow-[0_2px_8px_rgba(37,99,235,0.2)]' : 'text-[#64748B] stroke-[2px]'
                  }`}
                />
                <span className={`text-[10px] tracking-tight transition-all font-bold ${active ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>
                  {item.label}
                </span>
              </div>
              {active && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute -bottom-1.5 w-6 h-1 rounded-full bg-[#2563EB]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
