import React, { useState, useMemo } from 'react';
import { Lead, AppSettings } from '../types';
import { 
  CheckSquare, 
  Calendar, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink,
  MapPin,
  Sparkles,
  Radio
} from 'lucide-react';

interface TasksViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onUpdateLead: (lead: Lead) => void;
  settings: AppSettings;
}

export const TasksView: React.FC<TasksViewProps> = ({
  leads,
  onSelectLead,
  onUpdateLead,
  settings,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'urgent' | 'overdue' | 'today' | 'upcoming' | 'pendingContact' | 'robinson'>('urgent');

  // Format today's date in local YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const now = Date.now();

  // Categorize leads
  const categorized = useMemo(() => {
    const overdue: Lead[] = [];
    const today: Lead[] = [];
    const urgent: Lead[] = [];
    const upcoming: Lead[] = [];
    const pendingContact: Lead[] = [];
    const robinson: Lead[] = [];

    leads.forEach((l) => {
      if (l.isArchived) return;

      if (l.doNotContact) {
        robinson.push(l);
        return;
      }

      if (l.isPendingContact) {
        pendingContact.push(l);
      }

      // Check next follow-up date for active prospect stages
      if (l.nextFollowUpDate && l.status !== 5 && l.status !== 0) {
        if (l.nextFollowUpDate < todayStr) {
          overdue.push(l);
          urgent.push(l);
        } else if (l.nextFollowUpDate === todayStr) {
          today.push(l);
          urgent.push(l);
        } else {
          upcoming.push(l);
        }
      }
    });

    urgent.sort((a, b) => a.nextFollowUpDate.localeCompare(b.nextFollowUpDate));

    return { overdue, today, urgent, upcoming, pendingContact, robinson };
  }, [leads, todayStr, now]);

  // Quick postponement or mark done handlers
  const handleMarkDone = (lead: Lead, daysToAdd: number = 3, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextDate = new Date(Date.now() + 86400000 * daysToAdd).toISOString().split('T')[0];
    const updated: Lead = {
      ...lead,
      nextFollowUpDate: nextDate,
      lastContactDate: todayStr,
      followUpsCount: (lead.followUpsCount || 0) + 1,
      isPendingContact: false,
      transitions: [
        {
          id: `tr-${Date.now()}`,
          fromStatus: lead.status,
          toStatus: lead.status,
          date: todayStr,
          notes: `Seguimiento realizado (+${daysToAdd} días agendado)`,
        },
        ...(lead.transitions || []),
      ],
    };
    onUpdateLead(updated);
  };

  const handlePostponeTomorrow = (lead: Lead, e: React.MouseEvent) => {
    e.stopPropagation();
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const updated: Lead = {
      ...lead,
      nextFollowUpDate: tomorrowStr,
    };
    onUpdateLead(updated);
  };

  const getDaysOverdue = (dateStr: string) => {
    if (!dateStr || dateStr >= todayStr) return 0;
    const diff = (new Date(todayStr).getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24);
    return Math.max(1, Math.round(diff));
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <span>Gestión Diaria de Tareas & Seguimientos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Notificaciones visuales de prospectos vencidos, programados para hoy y pendientes de primer contacto
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
            {categorized.urgent.length} urgentes para hoy / vencidos
          </span>
        </div>
      </div>

      {/* KPI Counters Strip - Aesthetic Light */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
        {/* Urgent (Overdue + Today) */}
        <button
          onClick={() => setActiveSubTab('urgent')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
            activeSubTab === 'urgent'
              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-200'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-bold text-rose-800">Urgentes (Hoy + Vencidos)</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700 font-mono tabular-nums">
            {categorized.urgent.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Atención prioritaria</div>
        </button>

        {/* Strictly Overdue */}
        <button
          onClick={() => setActiveSubTab('overdue')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
            activeSubTab === 'overdue'
              ? 'bg-rose-50 border-rose-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">Solo Vencidos</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {categorized.overdue.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Fecha anterior a hoy</div>
        </button>

        {/* Due Today */}
        <button
          onClick={() => setActiveSubTab('today')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
            activeSubTab === 'today'
              ? 'bg-amber-50 border-amber-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">Para Hoy</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {categorized.today.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Agendados para hoy</div>
        </button>

        {/* Pending Contact */}
        <button
          onClick={() => setActiveSubTab('pendingContact')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
            activeSubTab === 'pendingContact'
              ? 'bg-indigo-50 border-indigo-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">Pendientes Contacto</span>
            <Radio className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 font-mono tabular-nums">
            {categorized.pendingContact.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Sin primer mensaje enviado</div>
        </button>

        {/* Upcoming */}
        <button
          onClick={() => setActiveSubTab('upcoming')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
            activeSubTab === 'upcoming'
              ? 'bg-slate-100 border-slate-300'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">Próximos Días</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-800 font-mono tabular-nums">
            {categorized.upcoming.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Fechas futuras</div>
        </button>
      </div>

      {/* RENDER ACTIVE SUBTAB CONTENT */}
      <div className="space-y-4">
        {(() => {
          const listToRender = 
            activeSubTab === 'urgent' 
              ? categorized.urgent 
              : activeSubTab === 'overdue' 
              ? categorized.overdue 
              : activeSubTab === 'today'
              ? categorized.today
              : activeSubTab === 'pendingContact'
              ? categorized.pendingContact
              : categorized.upcoming;

          if (listToRender.length === 0) {
            return (
              <div className="bg-white border border-slate-200/80 rounded-xl p-12 text-center text-slate-500 text-xs shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <div className="text-slate-900 font-bold text-sm mb-1">
                  ¡Al día! No hay tareas pendientes en esta categoría
                </div>
                <p className="text-slate-500 max-w-sm mx-auto">
                  Todos los prospectos tienen sus seguimientos y contactos al corriente.
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {listToRender.map((lead) => {
                const isExpired = lead.nextFollowUpDate < todayStr;
                const isDueToday = lead.nextFollowUpDate === todayStr;
                const daysOverdue = getDaysOverdue(lead.nextFollowUpDate);

                return (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className={`bg-white border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md ${
                      isExpired
                        ? 'border-rose-300 ring-1 ring-rose-100 hover:border-rose-400'
                        : isDueToday
                        ? 'border-amber-300 ring-1 ring-amber-100 hover:border-amber-400'
                        : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Left: Lead details */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {lead.commercialName || lead.companyName}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          Estado {lead.status}
                        </span>

                        {lead.isPendingContact && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Pendiente de contactar
                          </span>
                        )}

                        {/* Red Badge for Overdue */}
                        {isExpired && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>VENCIDO ({daysOverdue} {daysOverdue === 1 ? 'día' : 'días'} de retraso · {lead.nextFollowUpDate})</span>
                          </span>
                        )}

                        {isDueToday && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>CONTACTAR HOY ({todayStr})</span>
                          </span>
                        )}

                        {lead.location && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{lead.location}</span>
                          </span>
                        )}
                      </div>

                      {/* Contact Status and Recency Details */}
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-700 flex flex-wrap items-center gap-3">
                        <span>Origen: <strong className="text-slate-900">{lead.leadSource}</strong></span>
                        <span>·</span>
                        <span>Canal: <strong className="text-slate-900">{lead.channel}</strong></span>
                        <span>·</span>
                        <span>Tono: <strong className="text-indigo-700 capitalize">{lead.contactTone || 'Consultivo'}</strong></span>
                        <span>·</span>
                        <span>Último contacto: <strong className="font-mono text-slate-900">{lead.lastContactDate || 'Aún no contactado'}</strong></span>
                      </div>

                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                        <span>Contacto: <strong className="text-slate-700">{lead.contactPerson || 'Sin contacto'}</strong></span>
                        <span>·</span>
                        <span>Responsable: <strong className="text-slate-700">{lead.assignedTo}</strong></span>
                        {lead.followUpsCount !== undefined && (
                          <>
                            <span>·</span>
                            <span>Seguimientos acumulados: <strong className="text-slate-700 font-mono">{lead.followUpsCount}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => handleMarkDone(lead, 3, e)}
                        className="w-full sm:w-auto px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                        title="Marcar contacto como realizado y programar siguiente revisión en 3 días"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Contactado (+3d)</span>
                      </button>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={(e) => handlePostponeTomorrow(lead, e)}
                          className="flex-1 sm:flex-none px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                          title="Posponer para mañana"
                        >
                          +1 día
                        </button>

                        <button
                          onClick={() => onSelectLead(lead)}
                          className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors shadow-sm whitespace-nowrap cursor-pointer"
                        >
                          Abrir Ficha
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
