'use client';
import { useState, useEffect } from 'react';
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

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already in standalone (installed) mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Check if prompt is already stashed on window
    if ((window as any).deferredPrompt) {
      setInstallPrompt((window as any).deferredPrompt);
    }

    const onPrompt = () => {
      setInstallPrompt((window as any).deferredPrompt);
    };

    const onStatusChange = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('pwa_install_prompt_available', onPrompt);
    window.addEventListener('pwa_install_status_changed', onStatusChange);

    return () => {
      window.removeEventListener('pwa_install_prompt_available', onPrompt);
      window.removeEventListener('pwa_install_status_changed', onStatusChange);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    console.log(`[PWA] Install prompt user choice outcome: ${outcome}`);
    if (outcome === 'accepted') {
      (window as any).deferredPrompt = null;
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  };

  return (
    <header className="h-16 bg-card border-b border-[#DCE5EE] flex items-center justify-between px-4 lg:px-6 gap-4 shrink-0 z-30 pt-[env(safe-area-inset-top)]">
      {/* Page title */}
      <h1 className="text-base font-bold text-[#172033] tracking-tight">
        {title}
      </h1>

      {/* User profile info & PWA action */}
      <div className="flex items-center gap-3">
        {/* PWA Install Action */}
        {isInstalled ? (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
            Приложение установлено
          </span>
        ) : installPrompt ? (
          <button
            onClick={handleInstallClick}
            className="text-[10.5px] font-extrabold text-white bg-[#007AFF] hover:bg-[#0062CC] active:scale-[0.97] px-3.5 py-1.5 rounded-full transition-all shrink-0 shadow-sm"
          >
            Установить приложение
          </button>
        ) : null}

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

