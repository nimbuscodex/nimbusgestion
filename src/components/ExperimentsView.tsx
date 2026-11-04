import React, { useState, useMemo } from 'react';
import { 
  ExperimentVariant, 
  Lead, 
  BusinessSector, 
  OutreachChannel, 
  AppSettings 
} from '../types';
import { 
  FlaskConical, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Scale, 
  Users, 
  Calculator
} from 'lucide-react';

interface ExperimentsViewProps {
  experiments: ExperimentVariant[];
  leads: Lead[];
  onSaveExperiment: (variant: ExperimentVariant) => void;
  settings: AppSettings;
}

export const ExperimentsView: React.FC<ExperimentsViewProps> = ({
  experiments,
  leads,
  onSaveExperiment,
  settings,
}) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    experiments[0]?.id || ''
  );

  // New Experiment Modal State
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newHypothesis, setNewHypothesis] = useState<string>('');
  const [newTone, setNewTone] = useState<string>('consultivo');
  const [newChannel, setNewChannel] = useState<OutreachChannel>('Redbook (小红书)');
  const [newSegment, setNewSegment] = useState<BusinessSector | 'Multisector'>('Hostelería y Restauración');
  const [newText, setNewText] = useState<string>('');
  const [newTargetN, setNewTargetN] = useState<number>(30);

  // Cohort Metrics Computation for each variant
  const experimentMetrics = useMemo(() => {
    return experiments.map((variant) => {
      // Leads assigned to this variant or that used its template
      const cohortLeads = leads.filter((l) => {
        return l.interactions.some(
          (i) => i.templateOrVariantId === variant.id || i.templateName === variant.name
        );
      });

      const N = cohortLeads.length; // Sample size

      // Responded: status >= 1 or interaction responseReceived
      const R = cohortLeads.filter(
        (l) => l.status >= 1 || l.interactions.some((i) => i.responseReceived)
      ).length;

      // Interested: status >= 2 or interaction result
      const I = cohortLeads.filter(
        (l) => l.status >= 2 || l.interactions.some((i) => i.interactionResult === 'Agendó demo' || i.interactionResult === 'Respuesta positiva')
      ).length;

      // Demos requested / completed: status >= 2
      const D = cohortLeads.filter((l) => l.status >= 2).length;
      const D_completed = cohortLeads.filter((l) => l.status >= 3).length;
      const Neg = cohortLeads.filter((l) => l.status === 4).length;
      const V = cohortLeads.filter((l) => l.status === 5).length;

      // Rates
      const responseRate = N > 0 ? (R / N) * 100 : 0;
      const interestRate = N > 0 ? (I / N) * 100 : 0;
      const demoRate = N > 0 ? (D / N) * 100 : 0;
      const negRate = N > 0 ? (Neg / N) * 100 : 0;
      const closeRate = N > 0 ? (V / N) * 100 : 0;
      const demoToSaleRate = D_completed > 0 ? (V / D_completed) * 100 : 0;

      // Margin of error (95% confidence interval for demo rate): 1.96 * sqrt(p*(1-p)/N)
      const p = demoRate / 100;
      const marginOfError = N > 0 ? 1.96 * Math.sqrt((p * (1 - p)) / N) * 100 : 0;
      const isSampleSizeSmall = N < 30;

      return {
        variant,
        N,
        R,
        I,
        D,
        D_completed,
        Neg,
        V,
        responseRate,
        interestRate,
        demoRate,
        negRate,
        closeRate,
        demoToSaleRate,
        marginOfError,
        isSampleSizeSmall,
      };
    });
  }, [experiments, leads]);

  const handleCreateVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newHypothesis.trim()) return;

    const created: ExperimentVariant = {
      id: `exp-${Date.now()}`,
      name: newName,
      hypothesis: newHypothesis,
      primaryTone: newTone,
      channel: newChannel,
      targetSegment: newSegment,
      startDate: new Date().toISOString().split('T')[0],
      templateText: newText,
      sampleSizeMinTarget: newTargetN,
      status: 'Activo',
      isDemo: false,
    };

    onSaveExperiment(created);
    setSelectedVariantId(created.id);
    setIsCreating(false);

    setNewName('');
    setNewHypothesis('');
    setNewText('');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto bg-[#F8FAFC]">
      {/* Intro Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-600" />
            <span>Experimentación & Optimización de Conversión A/B</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Compara variantes de mensajes con rigor estadístico, cálculo de incertidumbre y prevención de sesgos
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Crear Variante / Experimento</span>
        </button>
      </div>

      {/* Strict Formulas Banner */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Calculator className="w-4 h-4 text-indigo-600" />
          <span>Fórmulas Matemáticas Oficiales del Sistema</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Tasa de Respuesta:</span>
            <div className="font-mono text-slate-800 font-semibold">Respondieron / Contactados</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Tasa de Demo:</span>
            <div className="font-mono text-slate-800 font-semibold">Demos Agendadas / Contactados</div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Tasa de Cierre:</span>
            <div className="font-mono text-slate-800 font-semibold">Ventas Cerradas / Contactados</div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-800 block text-[11px] font-medium">Conversión Demo → Venta:</span>
            <div className="font-mono text-emerald-900 font-bold">Ventas Cerradas / Demos Realizadas</div>
          </div>
        </div>
      </div>

      {/* Experiment Comparison Cards */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Variantes Activas y Cohortes Comparables
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {experimentMetrics.map((item) => {
            const { variant, N, R, D, V, responseRate, demoRate, closeRate, marginOfError, isSampleSizeSmall } = item;

            return (
              <div
                key={variant.id}
                className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Tono: {variant.primaryTone}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Desde: {variant.startDate}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1.5 leading-snug">
                    {variant.name}
                  </h4>

                  <div className="text-[11px] text-slate-500 mb-3 space-y-0.5">
                    <div>Canal: <strong className="text-slate-700">{variant.channel}</strong></div>
                    <div>Segmento: <strong className="text-slate-700">{variant.targetSegment}</strong></div>
                  </div>

                  {/* Hypothesis block */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-0.5">
                      Hipótesis a validar:
                    </span>
                    &quot;{variant.hypothesis}&quot;
                  </div>

                  {/* Sample Size with Bias Warning */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 mb-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Muestra (N):</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {N} / {variant.sampleSizeMinTarget} prospectos
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, (N / variant.sampleSizeMinTarget) * 100)}%` }}
                        className="bg-indigo-600 h-full rounded-full"
                      />
                    </div>

                    {isSampleSizeSmall && (
                      <div className="flex items-center gap-1.5 text-[11px] text-amber-700 pt-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>Muestra reducida (N &lt; 30). Datos preliminares.</span>
                      </div>
                    )}
                  </div>

                  {/* Performance Indicators */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Tasa de Respuesta:</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {responseRate.toFixed(1)}% <span className="text-slate-400 font-normal">({R}/{N})</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Tasa de Demo:</span>
                      <span className="font-mono text-amber-700 font-bold">
                        {demoRate.toFixed(1)}% <span className="text-slate-400 font-normal">({D}/{N})</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Tasa de Cierre (Venta):</span>
                      <span className="font-mono text-indigo-700 font-bold">
                        {closeRate.toFixed(1)}% <span className="text-slate-400 font-normal">({V}/{N})</span>
                      </span>
                    </div>

                    {N >= 15 && (
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 text-[11px] text-slate-500">
                        <span>Intervalo de Confianza (95%):</span>
                        <span className="font-mono font-semibold">± {marginOfError.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  {variant.isDemo ? 'Variante del conjunto de demostración' : 'Experimento de producción'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Methodological Guidance */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-2 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
          <Scale className="w-4 h-4 text-indigo-600" />
          <span>Guía de Rigor Metodológico & Prevención de Sesgos</span>
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          1. <strong>Correlación no implica causalidad:</strong> Si una variante se envía exclusivamente al sector salud y otra a hostelería, la diferencia puede deberse al sector y no al tono.
          <br />
          2. <strong>Segmentación por canal:</strong> Los clientes chinos en Redbook (小红书) convierten mejor con tono cercano y capturas visuales, mientras que el email B2B tradicional responde mejor a tono consultivo.
          <br />
          3. <strong>Muestra Mínima Concluyente:</strong> No declares un copy ganador con menos de 30-40 prospectos contactados por variante.
        </p>
      </div>

      {/* Create Variant Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateVariant}
            className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-slate-800"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Nueva Variante de Experimento A/B
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nombre de la Variante:
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Variante D: Auditoría Redbook con Demo Visual"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Hipótesis Comercial:
              </label>
              <textarea
                rows={2}
                required
                value={newHypothesis}
                onChange={(e) => setNewHypothesis(e.target.value)}
                placeholder="Ej: Si mostramos una comparativa visual de carta móvil por Redbook, aumentaremos las demos un +30%..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Tono Principal</label>
                <select
                  value={newTone}
                  onChange={(e) => setNewTone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  <option value="consultivo">consultivo</option>
                  <option value="cercano">cercano</option>
                  <option value="orientado a beneficios">orientado a beneficios</option>
                  <option value="directo">directo</option>
                  <option value="profesional">profesional</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Canal</label>
                <select
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  <option value="Redbook (小红书)">Redbook (小红书)</option>
                  <option value="WeChat (微信)">WeChat (微信)</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Recomendado (推荐)">Recomendado (推荐)</option>
                  <option value="Email en frío">Email en frío</option>
                  <option value="LinkedIn DM">LinkedIn DM</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Segmento Objetivo</label>
                <select
                  value={newSegment}
                  onChange={(e) => setNewSegment(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                >
                  <option value="Hostelería y Restauración">Hostelería y Restauración</option>
                  <option value="Salud y Clínicas Médicas">Salud y Clínicas Médicas</option>
                  <option value="E-commerce y Retail">E-commerce y Retail</option>
                  <option value="Inmobiliaria y Promoción">Inmobiliaria y Promoción</option>
                  <option value="Servicios Profesionales y Legal">Servicios Profesionales</option>
                  <option value="Multisector">Multisector (Transversal)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Muestra Objetivo (N)</label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={newTargetN}
                  onChange={(e) => setNewTargetN(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Texto del Mensaje de la Variante:
              </label>
              <textarea
                rows={4}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Pega la plantilla que se enviará a este grupo de prospectos..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm cursor-pointer"
              >
                Crear Experimento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
