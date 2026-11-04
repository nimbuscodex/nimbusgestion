import React, { useState, useMemo } from 'react';
import { Lead, AppSettings } from '../types';
import { 
  ShieldAlert, 
  Sparkles, 
  Lightbulb,
  Tag,
  Hash,
  AlertTriangle
} from 'lucide-react';
import { getObjectionAdviceAPI } from '../services/api';

interface ObjectionsViewProps {
  leads: Lead[];
  settings: AppSettings;
}

export const ObjectionsView: React.FC<ObjectionsViewProps> = ({ leads, settings }) => {
  const [selectedReason, setSelectedReason] = useState<string>('Precio');
  const [selectedSector, setSelectedSector] = useState<string>('Hostelería y Restauración');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState<boolean>(false);
  const [generatedAdvice, setGeneratedAdvice] = useState<any>(null);

  // Collect all objections and lost stages
  const objectionAnalytics = useMemo(() => {
    const reasonCounts: Record<string, { total: number; inStage0: number; inStage3: number; inStage4: number; sectors: Record<string, number> }> = {};
    const keywordCounts: Record<string, number> = {};

    leads.forEach((l) => {
      const reasons: string[] = [];
      if (l.rejectionReasons) reasons.push(...l.rejectionReasons);
      if (l.status0Reason) reasons.push(l.status0Reason);
      if (l.pendingObjections) reasons.push(...l.pendingObjections);

      reasons.forEach((r) => {
        if (!reasonCounts[r]) {
          reasonCounts[r] = { total: 0, inStage0: 0, inStage3: 0, inStage4: 0, sectors: {} };
        }
        reasonCounts[r].total += 1;
        if (l.status === 0) reasonCounts[r].inStage0 += 1;
        if (l.status === 3) reasonCounts[r].inStage3 += 1;
        if (l.status === 4) reasonCounts[r].inStage4 += 1;
        reasonCounts[r].sectors[l.sector] = (reasonCounts[r].sectors[l.sector] || 0) + 1;
      });

      // Collect rejection keywords
      if (l.rejectionKeywords) {
        l.rejectionKeywords.forEach((kw) => {
          keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
        });
      }
    });

    const totalOccurrences = Object.values(reasonCounts).reduce((acc, curr) => acc + curr.total, 0);

    const sortedReasons = Object.entries(reasonCounts)
      .map(([reason, data]) => ({
        reason,
        ...data,
        percentage: totalOccurrences > 0 ? (data.total / totalOccurrences) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);

    const sortedKeywords = Object.entries(keywordCounts)
      .map(([keyword, count]) => ({
        keyword,
        count,
        percentage: leads.length > 0 ? (count / leads.length) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return { sortedReasons, sortedKeywords, totalOccurrences };
  }, [leads]);

  // Request strategic advice
  const handleGenerateAdvice = async (reasonToUse?: string) => {
    const reason = reasonToUse || selectedReason;
    setIsGeneratingAdvice(true);
    try {
      const res = await getObjectionAdviceAPI({
        objectionReason: reason,
        sector: selectedSector,
        currentStage: 'Estado 3 — Demo realizada con rechazo',
        offer: 'Rediseño web corporativo adaptado para móvil y mercado chino',
        notes: `Objeción recurrente en prospección web en ${selectedSector}`,
      });
      setGeneratedAdvice(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto bg-[#F8FAFC]">
      {/* Intro Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Análisis de Rechazos, Objeciones & Palabras Clave</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Motivos registrados, ranking de keywords asociadas (#PRECIO, #PROVEEDOR_ACTUAL) y playbook táctico
          </p>
        </div>
        <span className="text-xs text-slate-600 font-mono bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          Total Objeciones: <strong className="text-slate-900">{objectionAnalytics.totalOccurrences}</strong>
        </span>
      </div>

      {/* Keywords Cloud Card */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Palabras Clave de Rechazo Detectadas en Leads
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Haz clic en una keyword para consultar su playbook</span>
        </div>

        {objectionAnalytics.sortedKeywords.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">No hay keywords de rechazo registradas aún.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {objectionAnalytics.sortedKeywords.map((kw) => (
              <button
                key={kw.keyword}
                onClick={() => {
                  setSelectedReason(kw.keyword);
                  handleGenerateAdvice(kw.keyword);
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>{kw.keyword}</span>
                <span className="text-[10px] bg-white text-rose-700 px-1.5 py-0.2 rounded border border-rose-200">
                  {kw.count} leads
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Breakdown + AI Playbook */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Objection Frequency & Stage Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Frecuencia de Motivos de Rechazo
              </h3>
              <span className="text-[11px] text-slate-500">Selecciona para ver playbook</span>
            </div>

            <div className="space-y-2.5">
              {objectionAnalytics.sortedReasons.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No hay motivos de rechazo registrados en la base actual.
                </div>
              ) : (
                objectionAnalytics.sortedReasons.map((item) => {
                  const isSelected = selectedReason === item.reason;
                  return (
                    <div
                      key={item.reason}
                      onClick={() => {
                        setSelectedReason(item.reason);
                        handleGenerateAdvice(item.reason);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-300 shadow-sm'
                          : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {item.reason}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-rose-700 tabular-nums">
                            {item.total} prospectos
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            ({item.percentage.toFixed(0)}%)
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2">
                        <div
                          style={{ width: `${item.percentage}%` }}
                          className="bg-rose-500 h-full rounded-full transition-all"
                        />
                      </div>

                      {/* Stage Distribution Breakdown */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 font-mono">
                        <span>E0 (Sin resp / No): {item.inStage0}</span>
                        <span>E3 (Demo rechazada): {item.inStage3}</span>
                        <span>E4 (Negociación): {item.inStage4}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: AI Tactical Strategic Advice (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Playbook para: &quot;{selectedReason}&quot;</span>
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-slate-600 block text-xs mb-1 font-medium">Sector a Simular:</label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500"
                >
                  <option value="Hostelería y Restauración">Hostelería y Restauración</option>
                  <option value="Salud y Clínicas Médicas">Salud y Clínicas Médicas</option>
                  <option value="E-commerce y Retail">E-commerce y Retail</option>
                  <option value="Inmobiliaria y Promoción">Inmobiliaria y Promoción</option>
                  <option value="Servicios Profesionales y Legal">Servicios Profesionales y Legal</option>
                </select>
              </div>

              <button
                onClick={() => handleGenerateAdvice()}
                disabled={isGeneratingAdvice}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingAdvice ? 'Consultando IA...' : 'Generar Argumentario & Recomendación'}</span>
              </button>
            </div>

            {/* AI Advice Output */}
            {generatedAdvice ? (
              <div className="space-y-3 pt-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-rose-800 block text-[11px]">
                    1. Causa Raíz de Fondo:
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {generatedAdvice.diagnosis}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-indigo-900 block text-[11px]">
                    2. Recomendación Comercial Inmediata:
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {generatedAdvice.actionRecommendation}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-emerald-800 block text-[11px]">
                    3. Script Sugerido para Responder:
                  </span>
                  <div className="text-slate-800 leading-relaxed whitespace-pre-wrap select-all bg-white p-2.5 rounded border border-slate-200 font-sans shadow-xs">
                    {generatedAdvice.recommendedFollowUpMessage}
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="font-bold text-amber-800 block text-[11px]">
                    4. Prevención en Futuros Contactos:
                  </span>
                  <p className="text-slate-700 leading-relaxed">
                    {generatedAdvice.preventativeAction}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Selecciona una objeción y haz clic en &quot;Generar Argumentario&quot; para obtener respuestas adaptadas.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
