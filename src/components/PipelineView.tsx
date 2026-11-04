import React, { useState, useMemo } from 'react';
import { 
  Lead, 
  CommercialStatus, 
  RejectionReason, 
  Status0SecondaryReason, 
  AppSettings 
} from '../types';
import { 
  Plus, 
  Calendar, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  MapPin,
  Tag,
  Radio,
  Sparkles
} from 'lucide-react';

interface PipelineViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLeadStatus: (
    leadId: string, 
    newStatus: CommercialStatus, 
    additionalData?: Partial<Lead>, 
    transitionNote?: string
  ) => void;
  settings: AppSettings;
}

const STAGES_CONFIG: Array<{
  status: CommercialStatus;
  label: string;
  tag: string;
  description: string;
  accentBadge: string;
  cardBorder: string;
}> = [
  {
    status: 0,
    label: 'Estado 0',
    tag: 'Sin respuesta / No interesado',
    description: 'Sin respuesta tras cadencia o rechazo inicial',
    accentBadge: 'text-slate-700 bg-slate-100 border-slate-200',
    cardBorder: 'border-slate-200 hover:border-slate-300',
  },
  {
    status: 1,
    label: 'Estado 1',
    tag: 'Respondió 1 vez y silencio',
    description: 'Respondió pero detuvo la conversación',
    accentBadge: 'text-amber-800 bg-amber-50 border-amber-200',
    cardBorder: 'border-amber-200/80 hover:border-amber-300',
  },
  {
    status: 2,
    label: 'Estado 2',
    tag: 'Interesado en demo web',
    description: 'Fecha acordada para videollamada / demo',
    accentBadge: 'text-sky-800 bg-sky-50 border-sky-200',
    cardBorder: 'border-sky-200/80 hover:border-sky-300',
  },
  {
    status: 3,
    label: 'Estado 3',
    tag: 'Demo rechazada (con motivo)',
    description: 'Vio demo pero declinó; keyword registrada',
    accentBadge: 'text-rose-800 bg-rose-50 border-rose-200',
    cardBorder: 'border-rose-200/80 hover:border-rose-300',
  },
  {
    status: 4,
    label: 'Estado 4',
    tag: 'Negociando propuesta',
    description: 'Le gustó demo; afinando alcance y precio',
    accentBadge: 'text-indigo-800 bg-indigo-50 border-indigo-200',
    cardBorder: 'border-indigo-200/80 hover:border-indigo-300',
  },
  {
    status: 5,
    label: 'Estado 5',
    tag: 'Venta cerrada',
    description: 'Acuerdo firmado e importe contratado',
    accentBadge: 'text-emerald-800 bg-emerald-50 border-emerald-200',
    cardBorder: 'border-emerald-200/80 hover:border-emerald-300',
  },
];

