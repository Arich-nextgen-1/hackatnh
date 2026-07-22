'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Activity, Shield, Clock, Zap, MessageSquare, Heart, RefreshCw, AlertCircle, Stethoscope, Building2, HeartPulse, Route, UserRound, Star, MapPin, Bookmark, Phone, Navigation2, X, AlertTriangle, CheckCircle, CheckCircle2, Smartphone, FileDown } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { getGrokRoutingResponse, GrokMessage } from '@/services/grok';
import clinicsData from '@/data/clinics.json';
import rehabsData from '@/data/rehabilitation.json';
import dynamic from 'next/dynamic';
import { buildGoogleMapsUrl, getDistanceFromHub } from '@/lib/maps';
import { sanitizeRoute } from '@/services/grok';
import { generateAndPrintPDF } from '@/lib/pdfGenerator';

import { useRouter } from 'next/navigation';

const DashboardMap = dynamic(() => import('./DashboardMap'), {
  ssr: false,
});

const quickActions = [
  { label: 'Боль в колене после падения', icon: Activity },
  { label: 'Давление повышено уже месяц', icon: Zap },
  { label: 'Сильные боли в пояснице', icon: Shield },
  { label: 'Головная боль и головокружение', icon: Clock },
];

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

function TypewriterText({ text, speed = 25 }: { text?: string | null; speed?: number }) {
  // Fully defensive: guard against undefined/null/non-string values
  const safeText = (text === null || text === undefined) ? '' : String(text).replace(/\bundefined\b/gi, '').trim();
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    const words = safeText.split(' ');
    setDisplayed('');
    let idx = 0;
    if (words.length === 0 || (words.length === 1 && words[0] === '')) return;
    const timer = setInterval(() => {
      if (idx < words.length) {
        const word = words[idx] ?? '';
        setDisplayed((prev) => (prev ? prev + ' ' + word : word));
        idx++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [safeText, speed]);

  return <p className="text-sm leading-relaxed whitespace-pre-line">{displayed}</p>;
}

function cleanUndefined(text: any): string {
  if (text === null || text === undefined) return '';
  const s = String(text);
  // Strip standalone literal 'undefined' (the JS keyword leaked into strings)
  // Use word boundary so we don't mangle other words
  return s
    .replace(/\bundefined\b/gi, '')
    .replace(/[ \t]+$/gm, '') // trim trailing spaces per line
    .replace(/^[ \t]+/gm, '') // trim leading spaces per line
    .replace(/\n{3,}/g, '\n\n') // collapse triple+ newlines
    .trim();
}

export default function HomeView() {
  const { profile } = useProfile();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<GrokMessage[]>([]);
  const [isActiveChat, setIsActiveChat] = useState(false);
  const [grokError, setGrokError] = useState<string | null>(null);
  // Structured route recommendation parsed from AI response
  const [currentRoute, setCurrentRoute] = useState<any | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  
  // Custom states for MedRoute premium UI features
  const [thinkStep, setThinkStep] = useState(0);
  const [activeClinicId, setActiveClinicId] = useState<string | null>(null);
  const [whyNotOpen, setWhyNotOpen] = useState<Record<string, boolean>>({});
  const [mobileViewTab, setMobileViewTab] = useState<'list' | 'map'>('list');
  const [showMapSheet, setShowMapSheet] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    }
  }, []);
  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  // Step-by-step AI Think Process interval — 6 steps
  useEffect(() => {
    let interval: any;
    if (loading) {
      setThinkStep(0);
      interval = setInterval(() => {
        setThinkStep((prev) => {
          if (prev < 5) return prev + 1;
          return prev;
        });
      }, 600);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Load favorites & last query on mount & check for restore requests
  useEffect(() => {
    try {
      const storedFavs = window.localStorage.getItem('mediroute_favorites');
      if (storedFavs) {
        setFavorites(JSON.parse(storedFavs));
      }
      const existing = window.localStorage.getItem('mediroute_history');
      if (existing) {
        const historyList = JSON.parse(existing);
        if (historyList.length > 0) {
          setLastQuery(historyList[0].query);
        }
      }
      // Check for restoration request
      const restoreItem = window.localStorage.getItem('mediroute_active_restore');
      if (restoreItem) {
        const item = JSON.parse(restoreItem);
        console.log('[Restore] raw item.response:', item.response);
        const restoredResponse = cleanUndefined(item.response ?? '');
        setChatHistory([
          { role: 'user', content: item.query ?? '' },
          { role: 'assistant', content: restoredResponse }
        ]);
        setIsActiveChat(true);
        setCurrentRoute(item.route);
        if (item.route?.clinics && item.route.clinics.length > 0) {
          setActiveClinicId(item.route.clinics[0]);
        }
        window.localStorage.removeItem('mediroute_active_restore');
      }
    } catch (e) {
      console.error('Error loading initial data:', e);
    }
  }, []);

  const toggleFavorite = (id: string) => {
    const updated = favorites.includes(id)
      ? favorites.filter(fId => fId !== id)
      : [...favorites, id];
    setFavorites(updated);
    window.localStorage.setItem('mediroute_favorites', JSON.stringify(updated));
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const sanitizeRoute = (route: any) => {
    if (!route) return null;
    return {
      specialist: typeof route.specialist === 'string' ? route.specialist : 'Терапевт',
      rehab_needed: !!route.rehab_needed,
      clinics: Array.isArray(route.clinics) ? route.clinics.map(String) : [],
      rehab_centers: Array.isArray(route.rehab_centers) ? route.rehab_centers.map(String) : [],
      confidence_score: typeof route.confidence_score === 'number' ? route.confidence_score : 90,
      confidence_reasons: Array.isArray(route.confidence_reasons) ? route.confidence_reasons.map(String) : ['симптомам', 'возрасту', 'анамнезу'],
      reasons: Array.isArray(route.reasons) ? route.reasons.map(String) : ['Требуется очная консультация специалиста.'],
      urgency: ['low', 'medium', 'high'].includes(route.urgency) ? route.urgency : 'medium',
      sources: Array.isArray(route.sources) ? route.sources.map(String) : ['Клинические рекомендации Министерства здравоохранения РК', 'База медицинских организаций'],
      excluded_specialists: Array.isArray(route.excluded_specialists)
        ? route.excluded_specialists.map((e: any) => ({
            specialist: typeof e?.specialist === 'string' ? e.specialist : 'Специалист',
            reason: typeof e?.reason === 'string' ? e.reason : 'Характер симптомов не указывает на патологию этого профиля.'
          }))
        : []
    };
  };

  const parseRouteContent = (content: string) => {
    // Remove literal word 'undefined' only (with word boundary so we don't break other words)
    // The AI sometimes appends "undefined" at the very end when it has no route to provide
    let sanitizedContent = typeof content === 'string' ? content : '';
    sanitizedContent = sanitizedContent
      .replace(/\bundefined\b/gi, '')
      .replace(/[ \t]+$/gm, '')  // trailing spaces per line
      .trim();

    const match = sanitizedContent.match(/<route>([\s\S]*?)<\/route>/);
    if (!match) return { cleanText: sanitizedContent, route: null };
    try {
      const routeData = JSON.parse(match[1].trim());
      const cleanText = sanitizedContent.replace(/<route>[\s\S]*?<\/route>/, '').trim();
      return { cleanText, route: sanitizeRoute(routeData) };
    } catch (e) {
      console.error('Failed to parse route JSON:', e);
      return { cleanText: sanitizedContent, route: null };
    }
  };

  // Start new routing session
  const handleStartConsultation = async () => {
    const query = description.trim();
    if (!query) return;

    setIsActiveChat(true);
    setLoading(true);
    setGrokError(null);
    setCurrentRoute(null);
    setActiveClinicId(null);

    const initialMessage: GrokMessage = { role: 'user', content: query };
    const updatedHistory = [initialMessage];
    setChatHistory(updatedHistory);
    setDescription('');

    try {
      const responseText = await getGrokRoutingResponse(updatedHistory, profile);
      const { cleanText, route } = parseRouteContent(responseText);

      console.log('--- Grok Consultation Response Log ---');
      console.log('Raw responseText:', responseText);
      console.log('Cleaned text (before cleanUndefined):', cleanText);
      console.log('Cleaned text (after cleanUndefined):', cleanUndefined(cleanText));
      console.log('Parsed Route:', route);
      console.log('---------------------------------------');

      setChatHistory([
        ...updatedHistory,
        { role: 'assistant', content: cleanText },
      ]);

      if (route) {
        const cleanRoute = sanitizeRoute(route) ?? route;
        setCurrentRoute(cleanRoute);
        saveToHistory(query, cleanText, cleanRoute);
        if (cleanRoute.clinics && cleanRoute.clinics.length > 0) {
          setActiveClinicId(cleanRoute.clinics[0]);
        }
      }
    } catch (error: any) {
      console.error(error);
      setGrokError(error.message || 'Ошибка подключения к AI. Убедитесь, что настроен API-ключ в .env.local.');
    } finally {
      setLoading(false);
    }
  };

  // Reply to clarifying questions
  const handleSendReply = async () => {
    const reply = description.trim();
    if (!reply || loading) return;

    setLoading(true);
    setGrokError(null);

    const replyMessage: GrokMessage = { role: 'user', content: reply };
    const updatedHistory = [...chatHistory, replyMessage];
    setChatHistory(updatedHistory);
    setDescription('');

    try {
      const responseText = await getGrokRoutingResponse(updatedHistory, profile);
      const { cleanText, route } = parseRouteContent(responseText);

      console.log('--- Grok Reply Response Log ---');
      console.log('Raw responseText:', responseText);
      console.log('Cleaned text (before cleanUndefined):', cleanText);
      console.log('Cleaned text (after cleanUndefined):', cleanUndefined(cleanText));
      console.log('Parsed Route:', route);
      console.log('--------------------------------');

      setChatHistory([
        ...updatedHistory,
        { role: 'assistant', content: cleanText },
      ]);

      if (route) {
        const cleanRoute = sanitizeRoute(route) ?? route;
        setCurrentRoute(cleanRoute);
        // Find the very first user message for history preview
        const firstQuery = updatedHistory.find(m => m.role === 'user')?.content || reply;
        saveToHistory(firstQuery, cleanText, cleanRoute);
        if (cleanRoute.clinics && cleanRoute.clinics.length > 0) {
          setActiveClinicId(cleanRoute.clinics[0]);
        }
      }
    } catch (error: any) {
      console.error(error);
      setGrokError(error.message || 'Ошибка подключения к AI.');
    } finally {
      setLoading(false);
    }
  };

  // Save successful routing to LocalStorage history
  const saveToHistory = (query: string, response: string, route: any) => {
    try {
      const existing = window.localStorage.getItem('mediroute_history');
      const historyList = existing ? JSON.parse(existing) : [];
      
      const newItem = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        query,
        response,
        route,
      };

      window.localStorage.setItem('mediroute_history', JSON.stringify([newItem, ...historyList]));
      setLastQuery(query);
    } catch (e) {
      console.error('Error saving history:', e);
    }
  };

  const handleReset = () => {
    setChatHistory([]);
    setIsActiveChat(false);
    setCurrentRoute(null);
    setGrokError(null);
    setMobileViewTab('list');
    setDescription('');
    setActiveClinicId(null);
  };

  // Recommended clinics/rehab elements
  const recommendedClinics = currentRoute?.clinics
    ? clinicsData.filter((c: any) => currentRoute.clinics.includes(c.id))
    : [];

  const recommendedRehabs = currentRoute?.rehab_needed && currentRoute?.rehab_centers
    ? rehabsData.filter((r: any) => currentRoute.rehab_centers.includes(r.id))
    : [];

  // Map markers for recommended organizations
  const mapMarkers = [
    ...recommendedClinics.map((c: any) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      rating: c.rating,
      lat: c.lat,
      lng: c.lng,
      type: c.type as 'public' | 'private',
    })),
    ...recommendedRehabs.map((r: any) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      rating: r.rating,
      lat: r.lat,
      lng: r.lng,
      type: 'rehab' as const,
    })),
  ];

  const mapCenter: [number, number] = activeClinicId
    ? (() => {
        const activeItem = mapMarkers.find(m => m.id === activeClinicId);
        return activeItem ? [activeItem.lat, activeItem.lng] : [42.33, 69.61];
      })()
    : mapMarkers.length > 0
      ? [mapMarkers[0].lat, mapMarkers[0].lng]
      : [42.33, 69.61]; // Shymkent default

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Dynamic Keyframes Styling for Shimmers and Marker Glows */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-block {
          background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />

      {/* Top PWA Banner (Visible at the very top of main page in Web & Mobile) */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between bg-gradient-to-r from-blue-50/90 via-white to-blue-50/50 border border-blue-100 rounded-[18px] px-5 py-3 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0">
            <Smartphone size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0F172A] flex items-center gap-2">
              MediRoute AI App
              {isInstalled ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Скачано ✓</span>
              ) : (
                <span className="text-[10px] bg-blue-100 text-[#2563EB] px-2 py-0.5 rounded-full font-bold">PWA Офлайн</span>
              )}
            </div>
            <div className="text-[11.5px] text-[#64748B] font-medium">
              {isInstalled ? 'Приложение установлено и готово к работе без интернета' : 'Установите приложение для мгновенного доступа к маршрутам оффлайн'}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (typeof window !== 'undefined' && (window as any).deferredPrompt) {
              (window as any).deferredPrompt.prompt();
            } else {
              alert('Для установки добавьте сайт на Экран "Домой" в меню браузера.');
            }
          }}
          className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${
            isInstalled 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-sm'
          }`}
          style={{ minHeight: 'unset', minWidth: 'unset' }}
        >
          {isInstalled ? 'Скачано ✓' : 'Установить'}
        </button>
      </motion.div>

      {/* Welcome header (only when not chatting) */}
      {!isActiveChat && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <p className="text-sm text-[#64748B] font-medium mb-1">
            {greeting()},{' '}
            <span className="text-[#172033]">{profile?.name?.split(' ')[0] ?? 'Пользователь'}</span>
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold text-[#172033] tracking-tight mb-4">
            Как вы себя чувствуете?
          </h2>

        </motion.div>
      )}

      {/* Main consultation screen */}
      <div className="flex flex-col gap-6">
        {isActiveChat ? (
          /* Active Chat Flow */
          <div className="flex flex-col gap-5">
            {/* Timeline Progress Stepper */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-card rounded-2xl border border-[#DCE5EE] p-4 shadow-sm flex items-center justify-between overflow-x-auto gap-2 scrollbar-none"
            >
              {[
                { label: 'Изучаю симптомы...', icon: MessageSquare },
                { label: 'Определяю специалиста...', icon: Stethoscope },
                { label: 'Подбираю подходящие клиники...', icon: Building2 },
                { label: 'Сравниваю рейтинг...', icon: Star },
                { label: 'Проверяю расписание...', icon: Clock },
                { label: 'Формирую маршрут...', icon: Route },
              ].map((step, idx) => {
                let isCompleted = false;
                let isActive = false;
                
                if (currentRoute) {
                  if (idx <= 3) isCompleted = true;
                  if (idx === 4) isActive = true;
                  if (idx === 5) {
                    isCompleted = currentRoute.rehab_needed;
                    isActive = !currentRoute.rehab_needed;
                  }
                } else {
                  isCompleted = idx === 0;
                  isActive = idx === 1;
                }
                
                return (
                  <div key={idx} className="flex items-center gap-1.5 shrink-0">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-500 text-white' 
                          : isActive 
                            ? 'bg-[#2563EB] border-[#2563EB] text-white animate-pulse' 
                            : 'bg-[#EEF3F8] border-[#DCE5EE] text-[#94A3B8]'
                      }`}>
                        <step.icon size={13} />
                      </div>
                      <span className={`text-[10px] font-semibold tracking-tight whitespace-nowrap ${
                        isCompleted ? 'text-emerald-600' : isActive ? 'text-[#2563EB] font-bold' : 'text-gray-400'
                      }`}>{step.label}</span>
                    </div>
                    {idx < 5 && (
                      <div className={`h-[2px] w-4 sm:w-8 rounded ${
                        isCompleted ? 'bg-emerald-400' : 'bg-[#DCE5EE]'
                      }`} />
                    )}
                  </div>
                );
              })}
            </motion.div>

            {/* Analyzed clinics stats — shows after route is ready */}
            {currentRoute && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-[#EEF3F8] border border-[#DCE5EE] rounded-2xl px-5 py-3 text-xs text-[#64748B]"
              >
                <Sparkles size={13} className="text-[#2563EB] shrink-0" />
                <span>
                  Проанализировано{' '}
                  <strong className="text-[#172033]">{clinicsData.length} клиник</strong>
                  {' — '}
                  <strong className="text-green-600">{clinicsData.filter((c: any) => c.type === 'public' || c.ownership === 'public').length} государственных</strong>
                  {' и '}
                  <strong className="text-[#2563EB]">{clinicsData.filter((c: any) => c.type === 'private' || c.ownership === 'private').length} частных</strong>.
                  {' Выбрана оптимальная.'}
                </span>
              </motion.div>
            )}
            <div className="flex flex-col gap-2.5">
              {chatHistory.map((msg, index) => {
                const isLastMessage = index === chatHistory.length - 1;
                const safeContent = cleanUndefined(msg.content);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className={`flex items-end gap-2 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="hidden sm:flex w-7 h-7 rounded-full bg-[#E0EEFF] items-center justify-center shrink-0 mb-1 shadow-sm">
                        <Sparkles size={12} className="text-[#2563EB]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#007AFF] text-white rounded-2xl rounded-br-sm'
                          : 'bg-[#E9E9EB] text-[#1C1C1E] rounded-2xl rounded-bl-sm'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <>
                          <div className="text-[10px] font-bold text-[#007AFF] mb-1">MediRoute AI</div>
                          {isLastMessage && !loading ? (
                            <TypewriterText text={safeContent} />
                          ) : (
                            <p className="whitespace-pre-line">{safeContent}</p>
                          )}
                          <p className="text-[10px] text-gray-500 font-medium mt-2 pt-2 border-t border-[#DCE5EE]/40 leading-relaxed">
                            AI не заменяет врача и не ставит диагноз. Рекомендации носят исключительно информационный характер.
                          </p>
                        </>
                      ) : (
                        <p className="whitespace-pre-line text-white">{safeContent}</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="hidden sm:flex w-7 h-7 rounded-full bg-gradient-to-tr from-[#007AFF] to-[#00C6FF] items-center justify-center text-white text-xs font-bold shrink-0 mb-1 shadow-sm">
                        {profile?.name?.charAt(0).toUpperCase() ?? 'П'}
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {/* Loading AI State with Shimmer Skeletons and Steps */}
              {loading && (
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#EEF3F8] border border-[#DCE5EE] flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                      <Sparkles size={14} className="text-[#2563EB]" />
                    </div>
                    <div className="bg-card rounded-2xl border border-[#DCE5EE] p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] w-full max-w-[85%] flex flex-col gap-4">
                      {/* Animated steps */}
                      <div className="flex flex-col gap-2.5">
                        {[
                          'Анализирую ваши симптомы...',
                          'Определяю подходящего специалиста...',
                          'Анализирую медицинские организации...',
                          'Сравниваю подходящие клиники...',
                          'Проверяю режим работы...',
                          'Формирую оптимальный маршрут...'
                        ].map((text, idx) => {
                          const isCompleted = thinkStep > idx;
                          const isActive = thinkStep === idx;
                          return (
                            <div key={idx} className="flex items-center gap-2.5 text-xs transition-all duration-300">
                              {isCompleted ? (
                                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500 font-bold shrink-0">✓</motion.span>
                              ) : isActive ? (
                                <div className="w-3 h-3 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin shrink-0" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 shrink-0" />
                              )}
                              <span className={`${isCompleted ? 'text-emerald-600 font-medium' : isActive ? 'text-[#2563EB] font-bold animate-pulse' : 'text-gray-400'}`}>
                                {text}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Shimmer skeleton lines */}
                      <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-[#EEF3F8]">
                        <div className="h-3.5 w-11/12 rounded shimmer-block" />
                        <div className="h-3.5 w-3/4 rounded shimmer-block" />
                        <div className="h-3.5 w-5/6 rounded shimmer-block" />
                      </div>

                      <div className="text-[10px] text-gray-400 text-center font-medium animate-pulse mt-2">
                        Анализ занимает обычно 5–10 секунд
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error messages */}
              {grokError && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle size={14} className="text-red-500" />
                  </div>
                  <div className="bg-red-50 text-red-700 rounded-2xl border border-red-100 px-4 py-3 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] text-sm">
                    {grokError}
                  </div>
                </div>
              )}
              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* Structured Routing Result Block (Паспорт маршрута пациента) */}
            {currentRoute && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col gap-5"
              >
                {/* Emergency Banner */}
                {currentRoute.urgency === 'high' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-red-800">Требуется срочная помощь</h4>
                        <p className="text-xs text-red-600 leading-relaxed mt-0.5">
                          Рекомендуем немедленно обратиться в службу скорой помощи (103) или в приемный покой больницы.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                      <a href="tel:103" className="flex-1 sm:flex-initial text-center bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all">Позвонить 103</a>
                      <button 
                        onClick={() => {
                          const hosp = clinicsData.find(c => c.id === '1' || c.id === '4');
                          if (hosp) {
                            setActiveClinicId(hosp.id);
                          }
                        }} 
                        className="flex-1 sm:flex-initial text-center bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                      >
                        Ближайшие больницы
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="bg-[#F8FAFC] border border-[#DCE5EE] rounded-3xl p-6 flex flex-col gap-6">
                  {/* Status header with Urgency & Confidence gauge */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border ${
                        currentRoute.urgency === 'high' 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : currentRoute.urgency === 'medium'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          currentRoute.urgency === 'high' ? 'bg-red-500 animate-pulse' : currentRoute.urgency === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                        {currentRoute.urgency === 'high' 
                          ? '🔴 Срочно' 
                          : currentRoute.urgency === 'medium'
                            ? '🟡 Желательно сегодня'
                            : '🟢 Планово'}
                      </span>
                    </div>

                    {/* Confidence gauge circle */}
                    <div className="flex items-center gap-2.5 bg-white p-2 px-3 rounded-2xl border border-[#DCE5EE] shadow-sm shrink-0">
                      <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="18" cy="18" r="14" stroke="#EEF3F8" strokeWidth="2.5" fill="transparent" />
                          <circle cx="18" cy="18" r="14" stroke="#2563EB" strokeWidth="2.5" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 14}
                            strokeDashoffset={2 * Math.PI * 14 * (1 - (currentRoute.confidence_score ?? 90) / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute text-[9px] font-black text-[#172033]">{(currentRoute.confidence_score ?? 90)}%</span>
                      </div>
                      <div>
                        <div className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider leading-none mb-0.5">Соответствие симптомам</div>
                        <div className="text-[9.5px] text-gray-500 leading-tight">По: <span className="font-semibold text-gray-700">{(currentRoute.confidence_reasons ?? ['симптомам', 'возрасту', 'анамнезу']).join(', ')}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Boarding Pass (Ticket) */}
                  <div className={`bg-white border-2 border-dashed rounded-3xl p-5 relative overflow-hidden shadow-sm flex flex-col gap-4 ${
                    currentRoute.urgency === 'high'
                      ? 'border-red-200'
                      : currentRoute.urgency === 'medium'
                        ? 'border-amber-200'
                        : 'border-[#DCE5EE]'
                  }`}>
                    {/* Watermark styling */}
                    <div className="flex items-center justify-between border-b border-[#EEF3F8] pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-[#2563EB] flex items-center justify-center text-white text-[10px] font-bold">MR</div>
                        <span className="text-xs font-black text-gray-800 tracking-wider">MEDROUTE AI</span>
                      </div>
                      <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest bg-[#EEF3F8] px-2 py-0.5 rounded">МАРШРУТ ПАЦИЕНТА</span>
                    </div>

                    {/* Document Details Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Пациент</div>
                        <div className="font-bold text-gray-800 mt-0.5 truncate">{profile?.name ?? 'Пользователь'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Возраст / Пол</div>
                        <div className="font-semibold text-gray-800 mt-0.5">{profile?.age ?? '—'} л / {profile?.gender === 'male' ? 'Муж' : 'Жен'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Специалист</div>
                        <div className="font-bold text-blue-600 mt-0.5">{currentRoute.specialist || 'Специалист'}</div>
                      </div>
                      <div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Дата выдачи</div>
                        <div className="font-semibold text-gray-800 mt-0.5">{new Date().toLocaleDateString('ru-RU')}</div>
                      </div>
                    </div>

                    {/* Decision Reasons */}
                    <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#DCE5EE] flex flex-col gap-2">
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Обоснование выбора маршрута:</div>
                      <div className="flex flex-col gap-1.5">
                        {(currentRoute.reasons ?? [
                          'Симптомы указывают на необходимость профильного осмотра.',
                          'Боль возникла под влиянием внешних факторов.',
                          'Требуется диагностическое подтверждение специалиста.'
                        ]).map((reason: string, ri: number) => (
                          <div key={ri} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                            <span className="text-blue-500 font-bold shrink-0 mt-0.5">✓</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>



                    {/* Next step */}
                    <div className="flex items-center justify-between border-t border-dashed border-[#DCE5EE] pt-3">
                      <div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase leading-none">Рекомендуемый шаг</div>
                        <div className="text-xs font-bold text-gray-800 mt-1">Проложите маршрут и посетите клинику</div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-xl border border-emerald-100 uppercase tracking-wider">
                        Маршрут готов
                      </div>
                    </div>
                  </div>



                  {/* Recommended Clinics with Categorized Badges */}
                  {recommendedClinics.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEF3F8] pb-3">
                        <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Сравнительный анализ клиник</h4>
                        <span className="hidden sm:inline text-[9.5px] font-semibold text-[#2563EB]">Кликните на карточку, чтобы подсветить на карте</span>
                      </div>

                      {/* Clinics List Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {recommendedClinics.map((clinic: any, ci: number) => {
                          const badgeText = ci === 0 ? 'Лучший вариант' : ci === 1 ? 'Альтернатива' : 'Ближайшая';
                          const badgeClass = ci === 0 
                            ? 'bg-blue-600 text-white' 
                            : ci === 1 
                              ? 'bg-purple-100 text-purple-700 border-purple-200' 
                              : 'bg-cyan-100 text-cyan-700 border-cyan-200';

                          return (
                            <motion.div 
                              key={clinic.id} 
                              whileHover={{ y: -5, scale: 1.02 }}
                              onClick={() => setActiveClinicId(clinic.id)}
                              className={`bg-white border rounded-2xl p-5 flex flex-col justify-between relative shadow-sm cursor-pointer transition-all duration-300 active:scale-[0.98] min-h-[44px] ${
                                activeClinicId === clinic.id ? 'border-blue-600 bg-blue-50/10 shadow-md scale-[1.01]' : 'border-[#DCE5EE]'
                              }`}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(clinic.id); }}
                                className="absolute top-3.5 right-3.5 text-[#94A3B8] hover:text-red-500 transition-colors p-1"
                                style={{ minWidth: '32px', minHeight: '32px' }}
                              >
                                <Heart size={15} className={favorites.includes(clinic.id) ? 'fill-red-500 text-red-500' : ''} />
                              </button>
                              
                              <div>
                                <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeClass}`}>
                                  {badgeText}
                                </span>
                                
                                <h4 className="text-sm font-bold text-[#172033] mt-2 mb-1 leading-tight line-clamp-1">{clinic.name ?? 'Клиника'}</h4>
                                <p className="text-[11px] text-[#64748B] line-clamp-2 mb-3">{clinic.description ?? 'Медицинское учреждение'}</p>
                                
                                {/* Dynamic explanation bullet points */}
                                <div className="flex flex-col gap-1.5 text-[10px] text-gray-500 font-medium pb-2 border-t border-[#EEF3F8] pt-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-500 font-bold">✓</span>
                                    <span>Принимает {currentRoute.specialist || 'специалиста'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-500 font-bold">✓</span>
                                    <span>Рейтинг {clinic.rating?.toFixed(1) ?? '—'} ({clinic.reviewCount ?? 0} отз.)</span>
                                  </div>
                                  {clinic.lat && (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-emerald-500 font-bold">✓</span>
                                      <span>{getDistanceFromHub(clinic.lat, clinic.lng)} км · ≈ {Math.ceil(getDistanceFromHub(clinic.lat, clinic.lng) / 0.5)} мин</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-500 font-bold">✓</span>
                                    <span>{clinic.workingHours}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-blue-600">
                                    <span className="text-blue-500 font-bold">✓</span>
                                    <span>Запись онлайн</span>
                                  </div>
                                </div>

                                {/* Why not this clinic toggle for alternatives (ci > 0) */}
                                {ci > 0 && (
                                  <div className="mt-2.5 pt-2.5 border-t border-[#EEF3F8]">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setWhyNotOpen(prev => ({ ...prev, [clinic.id]: !prev[clinic.id] }));
                                      }}
                                      className="w-full flex items-center justify-between text-xs text-gray-500 font-bold hover:text-red-500 transition-colors py-1"
                                    >
                                      <span>Почему не эта?</span>
                                      <span className="text-[8px]">{whyNotOpen[clinic.id] ? '▲' : '▼'}</span>
                                    </button>
                                    {whyNotOpen[clinic.id] && (
                                      <div className="mt-2 p-2.5 rounded-xl bg-red-50 border border-red-100 flex flex-col gap-1.5 text-[10px] text-red-700 animate-fadeIn">
                                        <div className="flex items-start gap-1">
                                          <span className="font-bold shrink-0">•</span>
                                          <span>Находится дальше от Вашего местоположения (+{(getDistanceFromHub(clinic.lat, clinic.lng) - getDistanceFromHub(recommendedClinics[0].lat, recommendedClinics[0].lng)).toFixed(1)} км)</span>
                                        </div>
                                        {clinic.rating < recommendedClinics[0].rating && (
                                          <div className="flex items-start gap-1">
                                            <span className="font-bold shrink-0">•</span>
                                            <span>Рейтинг ниже ({clinic.rating.toFixed(1)} vs {recommendedClinics[0].rating.toFixed(1)})</span>
                                          </div>
                                        )}
                                        {clinic.load === 'high' && (
                                          <div className="flex items-start gap-1">
                                            <span className="font-bold shrink-0">•</span>
                                            <span>Высокая текущая загрузка клиники</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Google Maps route + rating */}
                              <div className="flex items-center justify-between text-[10px] text-[#94A3B8] border-t border-[#F1F5F9] pt-2.5 mt-auto">
                                <span className="flex items-center gap-0.5"><Star size={10} className="fill-yellow-500 text-yellow-500" /> {(clinic.rating ?? 0).toFixed(1)}</span>
                                {clinic.lat && (
                                  <a
                                    href={buildGoogleMapsUrl(clinic.lat, clinic.lng, clinic.address)}
                                    target="_blank" rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 text-[#2563EB] font-bold hover:underline py-1 px-2 bg-blue-50 rounded-lg"
                                  >
                                    <Navigation2 size={10} /> Маршрут
                                  </a>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Map: button on mobile, always visible on desktop */}
                      {mapMarkers.length > 0 && (
                        <>
                          {/* Desktop map — always shown */}
                          <div className="hidden sm:block h-80 rounded-3xl overflow-hidden border border-[#DCE5EE] bg-[#EEF3F8] relative mt-2 shadow-sm">
                            <div className="absolute top-3 left-3 z-10 bg-white/92 backdrop-blur px-3 py-2 rounded-xl text-[10.5px] font-bold text-gray-700 shadow-sm flex items-center gap-1 border border-white/50">
                              <MapPin size={11} className="text-[#2563EB]" /> Шымкент
                            </div>
                            <DashboardMap center={mapCenter} markers={mapMarkers} activeMarkerId={activeClinicId} onSelectMarker={(id) => setActiveClinicId(id)} />
                          </div>

                          {/* Mobile: show map button — fixed floating above bottom nav */}
                          <button
                            type="button"
                            onClick={() => setShowMapSheet(true)}
                            className="sm:hidden fixed bottom-24 left-4 right-4 z-30 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#2563EB] text-white font-bold text-sm shadow-xl active:scale-[0.98] transition-all"
                          >
                            <MapPin size={16} />
                            Показать карту
                          </button>

                          {/* Mobile map bottom sheet */}
                          {showMapSheet && (
                            <div className="fixed inset-0 z-50 flex flex-col justify-end sm:hidden" onClick={() => setShowMapSheet(false)}>
                              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                              <div
                                className="relative z-10 bg-white rounded-t-3xl overflow-hidden"
                                style={{ height: '88vh' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                      <MapPin size={15} className="text-[#2563EB]" />
                                    </div>
                                    <span className="font-bold text-[#172033] text-sm">Клиники на карте</span>
                                  </div>
                                  <button
                                    onClick={() => setShowMapSheet(false)}
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg"
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="h-full">
                                  <DashboardMap center={mapCenter} markers={mapMarkers} activeMarkerId={activeClinicId} onSelectMarker={(id) => { setActiveClinicId(id); setShowMapSheet(false); }} />
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Rehabilitation centers */}
                  {currentRoute.rehab_needed && recommendedRehabs.length > 0 && (
                    <div className="flex flex-col gap-3 border-t border-[#DCE5EE] pt-5">
                      <div className="text-xs font-bold text-[#0891B2]">Необходима реабилитация. Профильные центры:</div>
                      <div className="grid sm:grid-cols-3 gap-3">
                        {recommendedRehabs.map((rehab: any) => (
                          <div key={rehab.id} className="bg-white border border-[#DCE5EE] rounded-2xl p-4 flex flex-col justify-between relative shadow-sm">
                            <button
                              onClick={() => toggleFavorite(rehab.id)}
                              className="absolute top-3 right-3 text-[#94A3B8] hover:text-red-500 transition-colors"
                            >
                              <Heart size={14} className={favorites.includes(rehab.id) ? 'fill-red-500 text-red-500' : ''} />
                            </button>
                            <div>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-600">
                                Реабилитация
                              </span>
                              <h4 className="text-xs font-bold text-[#172033] mt-2 mb-1 leading-tight line-clamp-1">{rehab.name}</h4>
                              <p className="text-[10px] text-[#64748B] line-clamp-2 mb-3">{rehab.description}</p>
                            </div>
                            <div>
                              <div className="flex items-center justify-between text-[10px] text-[#94A3B8] border-t border-[#F1F5F9] pt-2">
                                <span className="flex items-center gap-0.5"><Star size={10} className="fill-yellow-500 text-yellow-500" /> {rehab.rating}</span>
                                <span className="truncate max-w-[70px]">{rehab.address}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Step card */}
                  {currentRoute && !loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 bg-[#2563EB] rounded-2xl px-5 py-4 text-white shadow-lg shadow-blue-200"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <ArrowRight size={18} className="text-white" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-0.5">Следующий шаг</div>
                        <div className="text-sm font-bold">
                          Запишитесь к {currentRoute.specialist || 'специалисту'} — желательно сегодня.
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Что взять с собой */}
                  {currentRoute && !loading && (
                    <div className="bg-[#FFFBEB] border border-amber-100 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Что взять с собой</div>
                      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                        {[
                          'Удостоверение личности / паспорт',
                          'Медицинская страховка (ОСМС)',
                          'Направление от врача (если есть)',
                          'Список принимаемых лекарств',
                          'Результаты предыдущих анализов',
                          'Медицинская карта / выписки',
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-amber-900">
                            <span className="text-amber-500 font-bold shrink-0">✓</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid sm:grid-cols-2 gap-3 border-t border-gray-100 pt-5">
                    {recommendedClinics[0] && (
                      <a 
                        href={buildGoogleMapsUrl(recommendedClinics[0].lat, recommendedClinics[0].lng, recommendedClinics[0].address)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all text-center"
                      >
                        <Navigation2 size={14} /> Открыть в Google Maps
                      </a>
                    )}
                    <a 
                      href={`tel:${recommendedClinics[0]?.phone || '103'}`}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-[#DCE5EE] hover:bg-[#EEF3F8]/50 text-gray-700 rounded-2xl text-xs font-bold transition-all text-center"
                    >
                      <Phone size={14} className="text-[#2563EB]" /> Позвонить
                    </a>
                  </div>

                  {/* Authority sources list */}
                  <div className="bg-[#EEF3F8]/40 border border-[#DCE5EE] rounded-2xl p-4 flex flex-col gap-2 mt-2">
                    <div className="text-[9px] text-[#94A3B8] font-bold uppercase tracking-wider leading-none">Рекомендация сформирована на основе:</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1">
                      {(currentRoute.sources ?? [
                        'Клинические рекомендации Министерства здравоохранения РК',
                        'Профиль пользователя (анамнез, возраст, противопоказания)',
                        'База верифицированных медицинских организаций Шымкента',
                        'Географическое расположение и доступность'
                      ]).map((source: string, si: number) => (
                        <div key={si} className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{source}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Save route + New consultation row */}
            {currentRoute && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-center gap-3"
              >
                <button
                  onClick={() => {
                    const history = JSON.parse(localStorage.getItem('mediroute_history') || '[]');
                    history.unshift({ route: currentRoute, date: new Date().toISOString(), query: lastQuery });
                    localStorage.setItem('mediroute_history', JSON.stringify(history.slice(0, 20)));
                    alert('Маршрут сохранён в историю.');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all"
                >
                  <CheckCircle size={14} /> Сохранить маршрут
                </button>
                <button
                  onClick={() => {
                    const topClinic = recommendedClinics[0] as any;
                    generateAndPrintPDF({
                      patientName: profile?.name,
                      patientAge: profile?.age,
                      date: new Date().toISOString(),
                      query: lastQuery || chatHistory.find(m => m.role === 'user')?.content || '',
                      specialist: currentRoute?.specialist || 'Специалист',
                      confidenceScore: currentRoute?.confidence_score,
                      urgency: currentRoute?.urgency,
                      reasons: currentRoute?.reasons,
                      clinic: topClinic ? {
                        name: topClinic.name,
                        address: topClinic.address,
                        phone: topClinic.phone,
                        rating: topClinic.rating,
                        distance: topClinic.lat ? getDistanceFromHub(topClinic.lat, topClinic.lng) : undefined,
                      } : undefined,
                    });
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all"
                >
                  <FileDown size={14} /> Скачать PDF
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-[#DCE5EE] bg-white hover:bg-[#EEF3F8]/50 text-gray-600 text-xs font-bold transition-all"
                >
                  <RefreshCw size={14} /> Начать новую консультацию
                </button>
              </motion.div>
            )}

            {/* Conversation reply box */}
            <div className="bg-card rounded-2xl border border-[#DCE5EE] shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] p-4 flex flex-col gap-3">
              <textarea
                placeholder={currentRoute ? "Задайте дополнительный вопрос..." : "Ответьте на вопросы AI..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full input-field rounded-xl px-4 py-2.5 text-sm resize-none leading-relaxed font-sans"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && description.trim()) handleSendReply();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-[#172033] transition-colors"
                >
                  <RefreshCw size={12} />
                  Новый запрос
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={!description.trim() || loading}
                  className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Отправить <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Premium Hero Redesign */
          <div className="flex flex-col gap-8 pb-8">

            {/* Main Hero Card Container */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative w-full bg-white border border-[#E8EDF7] shadow-[0_4px_30px_rgba(15,23,42,0.04)] rounded-[24px] overflow-hidden p-6 lg:p-10"
            >
              {/* Subtle background glow & wallpaper overlay */}
              <div 
                className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none bg-no-repeat bg-cover bg-right"
                style={{ backgroundImage: `url('/images/hero-bg.png')` }}
              />
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-100/50 via-cyan-50/30 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                
                {/* LEFT COLUMN (60% ~ 7 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                  <div>
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#2563EB] border border-blue-100 mb-4">
                      <Sparkles size={13} />
                      MediRoute AI Assistant
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-[1.15]">
                      Как мы можем помочь сегодня?
                    </h1>
                    <p className="text-base text-[#64748B] mt-3 leading-relaxed font-normal">
                      Опишите симптомы, и AI подберёт специалиста, клинику и оптимальный маршрут лечения.
                    </p>
                  </div>

                  {/* Textarea Input */}
                  <div className="relative">
                    <textarea
                      placeholder="Например: болит колено после падения, температура 37.5°C..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="w-full bg-[#F7FAFF] border border-[#E8EDF7] rounded-[20px] p-4 text-base text-[#0F172A] placeholder-[#94A3B8] resize-none focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                    />
                  </div>

                  {/* Button & Privacy Info */}
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleStartConsultation}
                      disabled={!description.trim() || loading}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-[18px] text-base font-bold text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-md"
                      style={{ minHeight: '52px' }}
                    >
                      Начать анализ →
                    </button>

                    <div className="flex items-center justify-center gap-1.5 text-[11.5px] text-[#94A3B8] font-medium">
                      <Shield size={13} className="text-[#2563EB] shrink-0" />
                      <span>Ваши данные защищены и используются только для построения маршрута лечения.</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN (40% ~ 5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-5">

                  {/* Illustration Container with glass effect */}
                  <div className="relative w-full h-44 rounded-[20px] bg-gradient-to-br from-[#E0EEFF] via-[#EEF3F8] to-[#F7FAFF] border border-[#E8EDF7] overflow-hidden flex items-center justify-center shadow-inner">
                    <img 
                      src="/images/hero-bg.png" 
                      alt="Medical AI" 
                      className="absolute inset-0 w-full h-full object-cover opacity-85 mix-blend-multiply"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent" />
                    
                    {/* Floating elements overlay */}
                    <div className="relative z-10 flex items-center justify-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-md shadow-md border border-white/80 flex items-center justify-center text-[#2563EB] animate-bounce" style={{ animationDuration: '3s' }}>
                        <Stethoscope size={24} />
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] shadow-lg text-white flex items-center justify-center font-black text-2xl">
                        +
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-md shadow-md border border-white/80 flex items-center justify-center text-emerald-500 animate-pulse">
                        <HeartPulse size={24} />
                      </div>
                    </div>
                  </div>

                  {/* Elegant Timeline Card */}
                  <div className="bg-white/90 backdrop-blur-sm border border-[#E8EDF7] rounded-[20px] p-5 shadow-sm">
                    <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider mb-3.5">
                      Ваш путь к здоровью
                    </h4>

                    <div className="flex flex-col gap-2.5">
                      {[
                        { label: 'Анализ симптомов', done: true },
                        { label: 'Подбор специалиста', done: true },
                        { label: 'Поиск клиники', done: true },
                        { label: 'Маршрут лечения', done: false },
                        { label: 'Начало лечения', done: false },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 text-xs">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            item.done 
                              ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' 
                              : 'bg-[#F1F5F9] text-[#94A3B8] border border-[#E8EDF7]'
                          }`}>
                            {item.done ? '✓' : '○'}
                          </span>
                          <span className={item.done ? 'text-[#0F172A] font-semibold' : 'text-[#94A3B8] font-normal'}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#EEF3F8] text-[11px] text-[#64748B] font-medium text-center">
                      Мы рядом на каждом этапе.
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>

            {/* Statistics Strip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              {[
                { val: '24+', label: 'Клиник' },
                { val: '12+', label: 'Специалистов' },
                { val: '98%', label: 'Точность алгоритма' },
                { isShield: true, title: 'Ваше здоровье', subtitle: 'Наш приоритет' },
              ].map((stat, i) => (
                <div 
                  key={i} 
                  className="bg-white border border-[#E8EDF7] rounded-[20px] p-4 flex flex-col justify-center items-center text-center shadow-sm"
                >
                  {stat.isShield ? (
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
                        <Shield size={20} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0F172A]">{stat.title}</div>
                        <div className="text-[11px] text-[#64748B] font-medium">{stat.subtitle}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-extrabold text-[#2563EB] tracking-tight">{stat.val}</div>
                      <div className="text-xs text-[#64748B] font-medium mt-0.5">{stat.label}</div>
                    </>
                  )}
                </div>
              ))}
            </motion.div>

            {/* Popular Clinics — full width */}
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">
                  Популярные клиники
                </h3>
                <button 
                  onClick={() => router.push('/dashboard/clinics')} 
                  className="text-xs font-semibold text-[#2563EB] hover:underline"
                  style={{ minHeight: 'unset', minWidth: 'unset' }}
                >
                  Все клиники →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {clinicsData.slice(0, 4).map((clinic: any) => (
                  <div
                    key={clinic.id}
                    onClick={() => router.push('/dashboard/clinics')}
                    className="bg-white border border-[#E8EDF7] hover:border-[#DBEAFE] hover:shadow-md rounded-[18px] p-4 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-[#F7FAFF] border border-[#E8EDF7] flex items-center justify-center text-[#2563EB]">
                        <Building2 size={16} />
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        <span className="text-[11px] font-bold text-amber-600">{clinic.rating}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#0F172A] truncate">{clinic.name}</div>
                      <div className="text-[11px] text-[#94A3B8] font-medium mt-1 flex items-center gap-1">
                        <MapPin size={10} />
                        <span>{clinic.address ? clinic.address.split(',')[0] : 'Шымкент'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom update notice */}
            <div className="text-center text-[11px] text-[#94A3B8] pt-2">
              Данные клиник обновлены: Июль 2026 · MediRoute AI
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

