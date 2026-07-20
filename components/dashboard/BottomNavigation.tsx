'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageSquare, Building2, History, User } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/dashboard', label: 'Главная', icon: Home },
  { href: '/dashboard/consultation', label: 'Консультация', icon: MessageSquare },
  { href: '/dashboard/clinics', label: 'Клиники', icon: Building2 },
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-[#DCE5EE] lg:hidden pb-[calc(4px+env(safe-area-inset-bottom))] pt-2 px-2 shadow-lg">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 min-h-[44px] min-w-[44px] transition-all relative ${
                active ? 'text-[#2563EB] font-bold' : 'text-[#94A3B8]'
              }`}
            >
              <div className="flex flex-col items-center gap-0.5 select-none active:scale-90 transition-transform duration-100">
                <item.icon size={20} className={active ? 'text-[#2563EB]' : 'text-[#94A3B8]'} />
                <span className="text-[11px] leading-none mt-1">{item.label}</span>
              </div>
              {active && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute bottom-0 w-8 h-1 rounded-full bg-[#2563EB]"
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
