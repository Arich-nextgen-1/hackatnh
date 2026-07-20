/**
 * MediRoute AI — Beautiful PDF Report Generator
 * Creates a styled print window with the consultation results.
 */

export interface PDFReportData {
  patientName?: string;
  patientAge?: number;
  date: string;
  query: string;            // Жалобы / симптомы
  specialist: string;       // Рекомендуемый специалист
  confidenceScore?: number; // Уверенность AI (%)
  urgency?: 'low' | 'medium' | 'high';
  reasons?: string[];       // Причины направления
  recommendations?: string[]; // Рекомендации пациенту
  clinic?: {
    name: string;
    address?: string;
    phone?: string;
    rating?: number;
    distance?: number;
  };
}

function urgencyLabel(u?: string) {
  if (u === 'high') return { text: '🔴 Срочно', color: '#DC2626' };
  if (u === 'medium') return { text: '🟡 Желательно сегодня', color: '#D97706' };
  return { text: '🟢 Планово', color: '#059669' };
}

export function generateAndPrintPDF(data: PDFReportData) {
  const urgency = urgencyLabel(data.urgency);

  let patientName = data.patientName;
  let patientAge = data.patientAge;

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('mediroute_profile');
      if (raw) {
        const profile = JSON.parse(raw);
        if (!patientName && profile?.name) {
          patientName = profile.name;
        }
        if (!patientAge && profile?.age) {
          patientAge = Number(profile.age);
        }
      }
    } catch (_) {}
  }

  const recommendationsList = (data.recommendations && data.recommendations.length > 0
    ? data.recommendations
    : [
      'Обратитесь к специалисту в ближайшее время',
      'Не откладывайте визит при ухудшении состояния',
      'Возьмите с собой медицинскую карту и результаты анализов',
    ]
  ).map(r => `<li>${r}</li>`).join('');

  const reasonsList = (data.reasons && data.reasons.length > 0
    ? data.reasons
    : ['Требуется очная консультация специалиста']
  ).map(r => `<li>${r}</li>`).join('');

  // Build patient details conditionally
  let patientDetailsHTML = '';
  if (patientName || patientAge) {
    patientDetailsHTML = `
      <div class="section-label">Пациент</div>
      <div class="patient-grid">
        ${patientName ? `
        <div class="patient-item">
          <label>Имя</label>
          <span>${patientName}</span>
        </div>` : ''}
        ${patientAge ? `
        <div class="patient-item">
          <label>Возраст</label>
          <span>${patientAge} лет</span>
        </div>` : ''}
        <div class="patient-item" style="grid-column: span 2">
          <label>Дата консультации</label>
          <span>Сегодня</span>
        </div>
      </div>
      <hr class="divider-thick">
    `;
  } else {
    patientDetailsHTML = `
      <div class="section-label">Дата консультации</div>
      <div class="patient-grid" style="grid-template-columns: 1fr;">
        <div class="patient-item">
          <span>Сегодня</span>
        </div>
      </div>
      <hr class="divider-thick">
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>MediRoute AI — Направление</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      background: #f8fafc;
      color: #1e293b;
      padding: 32px;
      max-width: 680px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
      margin-bottom: 24px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 20px;
    }
    .logo-text { font-size: 18px; font-weight: 900; color: #172033; }
    .logo-sub { font-size: 11px; color: #64748b; font-weight: 500; }
    .doc-title { font-size: 12px; color: #94a3b8; font-weight: 600; text-align: right; }
    .divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 16px 0;
    }
    .divider-thick {
      border: none;
      border-top: 2px solid #e2e8f0;
      margin: 20px 0;
    }
    .section-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #94a3b8;
      margin-bottom: 8px;
    }
    .patient-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #f1f5f9;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .patient-item label { font-size: 10px; color: #94a3b8; font-weight: 700; display: block; }
    .patient-item span { font-size: 14px; font-weight: 700; color: #172033; }
    .complaints-box {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .complaints-box p { font-size: 14px; color: #334155; line-height: 1.6; }
    .specialist-box {
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border: 2px solid #93c5fd;
      border-radius: 14px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    .specialist-icon {
      width: 52px;
      height: 52px;
      background: #2563eb;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }
    .specialist-name { font-size: 22px; font-weight: 900; color: #1e40af; }
    .specialist-meta { font-size: 11px; color: #3b82f6; font-weight: 600; }
    .confidence-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 6px;
    }
    .confidence-bar-bg {
      flex: 1;
      height: 6px;
      background: #bfdbfe;
      border-radius: 99px;
      overflow: hidden;
    }
    .confidence-bar-fill {
      height: 100%;
      background: #2563eb;
      border-radius: 99px;
    }
    .confidence-pct { font-size: 13px; font-weight: 800; color: #1d4ed8; }
    .urgency-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 99px;
      font-size: 13px;
      font-weight: 700;
      border: 1.5px solid;
      margin-bottom: 20px;
    }
    .reasons-list, .recs-list {
      padding-left: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .reasons-list li, .recs-list li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 13px;
      color: #334155;
      line-height: 1.5;
    }
    .reasons-list li::before { content: "✓"; color: #2563eb; font-weight: 900; flex-shrink: 0; }
    .recs-list li::before { content: "•"; color: #f59e0b; font-weight: 900; flex-shrink: 0; }
    .clinic-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 20px;
    }
    .clinic-field label { font-size: 10px; color: #94a3b8; font-weight: 700; display: block; }
    .clinic-field span { font-size: 13px; font-weight: 600; color: #172033; }
    .disclaimer {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 11px;
      color: #92400e;
      line-height: 1.6;
    }
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
    }
    @media print {
      body { background: white; padding: 20px; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="logo">
      <div class="logo-icon">🏥</div>
      <div>
        <div class="logo-text">MediRoute AI</div>
        <div class="logo-sub">Интеллектуальная маршрутизация пациентов</div>
      </div>
    </div>
    <div class="doc-title">
      Медицинское направление<br>
      <strong>Сегодня</strong>
    </div>
  </div>

  <!-- Patient Details Grid -->
  ${patientDetailsHTML}

  <!-- Жалобы -->
  <div class="section-label">Жалобы</div>
  <div class="complaints-box">
    <p>${data.query}</p>
  </div>

  <hr class="divider-thick">

  <!-- Специалист -->
  <div class="section-label">Предварительное направление</div>
  <div class="specialist-box">
    <div class="specialist-icon">👨‍⚕️</div>
    <div style="flex: 1">
      <div class="specialist-name">${data.specialist}</div>
      <div class="specialist-meta">Рекомендуемый специалист</div>
      ${data.confidenceScore ? `
      <div class="confidence-row">
        <div class="confidence-bar-bg">
          <div class="confidence-bar-fill" style="width: ${data.confidenceScore}%"></div>
        </div>
        <div class="confidence-pct">${data.confidenceScore}%</div>
      </div>
      <div style="font-size:10px; color:#3b82f6; margin-top: 2px">Уверенность AI</div>
      ` : ''}
    </div>
  </div>

  <!-- Срочность -->
  <div class="urgency-badge" style="color: ${urgency.color}; border-color: ${urgency.color}40; background: ${urgency.color}10">
    ${urgency.text}
  </div>

  <hr class="divider-thick">

  <!-- Обоснование -->
  <div class="section-label">Обоснование направления</div>
  <ul class="reasons-list" style="margin-bottom: 20px">${reasonsList}</ul>

  <hr class="divider-thick">

  <!-- Клиника -->
  ${data.clinic ? `
  <div class="section-label">Рекомендуемая клиника</div>
  <div class="clinic-box">
    <div class="clinic-field" style="grid-column: span 2">
      <label>Название</label>
      <span>${data.clinic.name}</span>
    </div>
    ${data.clinic.address ? `<div class="clinic-field" style="grid-column: span 2"><label>Адрес</label><span>${data.clinic.address}</span></div>` : ''}
    ${data.clinic.phone ? `<div class="clinic-field"><label>Телефон</label><span>${data.clinic.phone}</span></div>` : ''}
    ${data.clinic.rating ? `<div class="clinic-field"><label>Рейтинг</label><span>⭐ ${data.clinic.rating.toFixed(1)}</span></div>` : ''}
    ${data.clinic.distance ? `<div class="clinic-field"><label>Расстояние</label><span>📍 ${data.clinic.distance} км</span></div>` : ''}
  </div>
  <hr class="divider-thick">
  ` : ''}

  <!-- Рекомендации -->
  <div class="section-label">Рекомендации пациенту</div>
  <ul class="recs-list" style="margin-bottom: 24px">${recommendationsList}</ul>

  <!-- Disclaimer -->
  <div class="disclaimer">
    ⚠️ <strong>Важно:</strong> Данное направление сформировано на основе анализа симптомов с помощью AI и носит исключительно информационный характер. MediRoute AI не ставит диагноз и не заменяет очную консультацию врача.
  </div>

  <div class="footer">
    Сформировано: MediRoute AI · Шымкент, Казахстан · Сегодня
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=750,height=900,scrollbars=yes');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
