import React, { useState, useMemo } from 'react';
import { 
  ToneAnalysisResult, 
  ToneScore, 
  Lead, 
  OutreachChannel,
  STANDARD_TONES
} from '../types';
import { 
  Sparkles, 
  Sliders, 
  Copy, 
  Check, 
  FileText, 
  Flame, 
  HelpCircle, 
  Tag, 
  TrendingUp, 
  Layers, 
  Plus, 
  RefreshCw 
} from 'lucide-react';
import { analyzeMessageToneAPI } from '../services/api';
import { INITIAL_TEMPLATES } from '../data/templates';

interface ToneLabViewProps {
  leads: Lead[];
  onAssignToNewLead?: (text: string, toneResult: ToneAnalysisResult) => void;
}

export const ToneLabView: React.FC<ToneLabViewProps> = ({ leads, onAssignToNewLead }) => {
  const [inputText, setInputText] = useState<string>(INITIAL_TEMPLATES[0].text);
  const [stage, setStage] = useState<'inicial' | 'seguimiento' | 'negociacion'>('inicial');
  const [channel, setChannel] = useState<OutreachChannel>('Redbook (小红书)');
  const [sector, setSector] = useState<string>('Hostelería y Restauración');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(INITIAL_TEMPLATES[0].id);
  const [templateFilter, setTemplateFilter] = useState<'all' | 'chinese' | 'standard'>('all');

  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<ToneAnalysisResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Manual Tone Adjustment State
  const [editableTones, setEditableTones] = useState<ToneScore[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>('');

  // Run analysis
  const runAnalysis = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeMessageToneAPI({
        text: inputText,
        stage,
        channel,
        sector,
      });
      setAnalysisResult(result);
      setEditableTones([...result.primaryTones]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle template selection
  const handleSelectTemplate = (tmplId: string) => {
    setSelectedTemplateId(tmplId);
    const tmpl = INITIAL_TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl) {
      setInputText(tmpl.text);
      setChannel(tmpl.channel);
      if (tmpl.category === 'Seguimiento') setStage('seguimiento');
      else if (tmpl.category === 'Objeciones') setStage('negociacion');
      else setStage('inicial');
    }
  };

  // Manual adjustment of tone score
  const updateToneScore = (tone: string, newScore: number) => {
    const updated = editableTones.map((t) => (t.tone === tone ? { ...t, score: newScore } : t));
    setEditableTones(updated);
    if (analysisResult) {
      setAnalysisResult({
        ...analysisResult,
        primaryTones: updated,
        isManuallyEdited: true,
      });
    }
  };

  // Remove a tone
  const removeTone = (tone: string) => {
    const updated = editableTones.filter((t) => t.tone !== tone);
    setEditableTones(updated);
    if (analysisResult) {
      setAnalysisResult({
        ...analysisResult,
        primaryTones: updated,
        isManuallyEdited: true,
      });
    }
  };

  // Add custom tone tag
  const addToneTag = (toneName: string) => {
    if (!toneName || editableTones.some((t) => t.tone === toneName)) return;
    const next = [...editableTones, { tone: toneName, score: 80 }];
    setEditableTones(next);
    if (analysisResult) {
      setAnalysisResult({
        ...analysisResult,
        primaryTones: next,
        isManuallyEdited: true,
      });
    }
    setNewTagInput('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Database correlation: which tones generate the most demos across existing leads
  const toneBenchmarks = useMemo(() => {
    const map: Record<string, { total: number; demos: number; sales: number }> = {};
    leads.forEach((l) => {
      l.interactions.forEach((i) => {
        i.toneAnalysis?.primaryTones.forEach((t) => {
          const key = t.tone.toLowerCase();
          if (!map[key]) map[key] = { total: 0, demos: 0, sales: 0 };
          map[key].total += 1;
          if (l.status >= 2) map[key].demos += 1;
          if (l.status === 5) map[key].sales += 1;
        });
      });
    });

    return Object.entries(map)
      .map(([tone, data]) => ({
        tone,
        ...data,
        demoRate: data.total > 0 ? (data.demos / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.demos - a.demos);
  }, [leads]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto bg-[#F8FAFC]">
      {/* Intro Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Laboratorio Inteligente de Tonos & Copywriting</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Analiza mensajes en 14 dimensiones de tono, estructura AIDA/PAS, nivel de personalización y llamada a la acción
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            Motor: Gemini 3.8 Flash + Clasificador Heurístico
          </span>
        </div>
      </div>

      {/* Main Workspace: 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor & Templates (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Template Selector Bar */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Plantillas de Prospección Web:</span>
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setTemplateFilter('all')}
                  className={`px-2 py-0.5 rounded cursor-pointer font-medium transition-colors ${
                    templateFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({INITIAL_TEMPLATES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateFilter('chinese')}
                  className={`px-2 py-0.5 rounded cursor-pointer font-medium transition-colors ${
                    templateFilter === 'chinese'
                      ? 'bg-red-500 text-white shadow-2xs font-semibold'
                      : 'text-red-700 hover:bg-red-50'
                  }`}
                >
                  🇨🇳 Clientes Chinos (小红书/微信)
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateFilter('standard')}
                  className={`px-2 py-0.5 rounded cursor-pointer font-medium transition-colors ${
                    templateFilter === 'standard'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🇪🇸 B2B Estándar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {INITIAL_TEMPLATES.filter((tmpl) => {
                const isChinese = tmpl.id.includes('zh') || /小红书|微信|Redbook|WeChat/.test(tmpl.name) || /[\u4e00-\u9fa5]/.test(tmpl.text);
                if (templateFilter === 'chinese') return isChinese;
                if (templateFilter === 'standard') return !isChinese;
                return true;
              }).map((tmpl) => {
                const isZh = tmpl.id.includes('zh') || /小红书|微信/.test(tmpl.name);
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                      selectedTemplateId === tmpl.id
                        ? isZh
                          ? 'bg-red-50/90 border-red-300 text-red-950 font-semibold'
                          : 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold truncate flex items-center gap-1">
                      {isZh && <span className="text-[10px]">🇨🇳</span>}
                      <span className="truncate">{tmpl.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {tmpl.category} · {tmpl.channel} · Tono {tmpl.primaryTone}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message Context Selectors */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Etapa del Mensaje</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:bg-white focus:border-indigo-500"
                >
                  <option value="inicial">Mensaje Inicial (Cold Outreach)</option>
                  <option value="seguimiento">Seguimiento (Follow-up)</option>
                  <option value="negociacion">Negociación / Cierre</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-medium">Canal de Envío</label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:bg-white focus:border-indigo-500"
                >
                  <option value="Redbook (小红书)">Redbook (小红书)</option>
                  <option value="WeChat (微信)">WeChat (微信)</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Recomendado (推荐)">Recomendado (推荐)</option>
                  <option value="Email en frío">Email en frío</option>
                  <option value="LinkedIn DM">LinkedIn DM</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-medium">Sector del Cliente</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:bg-white focus:border-indigo-500"
                >
                  <option value="Hostelería y Restauración">Hostelería y Restauración</option>
                  <option value="Salud y Clínicas Médicas">Salud y Clínicas Médicas</option>
                  <option value="E-commerce y Retail">E-commerce y Retail</option>
                  <option value="Inmobiliaria y Promoción">Inmobiliaria y Promoción</option>
                  <option value="Servicios Profesionales y Legal">Servicios & Legal</option>
                </select>
              </div>
            </div>

            {/* Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <label className="font-semibold text-slate-800">
                  Cuerpo del Mensaje:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-indigo-600 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {inputText.trim().split(/\s+/).filter(Boolean).length} palabras
                  </span>
                </div>
              </div>

              <textarea
                rows={9}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe o pega aquí el mensaje para clasificar su tono..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-sans leading-relaxed shadow-inner"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Variables: <code className="bg-slate-100 px-1 rounded text-slate-700">{'{{nombre}}'}</code>, <code className="bg-slate-100 px-1 rounded text-slate-700">{'{{empresa}}'}</code>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={runAnalysis}
                  disabled={isAnalyzing || !inputText.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAnalyzing ? 'Analizando con IA...' : 'Analizar Tono y Estructura'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis Result & Benchmarks (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {analysisResult ? (
            <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Resultado del Análisis</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {analysisResult.isChineseToneDetected && (
                    <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>🇨🇳 Tono Chino Detectado</span>
                      {analysisResult.chineseCharCount ? (
                        <span className="text-[9px] opacity-75">({analysisResult.chineseCharCount} 汉字)</span>
                      ) : null}
                    </span>
                  )}
                  {analysisResult.isManuallyEdited && (
                    <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Ajustado manualmente
                    </span>
                  )}
                </div>
              </div>

              {/* Chinese Tone Detection Card if detected */}
              {(analysisResult.isChineseToneDetected || (analysisResult.chineseTones && analysisResult.chineseTones.length > 0)) && (
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-red-50/80 via-amber-50/40 to-slate-50 border border-red-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-950 flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      <span>Tonos Chinos Detectados (中文商务语调):</span>
                    </span>
                    <span className="text-[10px] font-mono text-red-800 bg-red-100/70 px-2 py-0.5 rounded">
                      Canal: {channel}
                    </span>
                  </div>

                  {/* Chinese Tones Bar List */}
                  <div className="space-y-2">
                    {(analysisResult.chineseTones || []).slice(0, 4).map((ct) => (
                      <div key={ct.tone} className="p-2 bg-white/90 border border-red-100 rounded-lg space-y-1 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-red-900 text-xs">{ct.zhTone}</span>
                            <span className="text-[10px] text-slate-500 font-medium">({ct.esTone || ct.enTone})</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-red-700">{ct.score}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-red-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${ct.score}%` }}
                          />
                        </div>
                        {ct.matchedKeywords && ct.matchedKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {ct.matchedKeywords.map((kw, idx) => (
                              <span key={idx} className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.2 rounded font-mono">
                                {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Cultural Insights Breakdown */}
                  {analysisResult.culturalInsights && (
                    <div className="pt-2 border-t border-red-200/60 space-y-2 text-[11px]">
                      <div className="font-semibold text-red-950 flex items-center justify-between">
                        <span>Análisis Cultural de Negocios Chinos:</span>
                        <span className="text-[10px] text-slate-500">
                          Idioma: {analysisResult.culturalInsights.detectedLanguage.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="bg-white/80 p-1.5 rounded border border-red-100">
                          <span className="text-[10px] text-slate-500 block">Relación (关系)</span>
                          <strong className="text-slate-800 text-[10px] font-semibold block truncate">
                            {analysisResult.culturalInsights.guanxiLevel.split('(')[0].trim()}
                          </strong>
                        </div>
                        <div className="bg-white/80 p-1.5 rounded border border-red-100">
                          <span className="text-[10px] text-slate-500 block">Cortesía (客气)</span>
                          <strong className="text-slate-800 text-[10px] font-semibold block truncate">
                            {analysisResult.culturalInsights.politenessLevel.split('(')[0].trim()}
                          </strong>
                        </div>
                        <div className="bg-white/80 p-1.5 rounded border border-red-100">
                          <span className="text-[10px] text-slate-500 block">Pragmatismo (务实)</span>
                          <strong className="text-slate-800 text-[10px] font-semibold block truncate">
                            {analysisResult.culturalInsights.pragmatismLevel.split('(')[0].trim()}
                          </strong>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-white/80 border border-red-100 text-[11px] text-slate-700 leading-relaxed">
                        <strong className="text-red-900 block font-semibold mb-0.5">Consejo Cultural Accionable:</strong>
                        {analysisResult.culturalInsights.culturalAdvice}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Primary Standard Tones with Score Sliders */}
              <div>
                <label className="text-slate-700 font-semibold block mb-2">
                  Tonos Generales de Prospección:
                </label>
                <div className="space-y-2">
                  {editableTones.map((t) => (
                    <div key={t.tone} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 capitalize">
                          {t.tone}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-indigo-600 font-bold">{t.score}%</span>
                          <button
                            onClick={() => removeTone(t.tone)}
                            className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={t.score}
                        onChange={(e) => updateToneScore(t.tone, Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1 bg-slate-200 rounded cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                {/* Add new tone */}
                <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder="Añadir etiqueta de tono..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:bg-white focus:border-indigo-500"
                    />
                    <button
                      onClick={() => addToneTag(newTagInput.trim())}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                    >
                      + Añadir
                    </button>
                  </div>

                  {/* Quick Chinese Tone Add Buttons */}
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="text-[10px] text-slate-400">Sugerir tono chino:</span>
                    {['谦逊礼貌', '建立关系', '务实真诚', '专业背书', '亲切诚恳'].map((zh) => (
                      <button
                        key={zh}
                        type="button"
                        onClick={() => addToneTag(zh)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 cursor-pointer font-medium"
                      >
                        +{zh}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Structure and Hook */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-[11px]">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Estructura Retórica</span>
                  <strong className="text-slate-800 font-semibold">{analysisResult.structure}</strong>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Tipo de Gancho</span>
                  <strong className="text-slate-800 font-semibold">{analysisResult.hookType}</strong>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Nivel Personalización</span>
                  <strong className="text-slate-800 font-semibold">{analysisResult.personalizationLevel}</strong>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="text-slate-500 block">Llamada a la Acción (CTA)</span>
                  <strong className="text-slate-800 font-semibold">{analysisResult.ctaType}</strong>
                </div>
              </div>

              {/* AI Reasoning */}
              <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 space-y-1">
                <span className="font-bold text-indigo-900 block text-[11px]">
                  Explicación del Clasificador:
                </span>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  {analysisResult.aiReasoning}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center text-slate-500 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-2">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
              <div className="font-bold text-slate-800">Laboratorio Listo</div>
              <p className="text-slate-500 max-w-xs mx-auto">
                Selecciona una plantilla o escribe tu mensaje (en español, chino o mixto) y haz clic en &quot;Analizar Tono y Estructura&quot;.
              </p>
            </div>
          )}

          {/* Historical Benchmarks Card */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Rendimiento Histórico por Tono</span>
              </h3>
            </div>

            <div className="space-y-2">
              {toneBenchmarks.slice(0, 4).map((b) => (
                <div key={b.tone} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 capitalize">
                    Tono {b.tone}
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-500">{b.total} envíos</span>
                    <span className="text-amber-700 font-semibold">{b.demos} demos ({b.demoRate.toFixed(0)}%)</span>
                    <span className="text-indigo-700 font-bold">{b.sales} ventas</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
