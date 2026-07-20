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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      padding: 40px;
      max-width: 720px;
      margin: 40px auto;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
      border-radius: 20px;
      border: 1px solid #e2e8f0;
      line-height: 1.5;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 24px;
      border-bottom: 2px solid #2563eb;
      margin-bottom: 28px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #2563eb, #3b82f6);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 22px;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.15);
    }
    .logo-text { font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
    .logo-sub { font-size: 11px; color: #64748b; font-weight: 500; margin-top: 1px; }
    .doc-title { font-size: 12px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; text-align: right; line-height: 1.4; }
    .divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 20px 0;
    }
    .divider-thick {
      border: none;
      border-top: 2px solid #e2e8f0;
      margin: 24px 0;
    }
    .section-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #94a3b8;
      margin-bottom: 10px;
    }
    .patient-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .patient-item label { font-size: 9.5px; color: #94a3b8; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
    .patient-item span { font-size: 14px; font-weight: 700; color: #0f172a; }
    .complaints-box {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .complaints-box p { font-size: 14px; color: #334155; line-height: 1.6; }
    .specialist-box {
      background: linear-gradient(135deg, #f8fafc, #eff6ff);
      border: 1px solid #bfdbfe;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 24px;
    }
    .specialist-icon {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      flex-shrink: 0;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }
    .specialist-name { font-size: 22px; font-weight: 900; color: #1e3a8a; letter-spacing: -0.3px; }
    .specialist-meta { font-size: 11.5px; color: #475569; font-weight: 500; margin-top: 2px; }
    .confidence-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      background: #f1f5f9;
      padding: 8px 12px;
      border-radius: 8px;
      max-width: 320px;
    }
    .confidence-bar-bg {
      flex: 1;
      height: 6px;
      background: #e2e8f0;
      border-radius: 99px;
      overflow: hidden;
    }
    .confidence-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #2563eb);
      border-radius: 99px;
    }
    .confidence-pct { font-size: 13px; font-weight: 800; color: #1e3a8a; }
    .urgency-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1.5px solid;
      margin-bottom: 24px;
    }
    .reasons-list, .recs-list {
      padding-left: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .reasons-list li, .recs-list li {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 13.5px;
      color: #334155;
      line-height: 1.6;
      padding-left: 4px;
    }
    .reasons-list li::before {
      content: "✓";
      color: #2563eb;
      font-weight: 900;
      flex-shrink: 0;
      background: #eff6ff;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      border: 1px solid #dbeafe;
    }
    .recs-list li::before {
      content: "•";
      color: #d97706;
      font-weight: 900;
      flex-shrink: 0;
      background: #fffbeb;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      border: 1px solid #fef3c7;
    }
    .clinic-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 24px;
    }
    .clinic-field label { font-size: 9.5px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
    .clinic-field span { font-size: 13.5px; font-weight: 600; color: #0f172a; }
    .disclaimer {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #d97706;
      border-radius: 8px;
      padding: 14px 18px;
      font-size: 11.5px;
      color: #78350f;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .footer {
      margin-top: 32px;
      text-align: center;
      font-size: 10px;
      color: #94a3b8;
      font-weight: 500;
    }
    @media print {
      body {
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
        max-width: 100% !important;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .specialist-box, .clinic-box, .patient-grid, .complaints-box, .disclaimer {
        page-break-inside: avoid;
      }
    }
    @page {
      size: auto;
      margin: 15mm 20mm;
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
