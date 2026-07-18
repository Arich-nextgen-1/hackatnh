'use client';

import { motion } from 'framer-motion';
import { History, Sparkles } from 'lucide-react';

export default function HistoryView() {
  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full bg-card rounded-2xl border border-[#DCE5EE] shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] p-10 text-center"
      >
        {/* Icon */}
        <div className="relative inline-flex mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF3F8] border border-[#DCE5EE] flex items-center justify-center">
            <History size={28} className="text-[#94A3B8]" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full gradient-primary flex items-center justify-center">
            <Sparkles size={11} className="text-white" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#172033] mb-2.5">
          История пуста
        </h2>
        <p className="text-sm text-[#64748B] leading-relaxed mb-6 max-w-sm mx-auto">
          Ваши консультации с AI и результаты маршрутизации будут отображаться
          здесь после подключения AI-модуля.
        </p>

        {/* Decorative placeholder items */}
        <div className="flex flex-col gap-2.5 mb-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#EEF3F8] border border-[#DCE5EE]"
              style={{ opacity: 1 - i * 0.2 }}
            >
              <div className="w-8 h-8 rounded-lg bg-[#DCE5EE] animate-pulse" />
              <div className="flex-1 text-left">
                <div className="h-2.5 w-3/4 rounded bg-[#DCE5EE] mb-1.5 animate-pulse" />
                <div className="h-2 w-1/2 rounded bg-[#E8EFF5] animate-pulse" />
              </div>
              <div className="h-2 w-12 rounded bg-[#DCE5EE] animate-pulse" />
            </div>
          ))}
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs font-medium text-amber-700">
            История появится после подключения AI
          </span>
        </div>
      </motion.div>
    </div>
  );
}
