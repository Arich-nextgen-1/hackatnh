import clinicsData from '@/data/clinics.json';
import rehabsData from '@/data/rehabilitation.json';

export interface GrokMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RouteRecommendation {
  specialist: string;
  rehab_needed: boolean;
  clinics: string[]; // IDs
  rehab_centers: string[]; // IDs
  confidence_score?: number;
  confidence_reasons?: string[];
  reasons?: string[];
  urgency?: 'low' | 'medium' | 'high';
  sources?: string[];
  excluded_specialists?: { specialist: string; reason: string }[];
}

// Compact clinic data — only fields needed for routing (saves tokens)
const CLINICS_COMPACT = clinicsData.map(c => ({
  id: c.id,
  name: c.name,
  address: c.address,
  phone: c.phone || '',
  specializations: c.specializations,
  type: c.type,
}));

const REHABS_COMPACT = (rehabsData as any[]).map(r => ({
  id: r.id,
  name: r.name,
  address: r.address,
  phone: r.phone || '',
  programs: (r.programs ?? r.services ?? []).slice(0, 4),
}));

const SYSTEM_PROMPT = `Вы — медицинский маршрутизатор г. Шымкент (Казахстан). Помогаете пациенту выбрать специалиста, клинику, реабцентр.

ПРАВИЛА:
- НЕ ставьте диагноз и не назначайте лечение.
- Если данных мало — задайте ОДИН уточняющий вопрос.
- Не переспрашивайте данные из профиля пациента.
- Заканчивайте ответ строкой: "AI не заменяет врача и не ставит диагноз."

ФОРМАТ ОТВЕТА (строго):
Вероятное направление: [специальность]
Почему: • причина 1 • причина 2
Рекомендуемая клиника: [название]
Почему именно она: ✓ причина 1 ✓ причина 2
Адрес: [адрес] Телефон: [телефон]
Построить маршрут
AI не заменяет врача и не ставит диагноз.

Затем добавьте XML-блок:
<route>
{"specialist":"...","rehab_needed":true/false,"clinics":["id1"],"rehab_centers":["id1"],"confidence_score":85,"confidence_reasons":["симптом"],"reasons":["причина"],"urgency":"low/medium/high","sources":["Минздрав РК"],"excluded_specialists":[{"specialist":"...","reason":"..."}]}
</route>

КЛИНИКИ:
${JSON.stringify(CLINICS_COMPACT)}

РЕАБЦЕНТРЫ:
${JSON.stringify(REHABS_COMPACT)}
`;

export async function getGrokRoutingResponse(
  chatHistory: GrokMessage[],
  userProfile: any
): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_GROK_API_KEY;

  if (!apiKey) {
    throw new Error('API key (NEXT_PUBLIC_GROK_API_KEY) is not configured in .env.local');
  }

  // Inject profile info into system message (defensively sanitize undefined fields)
  const profileInfo = userProfile
    ? `Профиль пациента:\nИмя: ${userProfile.name ?? 'Пользователь'}\nВозраст: ${userProfile.age ?? '—'}\nПол: ${userProfile.gender === 'male' ? 'Мужской' : userProfile.gender === 'female' ? 'Женский' : 'Другой'}\nРост: ${userProfile.height ?? '—'} см\nВес: ${userProfile.weight ?? '—'} кг\nАллергии: ${userProfile.allergies || 'нет'}\nХронические заболевания: ${userProfile.chronicDiseases || 'нет'}\nГород: ${userProfile.city ?? 'Шымкент'}`
    : 'Профиль пациента: отсутствует (попросите базовую информацию при необходимости)';

  // Keep only the last 6 user/assistant turns to minimize TPM usage
  const MAX_HISTORY = 6;
  const trimmedHistory = chatHistory.slice(-MAX_HISTORY);

  const messages: GrokMessage[] = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${profileInfo}` },
    ...trimmedHistory,
  ];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.2,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Grok API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('Error calling Grok API:', error);
    throw error;
  }
}

/**
 * Recursively removes string "undefined" / "null" / whitespace-only values
 * from a parsed AI route object so that JSX fallbacks (?? / ||) work correctly.
 */
export function sanitizeRoute(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(sanitizeRoute).filter((v) => v !== null);
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      clean[k] = sanitizeRoute(v);
    }
    return clean;
  }
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    if (
      trimmed === '' ||
      trimmed.toLowerCase() === 'undefined' ||
      trimmed.toLowerCase() === 'null' ||
      trimmed.toLowerCase() === 'не определён' ||
      trimmed.toLowerCase() === 'не определено'
    ) {
      return null;
    }
    return trimmed;
  }
  return obj;
}

