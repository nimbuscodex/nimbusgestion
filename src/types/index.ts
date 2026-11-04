/**
 * Types and interfaces for Nimbuscodex Gestión
 * CRM & Sales Outreach Intelligence for Web Design & Development
 */

export type CommercialStatus = 0 | 1 | 2 | 3 | 4 | 5;

export const STANDARD_TONES = [
  'profesional',
  'cercano',
  'informal',
  'directo',
  'consultivo',
  'personalizado',
  'persuasivo',
  'orientado a beneficios',
  'centrado en problemas',
  'técnico',
  'breve',
  'detallado',
  'humorístico',
  'urgente'
] as const;

export const CHINESE_TONES = [
  '谦逊礼貌 (Humble & Polite)',
  '建立关系 (Guanxi & Trust)',
  '务实真诚 (Pragmatic & ROI)',
  '专业背书 (Authority & Social Proof)',
  '亲切诚恳 (Warm & Sincere)',
  '促销让利 (Direct Offer & Benefit)',
  '商务正式 (Formal Business)',
  '紧迫提醒 (Urgent Opportunity)'
] as const;

export type ChineseTone = typeof CHINESE_TONES[number];

export interface ChineseToneScore {
  zhTone: string; // e.g. 谦逊礼貌
  enTone: string; // e.g. Humble & Polite
  esTone: string; // e.g. Respetuoso y Humilde
  tone: string;   // Full label
  score: number;  // 0-100
  matchedKeywords?: string[];
}

export interface CulturalEtiquetteInsights {
  detectedLanguage: 'zh' | 'mixed' | 'es' | 'en';
  chineseCharCount: number;
  guanxiLevel: 'Alto (同胞信任 / 熟人推荐)' | 'Medio (Cercanía cultural)' | 'Bajo (Contacto frío directo)';
  politenessLevel: 'Muy Alto (客气尊敬 / 敬语)' | 'Equilibrado (商务礼貌)' | 'Directo / Informal';
  pragmatismLevel: 'Alto (降本增效 / 实用导向)' | 'Medio (Propuesta técnica)' | 'Conceptual / Marca';
  culturalAdvice: string;
}

export type StandardTone = typeof STANDARD_TONES[number];

export interface ToneScore {
  tone: string;
  score: number; // 0-100
}

export interface ToneAnalysisResult {
  primaryTones: ToneScore[];
  secondaryTones: ToneScore[];
  chineseTones?: ChineseToneScore[];
  isChineseToneDetected?: boolean;
  chineseCharCount?: number;
  culturalInsights?: CulturalEtiquetteInsights;
  structure: string; // e.g. AIDA, PAS, BAB, Gancho directo + CTA
  hookType: string; // e.g. Auditoría web, Halago, Caso de éxito, Pregunta, etc.
  length: {
    words: number;
    characters: number;
    estimatedReadingSeconds: number;
  };
  personalizationLevel: 'Baja (Genérico)' | 'Media (Sector o rol)' | 'Alta (Específico de su web/negocio)';
  ctaType: string;
  valueProposition: string;
  aiReasoning: string;
  analyzerVersion: string;
  analyzedAt: string;
  isManuallyEdited?: boolean;
}

export type OutreachChannel = 
  | 'Redbook (小红书)'
  | 'WeChat (微信)'
  | 'WhatsApp'
  | 'Recomendado (推荐)'
  | 'Email en frío'
  | 'LinkedIn DM'
  | 'Instagram DM'
  | 'Llamada / Teléfono'
  | 'Formulario web';

export type ServiceOffered =
  | 'Rediseño web corporativo'
  | 'Landing page de alta conversión'
  | 'E-commerce Shopify/Woo'
  | 'Desarrollo web a medida'
  | 'Optimización WPO y UX'
  | 'Mantenimiento & Soporte continuo';

export type BusinessSector =
  | 'Hostelería y Restauración'
  | 'Salud y Clínicas Médicas'
  | 'E-commerce y Retail'
  | 'Inmobiliaria y Promoción'
  | 'Servicios Profesionales y Legal'
  | 'SaaS y Startups Tecnológicas'
  | 'Industria y Fabricación'
  | 'Educación y Formación'
  | 'Construcción y Reformas'
  | 'Fitness y Bienestar'
  | 'Diseño y Creatividad'
  | 'Otro';

export type LeadPriority = 'Baja' | 'Media' | 'Alta' | 'Urgente';

export type Status0SecondaryReason =
  | 'No responde tras varios intentos'
  | 'Rechazo explícito'
  | 'No es el decisor adecuado'
  | 'Email o contacto inválido'
  | 'Otro';

export type LeadOrigin = 
  | 'Redbook (Inbound - Nos contactan)'
  | 'Redbook (Outbound - Contactamos nosotros)'
  | 'WeChat (Inbound - Nos agregan / contactan)'
  | 'WeChat (Outbound - Contactamos nosotros)'
  | 'Recomendado / Referido (推荐)'
  | 'WhatsApp Directo'
  | 'Web Inbound / Formulario'
  | 'Prospección Activa / Scraping'
  | 'Otro';

