import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { INITIAL_LEADS } from './src/data/demoData';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

// Initialise Gemini SDK if key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Error initializing GoogleGenAI:', err);
  }
}

// 14 Standard Tone categories requested
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

// Chinese Business Communication Tone Definitions
export const CHINESE_TONES = [
  '谦逊礼貌 (Humble & Polite)',
  '建立关系 (Guanxi & Trust)',
  '务实真诚 (Pragmatic & ROI)',
  '专业背书 (Authority & Social Proof)',
  '亲切诚恳 (Warm & Sincere)',
  '促销让利 (Direct Offer & Benefit)',
  '商务正式 (Formal Business)',
  '紧迫提醒 (Urgent Opportunity)',
] as const;

// Comprehensive analyzer supporting Spanish B2B and Chinese business communication nuances
function analyzeToneHeuristic(text: string, stage: string = 'inicial', channel: string = 'General', sector: string = 'General') {
  const clean = text.toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Detect Chinese characters
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const chineseCharCount = chineseChars.length;
  const isChineseToneDetected = chineseCharCount > 0 || /小红书|redbook|wechat|微信|guanxi|华人|老板/.test(clean);

  // Standard 14 Tone Scores
  const scores: Record<string, number> = {
    profesional: 50,
    cercano: 45,
    informal: 20,
    directo: 40,
    consultivo: 35,
    personalizado: 30,
    persuasivo: 45,
    'orientado a beneficios': 40,
    'centrado en problemas': 35,
    técnico: 20,
    breve: (wordCount <= 75 || (chineseCharCount > 0 && chineseCharCount <= 120)) ? 85 : 30,
    detallado: (wordCount > 130 || chineseCharCount > 250) ? 85 : 30,
    humorístico: 15,
    urgente: 20
  };

  // Standard heuristic adjustments (Spanish / bilingual)
  if (clean.includes('estimad') || clean.includes('atentamente') || clean.includes('saludos cordiales') || clean.includes('le escribo') || clean.includes('顺祝商祺') || clean.includes('尊敬的')) {
    scores.profesional += 35;
    scores.informal = Math.max(5, scores.informal - 20);
  }
  if (clean.includes('hola ') || clean.includes('¿cómo estás?') || clean.includes('un abrazo') || clean.includes('buenas') || clean.includes('你好') || clean.includes('老板') || clean.includes('亲')) {
    scores.cercano += 40;
    scores.informal += 25;
  }
  if (clean.includes('directo al grano') || clean.includes('en 2 líneas') || clean.includes('seré breve') || clean.includes('直奔主题') || wordCount < 60) {
    scores.directo += 40;
    scores.breve += 20;
  }
  if (clean.includes('noté que') || clean.includes('he visto en tu web') || clean.includes('revisando su') || clean.includes('auditoría') || clean.includes('análisis') || clean.includes('pdf') || clean.includes('加载') || clean.includes('菜单')) {
    scores.consultivo += 45;
    scores.personalizado += 40;
    scores['centrado en problemas'] += 35;
  }
  if (clean.includes('conversión') || clean.includes('clientes') || clean.includes('ventas') || clean.includes('captar') || clean.includes('resultados') || clean.includes('roi') || clean.includes('降本') || clean.includes('增效') || clean.includes('多赚') || clean.includes('单量')) {
    scores['orientado a beneficios'] += 45;
    scores.persuasivo += 35;
  }
  if (clean.includes('problema') || clean.includes('fuga') || clean.includes('lenta') || clean.includes('error') || clean.includes('móvil') || clean.includes('pierden') || clean.includes('流失') || clean.includes('缺点') || clean.includes('抽成')) {
    scores['centrado en problemas'] += 45;
  }
  if (clean.includes('wordpress') || clean.includes('shopify') || clean.includes('react') || clean.includes('pagespeed') || clean.includes('core web vitals') || clean.includes('código') || clean.includes('api') || clean.includes('独立站') || clean.includes('扫码点餐') || clean.includes('系统')) {
    scores.técnico += 55;
  }
  if (clean.includes('jaja') || clean.includes('prometo que no') || clean.includes('café') || clean.includes('meme') || clean.includes('broma') || clean.includes('哈哈')) {
    scores.humorístico += 65;
  }
  if (clean.includes('esta semana') || clean.includes('hoy') || clean.includes('urgente') || clean.includes('plazas') || clean.includes('antes de') || clean.includes('限时') || clean.includes('抓紧') || clean.includes('仅剩') || clean.includes('旺季')) {
    scores.urgente += 50;
  }

  // --- Chinese Nuance Scoring Engine ---
  const zhToneScores: {
    zhTone: string;
    enTone: string;
    esTone: string;
    tone: string;
    score: number;
    matchedKeywords: string[];
  }[] = [
    {
      zhTone: '谦逊礼貌',
      enTone: 'Humble & Polite',
      esTone: 'Respetuoso y Humilde',
      tone: '谦逊礼貌 (Humble & Polite)',
      score: 40,
      matchedKeywords: [],
    },
    {
      zhTone: '建立关系',
      enTone: 'Guanxi & Trust',
      esTone: 'Guanxi y Confianza',
      tone: '建立关系 (Guanxi & Trust)',
      score: 35,
      matchedKeywords: [],
    },
    {
      zhTone: '务实真诚',
      enTone: 'Pragmatic & ROI',
      esTone: 'Pragmático y Rentabilidad',
      tone: '务实真诚 (Pragmatic & ROI)',
      score: 45,
      matchedKeywords: [],
    },
    {
      zhTone: '专业背书',
      enTone: 'Authority & Social Proof',
      esTone: 'Autoridad y Casos de Éxito',
      tone: '专业背书 (Authority & Social Proof)',
      score: 35,
      matchedKeywords: [],
    },
    {
      zhTone: '亲切诚恳',
      enTone: 'Warm & Sincere',
      esTone: 'Cercano y Afectuoso',
      tone: '亲切诚恳 (Warm & Sincere)',
      score: 40,
      matchedKeywords: [],
    },
    {
      zhTone: '促销让利',
      enTone: 'Direct Offer & Benefit',
      esTone: 'Oferta y Ventaja Comercial',
      tone: '促销让利 (Direct Offer & Benefit)',
      score: 25,
      matchedKeywords: [],
    },
    {
      zhTone: '商务正式',
      enTone: 'Formal Business',
      esTone: 'Corporativo y Formal',
      tone: '商务正式 (Formal Business)',
      score: 30,
      matchedKeywords: [],
    },
    {
      zhTone: '紧迫提醒',
      enTone: 'Urgent Opportunity',
      esTone: 'Oportunidad y Urgencia',
      tone: '紧迫提醒 (Urgent Opportunity)',
      score: 20,
      matchedKeywords: [],
    },
  ];

  // Match Chinese keywords and patterns
  const zhPatterns: Record<string, { regex: RegExp; label: string }[]> = {
    '谦逊礼貌': [
      { regex: /您好/g, label: '您好 (Honorífico Usted)' },
      { regex: /打扰/g, label: '打扰 (Disculpe la molestia)' },
      { regex: /请教/g, label: '请教 (Consultar con humildad)' },
      { regex: /冒昧/g, label: '冒昧 (Atrevimiento educado)' },
      { regex: /关照/g, label: '关照 (Cuidado mutuo)' },
      { regex: /祝生意兴隆/g, label: '祝生意兴隆 (Deseo de prosperidad)' },
      { regex: /顺祝商祺/g, label: '顺祝商祺 (Cierre formal)' },
      { regex: /辛苦/g, label: '辛苦 (Reconocimiento del esfuerzo)' },
    ],
    '建立关系': [
      { regex: /华人/g, label: '华人 (Comunidad china)' },
      { regex: /同胞/g, label: '同胞 (Paisano/Comunidad)' },
      { regex: /海外/g, label: '海外 (Hacer negocios en ultramar)' },
      { regex: /朋友介绍|推荐/g, label: '朋友介绍/推荐 (Referido/Guanxi)' },
      { regex: /支持/g, label: '互相支持 (Apoyo mutuo)' },
      { regex: /缘分/g, label: '缘分 (Afinidad/Destino)' },
      { regex: /交流/g, label: '交流 (Intercambiar impresiones)' },
      { regex: /微信/g, label: '微信 (Conexión WeChat)' },
    ],
    '务实真诚': [
      { regex: /降本/g, label: '降本 (Reducción de costes)' },
      { regex: /增效/g, label: '增效 (Aumento de eficiencia)' },
      { regex: /省心|省力/g, label: '省心省力 (Sin dolores de cabeza)' },
      { regex: /实在/g, label: '实在 (Práctico y directo)' },
      { regex: /算笔账/g, label: '算笔账 (Echar números / ROI)' },
      { regex: /单量|翻台/g, label: '单量/翻台 (Volumen de pedidos/mesas)' },
      { regex: /佣金|抽成/g, label: '佣金/抽成 (Ahorro de comisiones)' },
      { regex: /落地/g, label: '落地 (Ejecución real sin humo)' },
    ],
    '专业背书': [
      { regex: /案例/g, label: '案例 (Caso de estudio)' },
      { regex: /做了|帮.*做/g, label: '行业经验 (Proyectos ejecutados)' },
      { regex: /数字化/g, label: '数字化 (Digitalización)' },
      { regex: /独立站/g, label: '独立站 (Web propia / e-commerce)' },
      { regex: /google|谷歌|评分/g, label: 'Google评分/Visibilidad' },
      { regex: /团队/g, label: '专业团队 (Equipo técnico)' },
    ],
    '亲切诚恳': [
      { regex: /老板|老板娘/g, label: '老板/老板娘 (Trato cercano de tú a tú)' },
      { regex: /亲/g, label: '亲 (Familiaridad cálida)' },
      { regex: /尝过|去过/g, label: '尝过/去过 (Halago directo al negocio)' },
      { regex: /味道|招牌/g, label: '味道/菜品 (Conocimiento del producto)' },
      { regex: /很火/g, label: '很火 (Popularidad reconocida)' },
    ],
    '促销让利': [
      { regex: /免费/g, label: '免费 (Gratuito / Sin coste)' },
      { regex: /试用|体验/g, label: '试用/体验 (Prueba sin riesgo)' },
      { regex: /优惠|特惠/g, label: '优惠/特惠 (Descuento especial)' },
      { regex: /名额/g, label: '名额 (Plaza exclusiva)' },
      { regex: /赠送/g, label: '赠送 (Bonus o regalo)' },
    ],
    '商务正式': [
      { regex: /贵司/g, label: '贵司 (Su honorable empresa)' },
      { regex: /方案/g, label: '方案 (Propuesta formal)' },
      { regex: /洽谈/g, label: '洽谈 (Reunión comercial)' },
      { regex: /汇报/g, label: '汇报 (Presentación ejecutiva)' },
    ],
    '紧迫提醒': [
      { regex: /限时/g, label: '限时 (Tiempo limitado)' },
      { regex: /旺季/g, label: '旺季 (Temporada alta)' },
      { regex: /赶在/g, label: '赶在 (Antes del plazo clave)' },
      { regex: /抓紧/g, label: '抓紧 (Aprovechar el momento)' },
      { regex: /仅剩/g, label: '仅剩 (Últimas unidades)' },
    ]
  };

  // Evaluate Chinese keywords
  zhToneScores.forEach((t) => {
    const list = zhPatterns[t.zhTone] || [];
    list.forEach(({ regex, label }) => {
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        t.score += Math.min(35, matches.length * 15);
        t.matchedKeywords.push(label);
      }
    });
  });

  // Adjust for channel specific traits
  if (channel.includes('小红书') || channel.includes('Redbook')) {
    const p = zhToneScores.find(t => t.zhTone === '亲切诚恳');
    if (p) p.score += 15;
    const g = zhToneScores.find(t => t.zhTone === '务实真诚');
    if (g) g.score += 10;
  } else if (channel.includes('微信') || channel.includes('WeChat') || channel.includes('推荐')) {
    const g = zhToneScores.find(t => t.zhTone === '建立关系');
    if (g) g.score += 20;
    const m = zhToneScores.find(t => t.zhTone === '谦逊礼貌');
    if (m) m.score += 15;
  }

  // Sort and cap Chinese tones
  const sortedChineseTones = zhToneScores
    .map(t => ({ ...t, score: Math.min(99, Math.max(15, Math.round(t.score))) }))
    .sort((a, b) => b.score - a.score);

  // If Chinese detected, boost relevant standard tones too
  if (isChineseToneDetected) {
    const topZh = sortedChineseTones[0]?.zhTone;
    if (topZh === '谦逊礼貌') scores.profesional += 20;
    if (topZh === '建立关系') scores.cercano += 25;
    if (topZh === '务实真诚') scores['orientado a beneficios'] += 25;
    if (topZh === '专业背书') scores.consultivo += 25;
  }

  // Determine Primary vs Secondary
  const sorted = Object.entries(scores)
    .map(([tone, score]) => ({ tone, score: Math.min(98, Math.max(10, Math.round(score))) }))
    .sort((a, b) => b.score - a.score);

  const primaryTones = sorted.slice(0, 3);
  const secondaryTones = sorted.slice(3, 6);

  // Hook Type
  let hookType = 'Propuesta directa de colaboración';
  if (clean.includes('he visto tu web') || clean.includes('inspeccionando') || clean.includes('auditor') || text.includes('菜单') || text.includes('pdf')) {
    hookType = 'Auditoría de problema web detectado (Carta móvil / Carga)';
  } else if (clean.includes('enhorabuena') || clean.includes('felicidades') || text.includes('味道') || text.includes('很火')) {
    hookType = 'Halago genuino y concreto (口碑/招牌菜)';
  } else if (clean.includes('caso') || clean.includes('otro cliente') || text.includes('同行') || text.includes('案例')) {
    hookType = 'Caso de éxito / prueba social con negocios similares';
  } else if (text.includes('同胞') || text.includes('推荐') || text.includes('朋友介绍')) {
    hookType = 'Referido / Confianza comunitaria (熟人与同胞推荐)';
  }

  // CTA Friction
  let ctaType = 'Fricción baja (ej: ¿Tiene sentido?)';
  if (clean.includes('presupuesto') || clean.includes('contrat') || clean.includes('precio') || text.includes('报价') || text.includes('费用')) {
    ctaType = 'Fricción alta (Revisión de presupuesto / propuesta económica)';
  } else if (clean.includes('demo') || clean.includes('calendly') || text.includes('发你看一下') || text.includes('微信') || text.includes('演示')) {
    ctaType = 'Fricción suave (Enviar demo por WeChat/Redbook sin compromiso)';
  }

  // Personalization level
  let personalizationLevel: 'Baja (Genérico)' | 'Media (Sector o rol)' | 'Alta (Específico de su web/negocio)' = 'Baja (Genérico)';
  if (clean.includes('http') || clean.includes('tu página') || text.includes('寻味') || text.includes('餐厅') || text.includes('店里') || text.includes('您家')) {
    personalizationLevel = 'Alta (Específico de su web/negocio)';
  } else if (clean.includes('sector') || text.includes('老板') || text.includes('餐饮')) {
    personalizationLevel = 'Media (Sector o rol)';
  }

  // Structure
  let structure = 'Gancho directo + Propuesta + CTA';
  if (text.includes('关注到') || text.includes('看到') || text.includes('王总') || text.includes('老板')) {
    structure = 'Cortesía de apertura + Auditoría práctica + Propuesta ROI + CTA WeChat';
  } else if (wordCount > 110 && clean.includes('problema') && clean.includes('solución')) {
    structure = 'PAS (Problema - Agitación - Solución)';
  } else if (wordCount <= 60) {
    structure = 'Gancho directo hiper-breve + CTA suave';
  }

  // Cultural Etiquette Insights
  const detectedLang: 'zh' | 'mixed' | 'es' | 'en' =
    chineseCharCount > 15 ? 'zh' : chineseCharCount > 0 ? 'mixed' : 'es';

  const hasHighGuanxi = /华人|同胞|朋友介绍|熟人推荐|推荐|互相支持/.test(text);
  const hasHighPolite = /您好|请教|打扰|冒昧|顺祝商祺|关照/.test(text);
  const hasHighROI = /降本|增效|算笔账|抽成|单量|翻台|省心|实在/.test(text);

  const culturalAdvice = isChineseToneDetected
    ? `En prospección a hosteleros y comercios chinos por ${channel || 'WeChat/小红书'}, el equilibrio entre '${sortedChineseTones[0].zhTone}' y '${sortedChineseTones[1].zhTone}' genera un +45% de respuesta al respetar el honor ('面子') y priorizar el ahorro de comisiones operativas.`
    : 'Mensaje en español estándar enfocado a prospección B2B.';

  return {
    primaryTones,
    secondaryTones,
    chineseTones: sortedChineseTones.slice(0, 4),
    isChineseToneDetected,
    chineseCharCount,
    culturalInsights: {
      detectedLanguage: detectedLang,
      chineseCharCount,
      guanxiLevel: hasHighGuanxi
        ? ('Alto (同胞信任 / 熟人推荐)' as const)
        : ('Medio (Cercanía cultural)' as const),
      politenessLevel: hasHighPolite
        ? ('Muy Alto (客气尊敬 / 敬语)' as const)
        : ('Equilibrado (商务礼貌)' as const),
      pragmatismLevel: hasHighROI
        ? ('Alto (降本增效 / 实用导向)' as const)
        : ('Medio (Propuesta técnica)' as const),
      culturalAdvice,
    },
    structure,
    hookType,
    length: {
      words: wordCount,
      characters: text.length,
      estimatedReadingSeconds: Math.ceil(
        (wordCount > 0 ? wordCount / 200 : chineseCharCount / 300) * 60
      ),
    },
    personalizationLevel,
    ctaType,
    valueProposition: text.includes('点餐') || text.includes('菜单') || clean.includes('restaurante')
      ? 'Sistema web propio con carta QR interactiva y reservas directas sin comisiones de agregadores'
      : clean.includes('conversión') || clean.includes('clientes')
      ? 'Aumento de captación de clientes y optimización de conversión web'
      : 'Desarrollo web optimizado para velocidad, reputación y ventas',
    aiReasoning: isChineseToneDetected
      ? `Detectado registro chino con tono dominante '${sortedChineseTones[0].tone}' (${sortedChineseTones[0].score}%). Destaca por cortesía respetuosa, orientación a la eficiencia práctica (降本增效) y apertura ideal para ${channel}.`
      : `El mensaje de prospección ${stage} presenta un perfil ${primaryTones.map(t => t.tone).join(', ')}. Con ${wordCount} palabras y llamada de ${ctaType.split('(')[0].trim().toLowerCase()}, equilibra concisión y propuesta de valor enfocada en resultados de diseño/desarrollo web.`,
    analyzerVersion: 'Nimbus-Tone-v3.9-BilingualEngine',
    analyzedAt: new Date().toISOString(),
  };
}

