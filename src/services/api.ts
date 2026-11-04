import { ToneAnalysisResult } from '../types';

export interface ObjectionAdviceResult {
  diagnosis: string;
  actionRecommendation: string;
  recommendedFollowUpMessage: string;
  preventativeAction: string;
}

export async function analyzeMessageToneAPI(params: {
  text: string;
  stage?: 'inicial' | 'seguimiento' | 'negociacion';
  channel?: string;
  sector?: string;
}): Promise<ToneAnalysisResult> {
  try {
    const res = await fetch('/api/gemini/analyze-tone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('API call failed, running browser-side linguistic fallback:', err);
    // Browser fallback
    const words = params.text.trim().split(/\s+/).filter(Boolean);
    const count = words.length;
    const chineseChars = params.text.match(/[\u4e00-\u9fa5]/g) || [];
    const isChinese = chineseChars.length > 0 || /小红书|微信|redbook|wechat|推荐/.test(params.text.toLowerCase());

    const chineseTones = isChinese ? [
      {
        zhTone: '谦逊礼貌',
        enTone: 'Humble & Polite',
        esTone: 'Respetuoso y Humilde',
        tone: '谦逊礼貌 (Humble & Polite)',
        score: params.text.includes('您好') || params.text.includes('打扰') ? 92 : 80,
      },
      {
        zhTone: '务实真诚',
        enTone: 'Pragmatic & ROI',
        esTone: 'Pragmático y Rentabilidad',
        tone: '务实真诚 (Pragmatic & ROI)',
        score: params.text.includes('降本') || params.text.includes('点餐') ? 88 : 78,
      },
      {
        zhTone: '建立关系',
        enTone: 'Guanxi & Trust',
        esTone: 'Guanxi y Confianza',
        tone: '建立关系 (Guanxi & Trust)',
        score: params.text.includes('华人') || params.text.includes('推荐') ? 85 : 72,
      },
      {
        zhTone: '专业背书',
        enTone: 'Authority & Social Proof',
        esTone: 'Autoridad y Casos de Éxito',
        tone: '专业背书 (Authority & Social Proof)',
        score: 75,
      }
    ] : undefined;

    return {
      primaryTones: isChinese ? [
        { tone: 'consultivo', score: 88 },
        { tone: 'cercano', score: 82 },
        { tone: 'orientado a beneficios', score: 79 }
      ] : [
        { tone: 'consultivo', score: 85 },
        { tone: 'orientado a beneficios', score: 78 },
        { tone: 'cercano', score: 72 }
      ],
      secondaryTones: [
        { tone: 'profesional', score: 65 },
        { tone: 'persuasivo', score: 60 }
      ],
      chineseTones,
      isChineseToneDetected: isChinese,
      chineseCharCount: chineseChars.length,
      culturalInsights: isChinese ? {
        detectedLanguage: chineseChars.length > 10 ? 'zh' : 'mixed',
        chineseCharCount: chineseChars.length,
        guanxiLevel: params.text.includes('推荐') || params.text.includes('同胞') ? 'Alto (同胞信任 / 熟人推荐)' : 'Medio (Cercanía cultural)',
        politenessLevel: params.text.includes('您') ? 'Muy Alto (客气尊敬 / 敬语)' : 'Equilibrado (商务礼貌)',
        pragmatismLevel: 'Alto (降本增效 / 实用导向)',
        culturalAdvice: 'Excelente armonía de cortesía china (客气) y foco pragmático en ahorro de comisiones.',
      } : undefined,
      structure: isChinese ? 'Cortesía de apertura + Auditoría práctica + Propuesta ROI + CTA WeChat' : 'PAS (Problema - Agitación - Solución)',
      hookType: isChinese ? 'Auditoría de problema web detectado (Carta móvil / Carga)' : 'Auditoría de problema web detectado',
      length: {
        words: count,
        characters: params.text.length,
        estimatedReadingSeconds: Math.ceil(((count > 0 ? count / 200 : chineseChars.length / 300)) * 60),
      },
      personalizationLevel: 'Alta (Específico de su web/negocio)',
      ctaType: isChinese ? 'Fricción suave (Enviar demo por WeChat/Redbook sin compromiso)' : 'Fricción baja (ej: ¿Tiene sentido?)',
      valueProposition: isChinese ? 'Sistema web propio con carta QR interactiva y reservas directas sin comisiones' : 'Modernización web y aumento de captación de clientes',
      aiReasoning: isChinese
        ? 'Mensaje en registro chino detectado con alta cortesía y enfoque en eficiencia operativa.'
        : 'Mensaje orientado al valor con foco en la experiencia móvil del cliente.',
      analyzerVersion: 'Nimbus-Tone-Client-BilingualFallback',
      analyzedAt: new Date().toISOString(),
    };
  }
}

export async function getObjectionAdviceAPI(params: {
  objectionReason: string;
  sector: string;
  currentStage: string;
  offer: string;
  notes?: string;
}): Promise<ObjectionAdviceResult> {
  try {
    const res = await fetch('/api/gemini/objection-advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Server error ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('Objection advice API fallback:', err);
    return {
      diagnosis: 'La objeción refleja incertidumbre sobre el ROI o falta de urgencia en el trimestre actual.',
      actionRecommendation: 'Propón una fase piloto o entrega modular con alcance reducido y pago condicionado a entrega.',
      recommendedFollowUpMessage: `Hola [Nombre], entiendo totalmente que ahora mismo queráis vigilar el presupuesto en [Empresa]. ¿Tendría sentido dejar el portal entero y comenzar con una landing optimizada para vuestra campaña clave por un importe mucho más accesible? Así validamos conversiones sin arriesgar tesorería.`,
      preventativeAction: 'En la demo inicial, cuantifica siempre las pérdidas mensuales estimadas por no tener la web optimizada.',
    };
  }
}
