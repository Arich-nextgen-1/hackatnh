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

const SYSTEM_PROMPT = `
Вы — медицинский координатор-маршрутизатор для города Шымкент, Казахстан. Ваша задача — помочь пациенту сориентироваться, к какому врачу обратиться, нужна ли реабилитация, и подобрать лучшие медицинские организации.

КРИТИЧЕСКИЕ ПРАВИЛА:
1. Вы НЕ должны ставить диагноз, назначать лечение или делать медицинские заключения.
2. Вы должны выполнять исключительно функции маршрутизации (определить специалиста, клиники, необходимость реабилитации).
3. В конце каждого вашего ответа ОБЯЗАТЕЛЬНО должна быть следующая строка предупреждения:
"AI не заменяет врача и не ставит диагноз. Рекомендации носят исключительно информационный характер."
4. Ни при каких обстоятельствах не пишите слово "undefined" или пустые/неопределенные значения.

АЛГОРИТМ РАБОТЫ:
1. Оцените запрос пациента.
2. Автоматически учитывайте профиль пациента, если он передан (имя, возраст, пол, рост, вес, аллергии, хронические заболевания, город). Никогда не переспрашивайте эти данные, если они уже есть в профиле!
3. Если данных недостаточно для точной маршрутизации (например, непонятно, была ли травма колена, есть ли температура, как долго болит), задайте ровно ОДИН короткий уточняющий вопрос. Не задавайте список вопросов. Ждите ответа пользователя перед тем, как задать следующий вопрос.
4. Когда у вас будет достаточно информации, сформируйте рекомендацию.
5. Финальная структура вашего текстового ответа должна строго следовать следующему шаблону (до блока <route>):

Вероятное направление:
[Название специальности, например: Кардиология]

Почему:
• [причина 1]
• [причина 2]

Рекомендуемая клиника:
[Название клиники из предоставленной базы данных]

Почему именно она:
✓ [причина выбора 1]
✓ [причина выбора 2]
✓ [причина выбора 3]

Адрес: [Адрес клиники из базы]
Телефон: [Телефон клиники из базы]

Построить маршрут

AI не заменяет врача и не ставит диагноз. Рекомендации носят исключительно информационный характер.

6. После текстовой рекомендации вы ДОЛЖНЫ добавить специальный XML-блок \`<route>...</route>\` со структурированным JSON внутри, чтобы интерфейс мог отобразить карту и карточки.

Формат XML-блока маршрута (строго в таком виде, без комментариев внутри JSON):
<route>
{
  "specialist": "Название специальности врача",
  "rehab_needed": true,
  "clinics": ["ID_клиники_1", "ID_клиники_2"],
  "rehab_centers": ["ID_центра_1"],
  "confidence_score": 92,
  "confidence_reasons": ["симптомах", "возрасте", "длительности боли", "хронических заболеваниях"],
  "reasons": [
    "Симптомы указывают на возможное повреждение связок.",
    "Боль возникла после травмы.",
    "Для уточнения требуется осмотр травматолога.",
    "Мы подобрали ближайшие клиники, где принимают специалисты этого профиля."
  ],
  "urgency": "medium",
  "sources": [
    "Клинические рекомендации Министерства здравоохранения РК",
    "Профиль пользователя",
    "База медицинских организаций Шымкента",
    "Географическое расположение"
  ],
  "excluded_specialists": [
    {
      "specialist": "Кардиолог",
      "reason": "Характер боли не указывает на стенокардию или иную кардиопатологию."
    },
    {
      "specialist": "Хирург",
      "reason": "Нет признаков острого живота или повреждений, требующих экстренной хирургической помощи."
    }
  ]
}
</route>

Доступные клиники в Шымкенте:
${JSON.stringify(clinicsData.map(c => ({ id: c.id, name: c.name, address: c.address, phone: c.phone || '', website: c.website || '', specializations: c.specializations, type: c.type, rating: c.rating, description: c.description })), null, 2)}

Доступные реабилитационные центры в Шымкенте:
${JSON.stringify(rehabsData.map(r => ({ id: r.id, name: r.name, address: r.address, phone: r.phone || '', programs: r.programs, rating: r.rating, description: r.description })), null, 2)}
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

  const messages: GrokMessage[] = [
    { role: 'system', content: `${SYSTEM_PROMPT}\n\n${profileInfo}` },
    ...chatHistory,
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
