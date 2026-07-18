'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Activity, Shield, Clock, Zap, MessageSquare, Heart, RefreshCw, AlertCircle, Stethoscope, Building2, HeartPulse, Route, UserRound, Star, MapPin, Bookmark } from 'lucide-react';
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

  // Load favorites & last query on mount
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

  const mapCenter: [number, number] = mapMarkers.length > 0
    ? [mapMarkers[0].lat, mapMarkers[0].lng]
    : [42.33, 69.61]; // Shymkent default

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
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
          <div className="flex flex-col gap-4">
            {/* Chat history */}
            <div className="flex flex-col gap-4">
              {chatHistory.map((msg, index) => (
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
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                    {msg.role === 'assistant' && (
                      <p className="text-[10px] text-[#94A3B8] mt-2 pt-2 border-t border-[#EEF3F8] leading-relaxed">
                        AI не заменяет врача и не ставит диагноз. Рекомендации носят информационный характер.
                      </p>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                      {profile?.name?.charAt(0).toUpperCase() ?? 'П'}
                    </div>
                  )}
                </div>
              ))}

              {/* Loading AI State */}
              {loading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EEF3F8] border border-[#DCE5EE] flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={14} className="text-[#2563EB] animate-pulse" />
                  </div>
                  <div className="bg-card rounded-2xl border border-[#DCE5EE] px-5 py-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-bounce" style={{ animationDelay: '300ms' }} />
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

            {/* Structured Routing Result Block (Маршрут Пациента) */}
            {currentRoute && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-[#F8FAFC] border border-[#DCE5EE] rounded-3xl p-6 flex flex-col gap-6"
              >
                <div>
                  <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                    Маршрут пациента
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">Рекомендованные специалисты и лечебные учреждения</p>
                </div>

                {/* Specialist */}
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-[#DCE5EE]">
                  <div className="w-10 h-10 rounded-xl bg-[#EEF3F8] flex items-center justify-center text-[#2563EB]">
                    <Stethoscope size={18} />
                  </div>
                  <div>
                    <div className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider">Рекомендуемый специалист</div>
                    <div className="text-sm font-bold text-[#172033]">{currentRoute.specialist}</div>
                  </div>
                </div>

                {/* Recommended clinics */}
                {recommendedClinics.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <div className="text-xs font-semibold text-[#64748B]">Рекомендуемые клиники:</div>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {recommendedClinics.map((clinic: any) => (
                        <div key={clinic.id} className="bg-white border border-[#DCE5EE] rounded-2xl p-4 flex flex-col justify-between relative shadow-sm">
                          <button
                            onClick={() => toggleFavorite(clinic.id)}
                            className="absolute top-3 right-3 text-[#94A3B8] hover:text-red-500 transition-colors"
                          >
                            <Heart size={14} className={favorites.includes(clinic.id) ? 'fill-red-500 text-red-500' : ''} />
                          </button>
                          <div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${clinic.type === 'private' ? 'bg-purple-50 text-purple-600' : 'bg-green-50 text-green-600'}`}>
                              {clinic.type === 'private' ? 'Частная' : 'Государственная'}
                            </span>
                            <h4 className="text-xs font-bold text-[#172033] mt-2 mb-1 leading-tight line-clamp-1">{clinic.name}</h4>
                            <p className="text-[10px] text-[#64748B] line-clamp-2 mb-3">{clinic.description}</p>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-[10px] text-[#94A3B8] border-t border-[#F1F5F9] pt-2">
                              <span className="flex items-center gap-0.5"><Star size={10} className="fill-yellow-500 text-yellow-500" /> {clinic.rating}</span>
                              <span className="truncate max-w-[70px]">{clinic.address}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Map integration */}
                {mapMarkers.length > 0 && (
                  <div className="h-64 rounded-2xl overflow-hidden border border-[#DCE5EE] bg-[#EEF3F8]">
                    <DashboardMap center={mapCenter} markers={mapMarkers} />
                  </div>
                )}

                {/* Rehabilitation centers if needed */}
                {currentRoute.rehab_needed && recommendedRehabs.length > 0 && (
                  <div className="flex flex-col gap-3 border-t border-[#DCE5EE] pt-5">
                    <div className="text-xs font-semibold text-[#0891B2]">Требуется реабилитация. Подходящие центры:</div>
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
              </motion.div>
            )}

            {/* Conversation reply box (if not completed or if you want to request again) */}
            <div className="bg-card rounded-2xl border border-[#DCE5EE] shadow-[0_1px_3px_0_rgb(0,0,0,0.06)] p-4 flex flex-col gap-3">
              <textarea
                placeholder={currentRoute ? "Задайте дополнительный вопрос..." : "Ответьте на вопросы AI..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full input-field rounded-xl px-4 py-2.5 text-sm resize-none leading-relaxed"
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
                  className="bg-card rounded-2xl border border-[#DCE5EE] p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.04)] flex items-center gap-4"
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
                className="grid sm:grid-cols-2 gap-4"
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
                    whileHover={{ y: -3, scale: 1.01, boxShadow: '0 12px 24px -10px rgba(23, 32, 51, 0.08)' }}
                    className="bg-card rounded-2xl border border-[#DCE5EE] p-6 flex gap-4 transition-all duration-300"
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
