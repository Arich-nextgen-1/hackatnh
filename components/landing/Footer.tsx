'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    'Продукт': ['Возможности', 'Тарифы', 'Документация', 'Changelog'],
    'Компания': ['О нас', 'Блог', 'Карьера', 'Пресса'],
    'Поддержка': ['Центр помощи', 'Контакты', 'Статус системы'],
    'Правовые': ['Конфиденциальность', 'Условия использования', 'Cookies'],
  };

  return (
    <footer className="bg-[#172033] text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v12M2 8h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="8" cy="8" r="2.5" fill="white" />
                </svg>
              </div>
              <span className="font-semibold text-[17px] tracking-tight">
                MediRoute <span className="text-[#60A5FA]">AI</span>
              </span>
            </div>
            <p className="text-[13px] text-[#94A3B8] leading-relaxed max-w-[180px]">
              Умная маршрутизация пациентов в Казахстане.
            </p>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-[#64748B] uppercase tracking-widest mb-4">
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-[#94A3B8] hover:text-white transition-colors duration-150"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#64748B]">
            © {currentYear} MediRoute AI. Все права защищены. Казахстан.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-[#475569]">Не является медицинским советом</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-[#64748B]">Все системы в норме</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