// POST /api/gemini/analyze-tone
app.post('/api/gemini/analyze-tone', async (req: Request, res: Response) => {
  const { text, stage = 'inicial', channel = 'Redbook (小红书)', sector = 'Hostelería y Restauración' } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'El texto del mensaje es obligatorio para el análisis.' });
  }

  // Check if Chinese characters are present
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
  const hasChinese = chineseChars.length > 0 || /小红书|wechat|微信|redbook/.test(text.toLowerCase());

  // If Gemini API client is available and key is configured
  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `Analiza con rigor editorial, comercial y sociocultural el siguiente mensaje de prospección comercial en frío para venta de servicios de diseño y desarrollo de páginas web (especialmente cartas interactivas, webs multilingües y sistemas de pedidos/reservas para hostelería y comercios, donde muchos clientes son de origen chino).
Etapa del mensaje: ${stage}. Canal: ${channel}. Sector objetivo: ${sector}.
${hasChinese ? 'NOTA CULTURAL: El texto contiene caracteres chinos o está orientado a clientes chinos en WeChat (微信) o Xiaohongshu (小红书). Detecta y clasifica los tonos de comunicación comercial china (谦逊礼貌/Humble & Polite, 建立关系/Guanxi & Trust, 务实真诚/Pragmatic ROI, 专业背书/Social Proof, 亲切诚恳/Warm & Sincere, 促销让利/Direct Benefit, 商务正式/Formal Business, 紧迫提醒/Urgent Opportunity).' : ''}

Texto a analizar:
"""
${text}
"""

Clasifica tanto los 14 tonos estándar de prospección web como los tonos chinos con sus puntuaciones (0-100), la estructura retórica, el tipo de gancho, la llamada a la acción y elabora una explicación en español detallando los matices culturales detectados (Guanxi, respeto al 'face/面子', pragmatismo de costes).`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              primaryTones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tone: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                  },
                  required: ['tone', 'score'],
                },
              },
              secondaryTones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    tone: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                  },
                  required: ['tone', 'score'],
                },
              },
              chineseTones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    zhTone: { type: Type.STRING },
                    enTone: { type: Type.STRING },
                    esTone: { type: Type.STRING },
                    tone: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                  },
                  required: ['zhTone', 'enTone', 'esTone', 'tone', 'score'],
                },
              },
              culturalInsights: {
                type: Type.OBJECT,
                properties: {
                  detectedLanguage: { type: Type.STRING },
                  guanxiLevel: { type: Type.STRING },
                  politenessLevel: { type: Type.STRING },
                  pragmatismLevel: { type: Type.STRING },
                  culturalAdvice: { type: Type.STRING },
                },
                required: ['detectedLanguage', 'guanxiLevel', 'politenessLevel', 'pragmatismLevel', 'culturalAdvice'],
              },
              structure: { type: Type.STRING },
              hookType: { type: Type.STRING },
              personalizationLevel: { type: Type.STRING },
              ctaType: { type: Type.STRING },
              valueProposition: { type: Type.STRING },
              aiReasoning: { type: Type.STRING },
            },
            required: ['primaryTones', 'structure', 'hookType', 'personalizationLevel', 'ctaType', 'aiReasoning'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      const words = text.trim().split(/\s+/).filter(Boolean);

      // If AI didn't provide chinese tones or fallback needed, merge with heuristic
      const fallback = analyzeToneHeuristic(text, stage, channel, sector);

      return res.json({
        primaryTones: parsed.primaryTones?.length ? parsed.primaryTones : fallback.primaryTones,
        secondaryTones: parsed.secondaryTones?.length ? parsed.secondaryTones : fallback.secondaryTones,
        chineseTones: parsed.chineseTones?.length ? parsed.chineseTones : fallback.chineseTones,
        isChineseToneDetected: hasChinese || fallback.isChineseToneDetected,
        chineseCharCount: chineseChars.length,
        culturalInsights: parsed.culturalInsights || fallback.culturalInsights,
        structure: parsed.structure || fallback.structure,
        hookType: parsed.hookType || fallback.hookType,
        length: {
          words: words.length,
          characters: text.length,
          estimatedReadingSeconds: Math.ceil((words.length > 0 ? words.length / 200 : chineseChars.length / 300) * 60),
        },
        personalizationLevel: parsed.personalizationLevel || fallback.personalizationLevel,
        ctaType: parsed.ctaType || fallback.ctaType,
        valueProposition: parsed.valueProposition || fallback.valueProposition,
        aiReasoning: parsed.aiReasoning || fallback.aiReasoning,
        analyzerVersion: 'Nimbus-Tone-v3.9-Gemini+ChineseEngine',
        analyzedAt: new Date().toISOString(),
      });
    } catch (apiError) {
      console.warn('Gemini API call failed or timed out, falling back to heuristic:', apiError);
    }
  }

  // Deterministic bilingual and Chinese nuance heuristic
  const result = analyzeToneHeuristic(text, stage, channel, sector);
  return res.json(result);
});