export const PipelineView: React.FC<PipelineViewProps> = ({
  leads,
  onSelectLead,
  onUpdateLeadStatus,
  settings,
}) => {
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [originFilter, setOriginFilter] = useState<string>('all');
  
  // Transition Modal State
  const [transitioningLead, setTransitioningLead] = useState<Lead | null>(null);
  const [targetStatus, setTargetStatus] = useState<CommercialStatus | null>(null);
  const [transitionNote, setTransitionNote] = useState<string>('');
  
  // Extra fields for specific target states
  const [state0Reason, setState0Reason] = useState<Status0SecondaryReason>('No responde tras varios intentos');
  const [state0DoNotContact, setState0DoNotContact] = useState<boolean>(false);
  const [state2DemoDate, setState2DemoDate] = useState<string>('');
  const [state2Needs, setState2Needs] = useState<string>('');
  const [state3Reasons, setState3Reasons] = useState<RejectionReason[]>(['Precio']);
  const [state3Keyword, setState3Keyword] = useState<string>('#PRECIO_ALTO');
  const [state3Notes, setState3Notes] = useState<string>('');
  const [state4Phase, setState4Phase] = useState<'Propuesta enviada' | 'Revisión presupuestaria' | 'Ajuste de alcance' | 'Enviado contrato/legal'>('Propuesta enviada');
  const [state5Amount, setState5Amount] = useState<number>(3500);
  const [state5Collected, setState5Collected] = useState<number>(1750);
  const [state5Service, setState5Service] = useState<string>('Rediseño web corporativo');

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (l.isArchived) return false;
      if (sectorFilter !== 'all' && l.sector !== sectorFilter) return false;
      if (originFilter !== 'all' && l.leadSource !== originFilter) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const matches =
          l.commercialName.toLowerCase().includes(q) ||
          l.companyName.toLowerCase().includes(q) ||
          l.contactPerson.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [leads, sectorFilter, originFilter, searchFilter]);

  // Group leads by status (0 to 5)
  const leadsByStatus = useMemo(() => {
    const map: Record<CommercialStatus, Lead[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };
    filteredLeads.forEach((l) => {
      if (map[l.status]) {
        map[l.status].push(l);
      }
    });
    return map;
  }, [filteredLeads]);

  const initiateTransition = (lead: Lead, toStatus: CommercialStatus) => {
    setTransitioningLead(lead);
    setTargetStatus(toStatus);
    setTransitionNote('');

    if (toStatus === 0) {
      setState0Reason(lead.status0Reason || 'No responde tras varios intentos');
      setState0DoNotContact(lead.doNotContact || false);
    } else if (toStatus === 2) {
      setState2DemoDate(lead.demoScheduledDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
      setState2Needs(lead.detectedNeeds || '');
    } else if (toStatus === 3) {
      setState3Reasons(lead.rejectionReasons || ['Precio']);
      setState3Keyword(lead.rejectionKeywords?.[0] || '#PRECIO_ALTO');
      setState3Notes(lead.rejectionNotes || '');
    } else if (toStatus === 4) {
      setState4Phase(lead.negotiationPhase || 'Propuesta enviada');
    } else if (toStatus === 5) {
      setState5Amount(lead.agreedAmount || lead.estimatedBudget || 3500);
      setState5Collected(lead.collectedAmount || 0);
      setState5Service(lead.contractedService || lead.offeredService);
    }
  };

  const handleConfirmTransition = () => {
    if (!transitioningLead || targetStatus === null) return;

    const additionalData: Partial<Lead> = {};

    if (targetStatus === 0) {
      additionalData.status0Reason = state0Reason;
      additionalData.doNotContact = state0DoNotContact;
      if (state0DoNotContact) {
        additionalData.doNotContactReason = 'Petición expresa del prospecto en Estado 0';
      }
    } else if (targetStatus === 2) {
      additionalData.demoScheduledDate = state2DemoDate;
      additionalData.detectedNeeds = state2Needs;
    } else if (targetStatus === 3) {
      additionalData.rejectionReasons = state3Reasons;
      additionalData.rejectionKeywords = [state3Keyword];
      additionalData.rejectionNotes = state3Notes;
    } else if (targetStatus === 4) {
      additionalData.negotiationPhase = state4Phase;
    } else if (targetStatus === 5) {
      additionalData.agreedAmount = state5Amount;
      additionalData.collectedAmount = state5Collected;
      additionalData.contractedService = state5Service;
      additionalData.closedDate = new Date().toISOString().split('T')[0];
    }

    onUpdateLeadStatus(transitioningLead.id, targetStatus, additionalData, transitionNote);
    setTransitioningLead(null);
    setTargetStatus(null);
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: settings.currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto bg-[#F8FAFC]">
      {/* Top Banner & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Pipeline Kanban Comercial (Estados 0 - 5)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evolución comercial no lineal con histórico de transiciones preservado
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filtrar por empresa, contacto o ciudad..."
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:bg-white focus:border-indigo-500 w-56"
          />

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">Todos los orígenes</option>
            <option value="Redbook (Inbound - Nos contactan)">Redbook (Inbound)</option>
            <option value="Redbook (Outbound - Contactamos nosotros)">Redbook (Outbound)</option>
            <option value="WeChat (Inbound - Nos agregan / contactan)">WeChat (Inbound)</option>
            <option value="WeChat (Outbound - Contactamos nosotros)">WeChat (Outbound)</option>
            <option value="Recomendado / Referido (推荐)">Recomendados (推荐)</option>
          </select>

          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">Todos los sectores</option>
            <option value="Hostelería y Restauración">Hostelería y Restauración</option>
            <option value="Salud y Clínicas Médicas">Salud y Clínicas</option>
            <option value="E-commerce y Retail">E-commerce y Retail</option>
            <option value="Inmobiliaria y Promoción">Inmobiliaria</option>
            <option value="Servicios Profesionales y Legal">Servicios & Legal</option>
          </select>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
        {STAGES_CONFIG.map((stage) => {
          const colLeads = leadsByStatus[stage.status] || [];
          const colTotalBudget = colLeads.reduce(
            (acc, l) => acc + (stage.status === 5 ? (l.agreedAmount || 0) : (l.estimatedBudget || 0)),
            0
          );

          return (
            <div
              key={stage.status}
              className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col min-h-[580px] max-h-[820px] shadow-[0_1px_3px_rgba(0,0,0,0.03)]"
            >
              {/* Column Header */}
              <div className="pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {stage.label}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                      {colLeads.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-600">
                    {formatCurrency(colTotalBudget)}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 truncate">
                  {stage.tag}
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  {stage.description}
                </p>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                {colLeads.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                    Sin prospectos
                  </div>
                ) : (
                  colLeads.map((lead) => {
                    let silenceDays = 0;
                    if (lead.status === 1 && lead.lastResponseDate) {
                      silenceDays = Math.floor(
                        (Date.now() - new Date(lead.lastResponseDate).getTime()) / (1000 * 3600 * 24)
                      );
                    }

                    return (
                      <div
                        key={lead.id}
                        className={`bg-white border ${stage.cardBorder} rounded-lg p-3 transition-all cursor-pointer group shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-md`}
                        onClick={() => onSelectLead(lead)}
                      >
                        {/* Lead Top Bar */}
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                            {lead.commercialName || lead.companyName}
                          </h4>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newPending = !lead.isPendingContact;
                              onUpdateLeadStatus(
                                lead.id,
                                lead.status,
                                {
                                  isPendingContact: newPending,
                                  firstContactDate: newPending ? (lead.firstContactDate || new Date().toISOString().split('T')[0]) : ''
                                },
                                newPending ? 'Marcado manualmente como pendiente de contactar' : 'Marcado manualmente como ya contactado'
                              );
                            }}
                            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded transition-all shrink-0 flex items-center gap-1 border cursor-pointer ${
                              lead.isPendingContact
                                ? 'text-amber-900 bg-amber-100 border-amber-300 hover:bg-amber-200 shadow-xs'
                                : 'text-slate-500 bg-slate-50 border-slate-200 hover:text-slate-800 hover:bg-slate-100'
                            }`}
                            title={lead.isPendingContact ? 'Marcado como PENDIENTE. Clic para marcar como YA CONTACTADO' : 'Clic para marcar como PENDIENTE de contactar'}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${lead.isPendingContact ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                            <span>{lead.isPendingContact ? 'Pendiente' : 'Contactar'}</span>
                          </button>
                          {lead.doNotContact && (
                            <span className="text-[9px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded shrink-0">
                              Baja
                            </span>
                          )}
                        </div>

                        {/* Contact Person & Location */}
                        <div className="text-[11px] text-slate-500 mb-2 truncate flex items-center gap-1">
                          <span className="font-medium text-slate-700">{lead.contactPerson || 'Sin contacto'}</span>
                          {lead.location && (
                            <>
                              <span className="text-slate-300">·</span>
                              <span className="flex items-center gap-0.5 text-slate-500">
                                <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span className="truncate max-w-[90px]">{lead.location}</span>
                              </span>
                            </>
                          )}
                        </div>

                        {/* Origen & Tono Tag */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100 mb-2">
                          <span className="truncate max-w-[110px]" title={String(lead.leadSource)}>
                            {lead.leadSource || 'Origen web'}
                          </span>
                          {lead.contactTone && (
                            <span className="text-indigo-700 font-medium capitalize">
                              {lead.contactTone}
                            </span>
                          )}
                        </div>

                        {/* Stage Specific Insights */}
                        {lead.status === 0 && lead.status0Reason && (
                          <div className="text-[10px] text-slate-600 bg-slate-100 px-2 py-1 rounded mb-2 truncate">
                            Motivo: {lead.status0Reason}
                          </div>
                        )}

                        {lead.status === 1 && (
                          <div className="flex items-center justify-between text-[10px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 mb-2 font-mono">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {silenceDays}d silencio
                            </span>
                            <span>{lead.followUpsCount || 0} seg.</span>
                          </div>
                        )}

                        {lead.status === 2 && lead.demoScheduledDate && (
                          <div className="flex items-center gap-1 text-[10px] text-sky-800 bg-sky-50 px-2 py-1 rounded border border-sky-200 mb-2 font-mono truncate">
                            <Calendar className="w-3 h-3 shrink-0 text-sky-600" />
                            <span>Demo: {lead.demoScheduledDate}</span>
                          </div>
                        )}

                        {lead.status === 3 && (
                          <div className="text-[10px] text-rose-800 bg-rose-50 px-2 py-1 rounded border border-rose-200 mb-2 space-y-0.5">
                            <div className="truncate">Rechazo: {lead.rejectionReasons?.join(', ')}</div>
                            {lead.rejectionKeywords && lead.rejectionKeywords.length > 0 && (
                              <div className="font-mono font-bold text-rose-700 text-[9px]">
                                {lead.rejectionKeywords.join(' ')}
                              </div>
                            )}
                          </div>
                        )}

                        {lead.status === 4 && (
                          <div className="text-[10px] text-indigo-800 bg-indigo-50 px-2 py-1 rounded border border-indigo-200 mb-2 truncate">
                            Fase: {lead.negotiationPhase || 'Propuesta'}
                          </div>
                        )}

                        {lead.status === 5 && (
                          <div className="flex items-center justify-between text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 mb-2 font-mono">
                            <span>Acordado: {formatCurrency(lead.agreedAmount)}</span>
                            <span className="text-emerald-700 font-bold">
                              {lead.collectedAmount ? `${formatCurrency(lead.collectedAmount)}` : 'Cobro pend.'}
                            </span>
                          </div>
                        )}

                        {/* Card Footer: Presupuesto & Cambio de Fase */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="font-mono font-semibold text-slate-800 text-[10px]">
                            {lead.estimatedBudget !== null 
                              ? formatCurrency(lead.estimatedBudget) 
                              : <span className="text-slate-400 font-normal italic">Por definir</span>}
                          </span>

                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              value={lead.status}
                              onChange={(e) => {
                                const newSt = parseInt(e.target.value, 10) as CommercialStatus;
                                initiateTransition(lead, newSt);
                              }}
                              className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] rounded px-1.5 py-0.5 focus:outline-none focus:bg-white focus:border-indigo-500"
                            >
                              <option value="0">E0 Sin resp</option>
                              <option value="1">E1 Resp 1x</option>
                              <option value="2">E2 Demo</option>
                              <option value="3">E3 Rechazo</option>
                              <option value="4">E4 Negoc</option>
                              <option value="5">E5 Venta</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transition Modal - Aesthetic Light */}
      {transitioningLead && targetStatus !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-900">
                Cambio de Estado: {transitioningLead.commercialName}
              </h4>
              <button
                onClick={() => setTransitioningLead(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Mover de <strong>Estado {transitioningLead.status}</strong> a{' '}
              <strong className="text-indigo-600">Estado {targetStatus}</strong>.
            </p>

            {/* Target 0 Fields */}
            {targetStatus === 0 && (
              <div className="space-y-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">
                    Motivo secundario del Estado 0
                  </label>
                  <select
                    value={state0Reason}
                    onChange={(e) => setState0Reason(e.target.value as Status0SecondaryReason)}
                    className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800"
                  >
                    <option value="No responde tras varios intentos">No responde tras varios intentos</option>
                    <option value="Rechazo explícito">Rechazo explícito</option>
                    <option value="No es el decisor adecuado">No es el decisor adecuado</option>
                    <option value="Email o contacto inválido">Email o contacto inválido</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chkDoNotContact"
                    checked={state0DoNotContact}
                    onChange={(e) => setState0DoNotContact(e.target.checked)}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <label htmlFor="chkDoNotContact" className="text-slate-700">
                    Marcar como &quot;No volver a contactar&quot; (Lista Robinson / RGPD)
                  </label>
                </div>
              </div>
            )}

            {/* Target 3: Rechazo con Motivo y Keyword */}
            {targetStatus === 3 && (
              <div className="space-y-3 text-xs bg-rose-50/50 p-3.5 rounded-xl border border-rose-200">
                <div>
                  <label className="text-rose-900 font-semibold block mb-1">
                    Motivo principal de rechazo
                  </label>
                  <select
                    value={state3Reasons[0] || 'Precio'}
                    onChange={(e) => setState3Reasons([e.target.value as RejectionReason])}
                    className="w-full bg-white border border-rose-200 rounded p-2 text-slate-800"
                  >
                    <option value="Precio">Precio</option>
                    <option value="Falta de presupuesto">Falta de presupuesto</option>
                    <option value="No ve suficiente valor">No ve suficiente valor</option>
                    <option value="No necesita web">No necesita web</option>
                    <option value="Ya tiene proveedor">Ya tiene proveedor</option>
                    <option value="Mal momento">Mal momento</option>
                    <option value="Falta de confianza">Falta de confianza</option>
                    <option value="Funcionalidades insuficientes">Funcionalidades insuficientes</option>
                    <option value="Decisión aplazada">Decisión aplazada</option>
                    <option value="Eligió a la competencia">Eligió a la competencia</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="text-rose-900 font-semibold block mb-1">
                    Palabra clave del rechazo (Keyword para análisis)
                  </label>
                  <input
                    type="text"
                    value={state3Keyword}
                    onChange={(e) => setState3Keyword(e.target.value)}
                    placeholder="Ej: #PRECIO_ALTO, #YA_TIENE_AGENCIA, #PREFIERE_SOLO_REDBOOK"
                    className="w-full bg-white border border-rose-200 rounded p-2 font-mono text-rose-800"
                  />
                </div>

                <div>
                  <label className="text-rose-900 font-semibold block mb-1">
                    Notas adicionales del rechazo
                  </label>
                  <textarea
                    rows={2}
                    value={state3Notes}
                    onChange={(e) => setState3Notes(e.target.value)}
                    placeholder="Detalles de la conversación, feedback del cliente..."
                    className="w-full bg-white border border-rose-200 rounded p-2 text-slate-800"
                  />
                </div>
              </div>
            )}

            {/* Target 5: Venta Cerrada */}
            {targetStatus === 5 && (
              <div className="space-y-3 text-xs bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200">
                <div>
                  <label className="text-emerald-900 font-semibold block mb-1">Importe Acordado (€)</label>
                  <input
                    type="number"
                    value={state5Amount}
                    onChange={(e) => setState5Amount(Number(e.target.value))}
                    className="w-full bg-white border border-emerald-200 rounded p-2 font-mono text-emerald-900 font-bold"
                  />
                </div>
                <div>
                  <label className="text-emerald-900 font-semibold block mb-1">Importe Efectivamente Cobrado (€)</label>
                  <input
                    type="number"
                    value={state5Collected}
                    onChange={(e) => setState5Collected(Number(e.target.value))}
                    className="w-full bg-white border border-emerald-200 rounded p-2 font-mono text-emerald-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-slate-700 block mb-1 text-xs font-semibold">
                Nota de transición (Opcional)
              </label>
              <textarea
                rows={2}
                value={transitionNote}
                onChange={(e) => setTransitionNote(e.target.value)}
                placeholder="Explicación del avance o retroceso comercial..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransitioningLead(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmTransition}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
              >
                Confirmar Cambio de Estado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
