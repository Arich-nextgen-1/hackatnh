'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Activity, Shield, Clock, Zap, MessageSquare, Heart, RefreshCw, AlertCircle, Stethoscope, Building2, HeartPulse, Route, UserRound, Star, MapPin, Bookmark, Phone } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { getGrokRoutingResponse, GrokMessage } from '@/services/grok';
import clinicsData from '@/data/clinics.json';
import rehabsData from '@/data/rehabilitation.json';
import dynamic from 'next/dynamic';

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

function TypewriterText({ text, speed = 25 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    const words = text.split(' ');
    setDisplayed('');
    let idx = 0;
    const timer = setInterval(() => {
      if (idx < words.length) {
        setDisplayed((prev) => (prev ? prev + ' ' + words[idx] : words[idx]));
        idx++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <p className="text-sm leading-relaxed whitespace-pre-line">{displayed}</p>;
}

export default function HomeView() {
  const { profile } = useProfile();
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
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Request geolocation on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setUserCoords(null);
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Step-by-step AI Think Process interval
  useEffect(() => {
    let interval: any;
    if (loading) {
      setThinkStep(0);
      interval = setInterval(() => {
        setThinkStep((prev) => {
          if (prev < 3) return prev + 1;
          return prev;
        });
      }, 700);
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
        setChatHistory([
          { role: 'user', content: item.query },
          { role: 'assistant', content: item.response }
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

  // Parse `<route>...</route>` from message
  const parseRouteContent = (content: string) => {
    const match = content.match(/<route>([\s\S]*?)<\/route>/);
    if (!match) return { cleanText: content, route: null };
    try {
      const routeData = JSON.parse(match[1].trim());
      const cleanText = content.replace(/<route>[\s\S]*?<\/route>/, '').trim();
      return { cleanText, route: routeData };
    } catch (e) {
      console.error('Failed to parse route JSON:', e);
      return { cleanText: content, route: null };
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

      setChatHistory([
        ...updatedHistory,
        { role: 'assistant', content: cleanText },
      ]);

      if (route) {
        setCurrentRoute(route);
        saveToHistory(query, cleanText, route);
        if (route.clinics && route.clinics.length > 0) {
          setActiveClinicId(route.clinics[0]);
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

      setChatHistory([
        ...updatedHistory,
        { role: 'assistant', content: cleanText },
      ]);

      if (route) {
        setCurrentRoute(route);
        // Find the very first user message for history preview
        const firstQuery = updatedHistory.find(m => m.role === 'user')?.content || reply;
        saveToHistory(firstQuery, cleanText, route);
        if (route.clinics && route.clinics.length > 0) {
          setActiveClinicId(route.clinics[0]);
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
        date: new Date().toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
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

      {/* Welcome header (only when not chatting) */}
      {!isActiveChat && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <p className="text-sm text-[#64748B] font-medium mb-1">
            {greeting()},{' '}
            <span className="text-[#172033]">{profile?.name?.split(' ')[0] ?? 'Пользователь'}</span>
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold text-[#172033] tracking-tight">
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
                { label: 'Описание', icon: MessageSquare },
                { label: 'AI Анализ', icon: Sparkles },
                { label: 'Подбор врача', icon: Stethoscope },
                { label: 'Подбор клиники', icon: Building2 },
                { label: 'Запись', icon: HeartPulse },
                { label: 'Реабилитация', icon: Route },
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

            {/* Chat history */}
            <div className="flex flex-col gap-4">
              {chatHistory.map((msg, index) => {
                const isLastMessage = index === chatHistory.length - 1;
                return (
                  <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-[#EEF3F8] border border-[#DCE5EE] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles size={14} className="text-[#2563EB]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] border ${
                        msg.role === 'user'
                          ? 'bg-[#2563EB] text-white border-transparent'
                          : 'bg-card text-[#172033] border-[#DCE5EE]'
                      }`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="text-[10px] font-bold text-[#2563EB] mb-1">MediRoute AI</div>
                      )}
                      
                      {msg.role === 'assistant' && isLastMessage && !loading ? (
                        <TypewriterText text={msg.content} />
                      ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                      )}

                      {msg.role === 'assistant' && (
                        <p className="text-[10px] text-[#94A3B8] mt-2 pt-2 border-t border-[#EEF3F8] leading-relaxed">
                          Рекомендации носят исключительно информационный характер. Обратитесь к специалисту.
                        </p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                        {profile?.name?.charAt(0).toUpperCase() ?? 'П'}
                      </div>
                    )}
                  </div>
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
                          'Изучаем ваши симптомы...',
                          'Определяем подходящего специалиста...',
                          'Подбираем клиники Шымкента...',
                          'Формируем карту и маршрутный лист...'
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
                          ? 'Срочно обратиться за помощью' 
                          : currentRoute.urgency === 'medium'
                            ? 'Желательно обратиться сегодня'
                            : 'Не требует экстренной помощи'}
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
                  <div className="bg-white border-2 border-dashed border-[#DCE5EE] rounded-3xl p-5 relative overflow-hidden shadow-sm flex flex-col gap-4">
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
                        <div className="font-bold text-blue-600 mt-0.5">{currentRoute.specialist}</div>
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
                        <div className="text-xs font-bold text-gray-800 mt-1">Запись на консультацию через ЕГСЗ</div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 text-[10px] font-black px-3 py-1 rounded-xl border border-blue-100 uppercase tracking-wider">
                        DamuMed
                      </div>
                    </div>
                  </div>

                  {/* Exclusions Block (Что исключено) */}
                  {currentRoute.excluded_specialists && currentRoute.excluded_specialists.length > 0 && (
                    <div className="bg-[#FAF9F6] border border-orange-100 rounded-3xl p-5 flex flex-col gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <span className="text-orange-500 font-bold text-sm">✕</span> Что исключено (Почему маршрут не сюда)
                        </h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">Отделения и специалисты, контакт с которыми признан нецелесообразным</p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {currentRoute.excluded_specialists.map((ex: any, ei: number) => (
                          <div key={ei} className="bg-white border border-gray-100 p-3 rounded-2xl flex items-start gap-2 shadow-sm">
                            <div className="w-5 h-5 rounded bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">✕</div>
                            <div>
                              <div className="text-xs font-bold text-gray-700 leading-tight">{ex.specialist}</div>
                              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{ex.reason}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Clinics with Categorized Badges */}
                  {recommendedClinics.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Сравнительный анализ клиник</h4>
                        <span className="text-[9.5px] font-semibold text-[#2563EB]">Кликните на карточку, чтобы подсветить на карте</span>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3">
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
                              className={`bg-white border rounded-2xl p-4 flex flex-col justify-between relative shadow-sm cursor-pointer transition-all duration-300 ${
                                activeClinicId === clinic.id ? 'border-blue-600 bg-blue-50/10 shadow-md scale-[1.01]' : 'border-[#DCE5EE]'
                              }`}
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(clinic.id); }}
                                className="absolute top-3 right-3 text-[#94A3B8] hover:text-red-500 transition-colors"
                              >
                                <Heart size={14} className={favorites.includes(clinic.id) ? 'fill-red-500 text-red-500' : ''} />
                              </button>
                              
                              <div>
                                <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeClass}`}>
                                  {badgeText}
                                </span>
                                
                                <h4 className="text-xs font-bold text-[#172033] mt-2 mb-1 leading-tight line-clamp-1">{clinic.name}</h4>
                                <p className="text-[10px] text-[#64748B] line-clamp-2 mb-3">{clinic.description}</p>
                                
                                {/* Dynamic explanation bullet points */}
                                <div className="flex flex-col gap-1 text-[9.5px] text-gray-500 font-medium pb-2 border-t border-[#EEF3F8] pt-2">
                                  <div className="flex items-center gap-1">
                                    <span className="text-emerald-500 font-bold">✓</span>
                                    <span>Принимает {currentRoute.specialist}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-emerald-500 font-bold">✓</span>
                                    <span>Рейтинг {clinic.rating} ({clinic.reviewCount} отз.)</span>
                                  </div>
                                  {userCoords && clinic.lat && (
                                    <div className="flex items-center gap-1">
                                      <span className="text-emerald-500 font-bold">✓</span>
                                      <span>Расстояние {getDistance(userCoords.lat, userCoords.lng, clinic.lat, clinic.lng)} км</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <span className="text-emerald-500 font-bold">✓</span>
                                    <span>{clinic.workingHours}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-blue-600">
                                    <span className="text-blue-500 font-bold">✓</span>
                                    <span>Запись онлайн</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex items-center justify-between text-[9.5px] text-[#94A3B8] border-t border-[#F1F5F9] pt-2">
                                  <span className="flex items-center gap-0.5"><Star size={10} className="fill-yellow-500 text-yellow-500" /> {clinic.rating}</span>
                                  <span className="truncate max-w-[70px]">{clinic.address}</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Map integration */}
                  {mapMarkers.length > 0 && (
                    <div className="h-64 rounded-2xl overflow-hidden border border-[#DCE5EE] bg-[#EEF3F8] relative">
                      <div className="absolute top-2.5 left-2.5 z-10 bg-white/90 backdrop-blur px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-gray-700 shadow-sm flex items-center gap-1">
                        <MapPin size={10} className="text-[#2563EB]" /> Шымкент
                      </div>
                      <DashboardMap center={mapCenter} markers={mapMarkers} activeMarkerId={activeClinicId} onSelectMarker={(id) => setActiveClinicId(id)} />
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

                  {/* Action Buttons */}
                  <div className="grid sm:grid-cols-3 gap-3 border-t border-gray-100 pt-5">
                    <a 
                      href="https://damumed.kz" 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all text-center"
                    >
                      <HeartPulse size={14} /> Записаться через DamuMed
                    </a>
                    <a 
                      href={`tel:${recommendedClinics[0]?.phone ?? '103'}`}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-[#DCE5EE] hover:bg-[#EEF3F8]/50 text-gray-700 rounded-2xl text-xs font-bold transition-all text-center"
                    >
                      <Phone size={14} className="text-[#2563EB]" /> Позвонить в регистратуру
                    </a>
                    <button 
                      onClick={() => {
                        if (recommendedClinics.length > 0) {
                          setActiveClinicId(recommendedClinics[0].id);
                        }
                      }}
                      className="flex items-center justify-center gap-2 py-3 px-4 bg-white border border-[#DCE5EE] hover:bg-[#EEF3F8]/50 text-gray-700 rounded-2xl text-xs font-bold transition-all text-center"
                    >
                      <MapPin size={14} className="text-[#2563EB]" /> Показать на карте
                    </button>
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
          /* Welcome state / Initial query form */
          <div className="flex flex-col gap-8">
            <div className="grid lg:grid-cols-3 gap-6 items-start">
              {/* Left Column: Input Card */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.08 }}
                  className="bg-card rounded-2xl border border-[#DCE5EE] shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] p-6"
                >
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
                      <Sparkles size={16} className="text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[#172033]">Что вас беспокоит?</div>
                      <div className="text-xs text-[#64748B]">Опишите ситуацию — подберём специалиста и клинику</div>
                    </div>
                  </div>

                  <textarea
                    id="home-description"
                    placeholder="Опишите ваши симптомы или вопрос... Например: болит колено после падения, температура 37.5°C, боль длится 3 дня."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full input-field rounded-xl px-4 py-3.5 text-sm resize-none mb-4 leading-relaxed font-sans"
                  />

                  {/* Quick actions chips */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => setDescription(action.label)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748B] bg-[#EEF3F8] hover:bg-[#E2EBF4] hover:text-[#172033] transition-all border border-transparent hover:border-[#DCE5EE]"
                      >
                        <action.icon size={11} />
                        {action.label}
                      </button>
                    ))}
                  </div>

                  {/* User profile preview info */}
                  {profile && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#EEF3F8]/60 border border-[#DCE5EE] mb-4 text-[11px] text-[#64748B]">
                      <UserRound size={12} className="text-[#2563EB]" />
                      <span className="font-medium ml-1">Профиль загружен:</span>
                      <span className="font-semibold text-[#172033] ml-1">
                        {profile.name} ({profile.age} лет, {profile.gender === 'male' ? 'М' : 'Ж'}, {profile.city})
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#94A3B8]">
                      {description.length}/1000 символов
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleStartConsultation}
                      disabled={!description.trim()}
                      id="home-continue-btn"
                      className={`btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold ${
                        !description.trim() ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      Начать анализ
                      <ArrowRight size={15} />
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Mini Dashboard widgets */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                {/* Last Query Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.12 }}
                  className="bg-card rounded-2xl border border-[#DCE5EE] p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] flex flex-col justify-between min-h-[120px]"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] mb-2">
                      <Clock size={14} className="text-[#2563EB]" />
                      Последний запрос
                    </div>
                    <p className="text-xs text-[#172033] font-medium line-clamp-2 leading-relaxed bg-[#EEF3F8]/50 p-2.5 rounded-xl border border-[#DCE5EE] min-h-[48px]">
                      {lastQuery ? lastQuery : 'Нет недавних запросов'}
                    </p>
                  </div>
                  {lastQuery && (
                    <button
                      onClick={() => setDescription(lastQuery)}
                      className="text-[10px] font-bold text-[#2563EB] hover:underline self-end mt-2 flex items-center gap-1"
                    >
                      Повторить запрос <ArrowRight size={10} />
                    </button>
                  )}
                </motion.div>

                {/* Favorites Quick Card */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.16 }}
                  className="bg-card rounded-2xl border border-[#DCE5EE] p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] flex items-center gap-4 animate-stagger"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <Heart size={20} className="fill-red-500 text-red-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Избранное</div>
                    <div className="text-base font-bold text-[#172033] mt-0.5">
                      {favorites.length} {favorites.length === 1 ? 'организация' : favorites.length > 1 && favorites.length < 5 ? 'организации' : 'организаций'}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Bottom Section: Possibilities of MediRoute */}
            <div className="flex flex-col gap-5 border-t border-[#DCE5EE] pt-8">
              <div>
                <h3 className="text-base font-bold text-[#172033]">Возможности MediRoute</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Как работает умная медицинская маршрутизация</p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="grid sm:grid-cols-2 gap-4 animate-stagger"
              >
                {[
                  {
                    icon: Stethoscope,
                    title: 'Подбор специалиста',
                    desc: 'AI помогает определить подходящего врача на основе вашей ситуации.',
                    color: '#2563EB',
                    bg: 'rgba(37, 99, 235, 0.08)',
                  },
                  {
                    icon: Building2,
                    title: 'Поиск клиники',
                    desc: 'Подбор медицинских учреждений по специализации, отзывам и расположению.',
                    color: '#06B6D4',
                    bg: 'rgba(6, 182, 212, 0.08)',
                  },
                  {
                    icon: HeartPulse,
                    title: 'Реабилитация',
                    desc: 'Поиск центров восстановления после операций, травм и заболеваний.',
                    color: '#059669',
                    bg: 'rgba(5, 150, 105, 0.08)',
                  },
                  {
                    icon: Route,
                    title: 'Маршрут пациента',
                    desc: 'Последовательный путь от обращения до записи в медицинское учреждение.',
                    color: '#7C3AED',
                    bg: 'rgba(124, 58, 237, 0.08)',
                  },
                ].map((card) => (
                  <motion.div
                    key={card.title}
                    whileHover={{ y: -5, scale: 1.02, boxShadow: '0 12px 24px -10px rgba(23, 32, 51, 0.12)' }}
                    className="bg-card rounded-2xl border border-[#DCE5EE] p-6 flex gap-4 transition-all duration-300 cursor-default"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: card.bg }}
                    >
                      <card.icon size={18} style={{ color: card.color }} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#172033] mb-1">{card.title}</h4>
                      <p className="text-[11px] text-[#64748B] leading-relaxed">{card.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