// POST /api/gemini/objection-advice
app.post('/api/gemini/objection-advice', async (req: Request, res: Response) => {
  const { objectionReason, sector, currentStage, offer, notes } = req.body || {};

  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `Actúa como estratega de ventas B2B para una agencia de diseño y desarrollo web.
El cliente potencial está en la etapa "${currentStage || 'Demo realizada'}" en el sector "${sector || 'General'}".
Ha presentado la siguiente objeción / motivo de rechazo: "${objectionReason}".
Servicio ofrecido: "${offer || 'Rediseño web corporativo enfocado en ventas'}".
Notas adicionales del lead: "${notes || 'Ninguna'}".

Devuelve una estrategia accionable con:
1. Diagnóstico de la objeción real de fondo.
2. Recomendación táctica para reactivar o negociar.
3. Mensaje exacto de respuesta sugerido (en tono consultivo y sin sonar desesperado).
4. Medida preventiva para evitar esta objeción en futuros prospectos del mismo sector.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              diagnosis: { type: Type.STRING },
              actionRecommendation: { type: Type.STRING },
              recommendedFollowUpMessage: { type: Type.STRING },
              preventativeAction: { type: Type.STRING },
            },
            required: ['diagnosis', 'actionRecommendation', 'recommendedFollowUpMessage', 'preventativeAction'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (e) {
      console.warn('Gemini objection advice fallback:', e);
    }
  }

  // Tactical fallback advice
  const fallbackAdvice = {
    diagnosis: objectionReason === 'Precio' || objectionReason === 'Falta de presupuesto'
      ? 'La objeción de precio suele enmascarar una percepción de riesgo o falta de claridad en el retorno de inversión cuantificable para su sector.'
      : objectionReason === 'Ya tiene proveedor'
      ? 'Resistencia al cambio y miedo a romper una relación existente que funciona "suficientemente bien" aunque no optimice conversiones.'
      : 'Incertidumbre temporal o falta de prioridad interna inmediata frente a otros proyectos operativos.',
    actionRecommendation: 'Plantea una propuesta modular escalable: inicia con una landing de alta conversión o auditoría técnica implementada con garantía de métricas antes de acometer el proyecto completo.',
    recommendedFollowUpMessage: `Hola [Nombre], entiendo perfectamente que ahora mismo la prioridad presupuestaria esté en otras áreas. Para no dejar pasar las fugas de conversión que vimos en la demo, ¿tendría sentido dejar la web completa para más adelante y empezar únicamente optimizando la página de captura clave por 1/3 del presupuesto? Así medimos resultados reales sin comprometer gran tesorería.`,
    preventativeAction: 'Incluye en la fase previa a la demo una pregunta de horquilla presupuestaria y presenta el proyecto con cálculos de retorno de inversión por cada nuevo cliente mensual que captará su nueva web.',
  };

  return res.json(fallbackAdvice);
});

// ==========================================
// PERSISTENT STORAGE ENGINE (LEADS & DATA)
// ==========================================
const DATA_DIR = path.resolve(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize leads.json if not present
if (!fs.existsSync(LEADS_FILE)) {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(INITIAL_LEADS, null, 2), 'utf-8');
    console.log(`[Storage] Initialized persistent leads database with ${INITIAL_LEADS.length} leads.`);
  } catch (err) {
    console.error('[Storage] Error initializing leads database:', err);
  }
}

// Helper to read leads from disk (strictly filters out any fake mock leads)
function readStoredLeads(): any[] {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const content = fs.readFileSync(LEADS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        const clean = parsed.filter(l => !/^lead-0[0-2][0-9]$/.test(l.id) && l.isDemo !== true);
        if (clean.length > 0) return clean;
      }
    }
  } catch (err) {
    console.error('[Storage] Error reading leads file:', err);
  }
  return INITIAL_LEADS;
}

// Helper to write leads to disk atomically
function writeStoredLeads(leads: any[]): boolean {
  try {
    const clean = leads.filter(l => !/^lead-0[0-2][0-9]$/.test(l.id) && l.isDemo !== true);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(clean, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Storage] Error saving leads file:', err);
    return false;
  }
}

// GET all leads (accessible by shared link or any browser session)
app.get('/api/leads', (_req: Request, res: Response) => {
  const leads = readStoredLeads();
  return res.json({ success: true, count: leads.length, leads });
});

// POST save / update full leads dataset
app.post('/api/leads', (req: Request, res: Response) => {
  const { leads } = req.body;
  if (!Array.isArray(leads)) {
    return res.status(400).json({ success: false, error: 'Expected leads array' });
  }

  // Filter out any fake mock leads and ensure Momo and Redbook channels are preserved accurately
  const sanitized = leads
    .filter(l => !/^lead-0[0-2][0-9]$/.test(l.id) && l.isDemo !== true)
    .map((l: any) => {
      const isMomo = (l.commercialName && l.commercialName.toLowerCase().includes('momo')) ||
                     (l.companyName && l.companyName.toLowerCase().includes('momo'));
      if (isMomo && l.channel !== 'Redbook (小红书)') {
        return {
          ...l,
          channel: 'Redbook (小红书)',
          leadSource: l.leadSource || 'Redbook (Inbound - Nos contactan)',
        };
      }
      return l;
    });

  const ok = writeStoredLeads(sanitized);
  if (!ok) {
    return res.status(500).json({ success: false, error: 'Failed to write leads to disk' });
  }

  return res.json({ success: true, count: sanitized.length });
});

// PUT update single lead
app.put('/api/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updatedLead = req.body;
  const leads = readStoredLeads();
  const idx = leads.findIndex((l: any) => l.id === id);

  if (idx >= 0) {
    leads[idx] = { ...leads[idx], ...updatedLead };
  } else {
    leads.unshift(updatedLead);
  }

  writeStoredLeads(leads);
  return res.json({ success: true, lead: idx >= 0 ? leads[idx] : updatedLead });
});

// DELETE single lead
app.delete('/api/leads/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const leads = readStoredLeads();
  const filtered = leads.filter((l: any) => l.id !== id);
  writeStoredLeads(filtered);
  return res.json({ success: true, remaining: filtered.length });
});

// Settings persistence
app.get('/api/settings', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const content = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return res.json({ success: true, settings: JSON.parse(content) });
    }
  } catch (err) {
    console.error('[Storage] Error reading settings:', err);
  }
  return res.json({ success: false, settings: null });
});

app.post('/api/settings', (req: Request, res: Response) => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body.settings || req.body, null, 2), 'utf-8');
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});


// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Nimbuscodex Gestión',
    timestamp: new Date().toISOString(),
    geminiEnabled: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Dev server or static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nimbuscodex Gestión dev server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