export type RejectionReason =
  | 'Precio'
  | 'Falta de presupuesto'
  | 'No ve suficiente valor'
  | 'No necesita web'
  | 'Ya tiene proveedor'
  | 'Mal momento'
  | 'Falta de confianza'
  | 'Funcionalidades insuficientes'
  | 'Decisión aplazada'
  | 'Eligió a la competencia'
  | 'Otro';

export interface StatusTransition {
  id: string;
  fromStatus: CommercialStatus;
  toStatus: CommercialStatus;
  date: string;
  durationDays?: number; // Días que permaneció en la etapa previa
  notes?: string;
}

export interface MessageInteraction {
  id: string;
  date: string;
  channel: OutreachChannel;
  messageType: 'inicial' | 'seguimiento' | 'negociacion';
  templateOrVariantId?: string;
  templateName?: string;
  body: string;
  toneAnalysis?: ToneAnalysisResult;
  responseReceived: boolean;
  responseDate?: string;
  responseText?: string;
  interactionResult: 
    | 'Sin respuesta'
    | 'Respuesta positiva'
    | 'Pidió más info'
    | 'Agendó demo'
    | 'Objeción planteada'
    | 'Rechazo respetuoso'
    | 'Petición de baja (No contactar)';
}

export interface Lead {
  id: string;
  commercialName: string; // Nombre comercial (ej: 喜茶 Heytea, 寻味餐饮)
  companyName: string; // Razón social o empresa
  contactPerson: string; // Persona de contacto (ej: 张伟, 王敏)
  currentWebsite: string; // URL web actual
  socialUrl: string; // Redbook, WeChat ID, etc.
  sector: BusinessSector;
  location: string; // Ciudad / Provincia / País (ej: Madrid - Usera, Barcelona - Eixample, Valencia, Shanghai)
  email: string;
  phone: string;
  channel: OutreachChannel;
  createdAt: string; // Fecha de alta
  firstContactDate: string; // Fecha del primer contacto
  lastContactDate?: string; // Día del último contacto
  contactTone?: string; // Tono del mensaje de contacto
  leadSource: LeadOrigin | string; // Origen del lead: si de Redbook nos contactan, si contactamos nosotros, recomendados
  isPendingContact?: boolean; // Opción: Pendiente de contactar (aún sin primer mensaje enviado)
  offeredService: ServiceOffered;
  estimatedBudget: number | null; // Presupuesto estimado (€) o null si "Aún no especificado"
  potentialValue: number | null; // Valor potencial (€)
  priority: LeadPriority;
  assignedTo: string; // Responsable
  notes: string;
  nextFollowUpDate: string;
  
  // Commercial Status (0 to 5)
  status: CommercialStatus;
  
  // Specific stage parameters
  status0Reason?: Status0SecondaryReason;
  status0Notes?: string;
  
  lastResponseDate?: string;
  followUpsCount?: number;
  
  demoScheduledDate?: string;
  detectedNeeds?: string;
  relevantValueProp?: string;
  
  rejectionReasons?: RejectionReason[];
  rejectionNotes?: string;
  rejectionKeywords?: string[]; // Palabras clave del rechazo para análisis posterior (#PRECIO, #PROVEEDOR_ACTUAL, etc.)
  
  pendingObjections?: string[];
  negotiationPhase?: 'Propuesta enviada' | 'Revisión presupuestaria' | 'Ajuste de alcance' | 'Enviado contrato/legal';
  lastInteractionDate?: string;
  
  closedDate?: string;
  agreedAmount?: number; // Importe acordado (€)
  contractedService?: string;
  optionalCosts?: number; // Costes opcionales (€)
  collectedAmount?: number; // Ingresos efectivamente cobrados (€)
  closingNotes?: string;

  // GDPR & privacy
  doNotContact: boolean; // Lista Robinson / Baja solicitada
  doNotContactReason?: string;
  isArchived: boolean;
  
  // Full tracking history
  transitions: StatusTransition[];
  interactions: MessageInteraction[];
  
  isDemo?: boolean;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  hypothesis: string;
  primaryTone: string;
  channel: OutreachChannel;
  targetSegment: BusinessSector | 'Multisector';
  startDate: string;
  templateText: string;
  sampleSizeMinTarget: number;
  status: 'Activo' | 'Pausado' | 'Concluido';
  isDemo?: boolean;
}

export interface OutreachTemplate {
  id: string;
  name: string;
  category: 'Inicial' | 'Seguimiento' | 'Reactiva' | 'Objeciones' | 'Cierre';
  channel: OutreachChannel;
  primaryTone: string;
  hookType: string;
  text: string;
  description: string;
}

export interface AppSettings {
  currency: 'EUR' | 'USD';
  dateFormat: 'DD/MM/YYYY' | 'YYYY-MM-DD';
  agencyName: string;
  defaultResponsible: string;
  dataRetentionMonths: number;
  strictGdprMode: boolean;
}
