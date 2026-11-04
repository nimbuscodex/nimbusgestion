import { Lead } from '../types';

export const getRelativeDateStr = (offsetDays: number): string => {
  const d = new Date(Date.now() + offsetDays * 86400000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Lead original real del usuario: Momo Studio
 * Contactada por Redbook (小红书) para rediseño web corporativo
 */
export const MOMO_ORIGINAL_LEAD: Lead = {
  id: 'lead-momo-01',
  commercialName: 'Momo',
  companyName: 'Momo Studio',
  contactPerson: 'Momo',
  currentWebsite: 'https://momo-design-studio.com',
  socialUrl: '小红书: momo_design_es',
  sector: 'Diseño y Creatividad',
  location: 'Madrid',
  email: 'momo@momo-design-studio.com',
  phone: '+34 688 23 45 67',
  channel: 'Redbook (小红书)',
  leadSource: 'Redbook (Inbound - Nos contactan)',
  createdAt: '2026-10-15',
  firstContactDate: '2026-10-16',
  lastContactDate: '2026-10-20',
  contactTone: 'cercano',
  isPendingContact: false,
  offeredService: 'Rediseño web corporativo',
  estimatedBudget: null, // Aún no especificado
  potentialValue: null,
  priority: 'Alta',
  assignedTo: 'Alex M.',
  notes: 'Contacto recibido a través de Xiaohongshu (Redbook). Interesada en rediseño web y portfolio interactivo.',
  nextFollowUpDate: getRelativeDateStr(2),
  status: 1, // Respondió una vez
  lastResponseDate: '2026-10-17',
  followUpsCount: 1,
  doNotContact: false,
  isArchived: false,
  transitions: [
    {
      id: 'tr-momo-01',
      fromStatus: 0,
      toStatus: 1,
      date: '2026-10-16',
      durationDays: 1,
      notes: 'Respuesta inicial recibida en Redbook',
    },
  ],
  interactions: [
    {
      id: 'msg-momo-01',
      date: '2026-10-16',
      channel: 'Redbook (小红书)',
      messageType: 'inicial',
      body: '你好Momo！看到你们小红书发布的设计作品集非常惊艳，排版和审美很有质感。不过目前在手机端打开个人网站加载稍有延迟，我们做过多语言设计独立站，针对欧美和国内都有专门的CDN加速方案...',
      responseReceived: true,
      responseDate: '2026-10-17',
      responseText: '你好呀！确实有客户反馈在国内打开有点卡，你们是怎么收费的？有案例可以发来看看吗？',
      interactionResult: 'Respuesta positiva',
      toneAnalysis: {
        primaryTones: [
          { tone: 'cercano', score: 90 },
          { tone: 'personalizado', score: 85 },
        ],
        secondaryTones: [
          { tone: 'profesional', score: 70 },
        ],
        structure: 'Halago genuino + Detección de problema + Propuesta de valor',
        hookType: 'Elogio de portfolio y auditoría técnica de velocidad CDN',
        length: { words: 52, characters: 340, estimatedReadingSeconds: 15 },
        personalizationLevel: 'Alta (Específico de su web/negocio)',
        ctaType: 'Fricción baja',
        valueProposition: 'Portfolio ultra rápido con doble CDN para España y China',
        aiReasoning: 'Tono cercano y respetuoso en chino simplificado que conecta con creadores visuales.',
        analyzerVersion: 'Nimbus-Tone-v3.8',
        analyzedAt: '2026-10-16T11:00:00Z',
      },
    },
  ],
  isDemo: false,
};

export const INITIAL_LEADS: Lead[] = [MOMO_ORIGINAL_LEAD];
export const DEMO_LEADS: Lead[] = [MOMO_ORIGINAL_LEAD];
export const INITIAL_EXPERIMENTS: any[] = [];
