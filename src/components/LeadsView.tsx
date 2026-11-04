import React, { useState, useMemo, useRef } from 'react';
import { 
  Lead, 
  CommercialStatus, 
  BusinessSector, 
  OutreachChannel, 
  LeadOrigin,
  LeadPriority,
  AppSettings
} from '../types';
import { 
  Search, 
  Filter, 
  Plus, 
  FileSpreadsheet, 
  Upload, 
  AlertTriangle, 
  ExternalLink, 
  Eye, 
  Archive, 
  ShieldAlert,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  MapPin,
  Tag,
  Radio,
  Send,
  Sparkles,
  CalendarClock,
  Repeat
} from 'lucide-react';
import { parseCSVToLeads } from '../services/storage';
import { calculateScheduleDate, formatScheduleBadge } from '../utils/dateSchedule';

interface LeadsViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onNewLeadClick: () => void;
  onImportLeads: (newLeads: Partial<Lead>[]) => void;
  onExportCSV: () => void;
  onUpdateLeadStatus?: (
    leadId: string, 
    newStatus: CommercialStatus, 
    additionalData?: Partial<Lead>, 
    transitionNote?: string
  ) => void;
  settings: AppSettings;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onSelectLead,
  onNewLeadClick,
  onImportLeads,
  onExportCSV,
  onUpdateLeadStatus,
  settings,
}) => {
  const [search, setSearch] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pendingContactOnly, setPendingContactOnly] = useState<boolean>(false);
  const [pendingFollowUpOnly, setPendingFollowUpOnly] = useState<boolean>(false);
  const [showArchived, setShowArchived] = useState<boolean>(false);
  
  // Sort
  const [sortBy, setSortBy] = useState<'createdAt' | 'commercialName' | 'status' | 'estimatedBudget' | 'lastContactDate'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // CSV file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Filtered and sorted leads
  const processedLeads = useMemo(() => {
    return leads
      .filter((l) => {
        if (!showArchived && l.isArchived) return false;
        if (showArchived && !l.isArchived) return false;

        if (pendingContactOnly && !l.isPendingContact) return false;
        if (pendingFollowUpOnly && !l.isPendingFollowUp) return false;

        if (sectorFilter !== 'all' && l.sector !== sectorFilter) return false;
        if (channelFilter !== 'all' && l.channel !== channelFilter) return false;
        if (originFilter !== 'all' && l.leadSource !== originFilter) return false;
        if (statusFilter !== 'all' && String(l.status) !== statusFilter) return false;

        if (search) {
          const q = search.toLowerCase();
          const match =
            l.commercialName.toLowerCase().includes(q) ||
            l.companyName.toLowerCase().includes(q) ||
            l.contactPerson.toLowerCase().includes(q) ||
            l.email.toLowerCase().includes(q) ||
            l.phone.toLowerCase().includes(q) ||
            (l.location && l.location.toLowerCase().includes(q)) ||
            (l.leadSource && l.leadSource.toLowerCase().includes(q)) ||
            (l.contactTone && l.contactTone.toLowerCase().includes(q)) ||
            (l.rejectionKeywords && l.rejectionKeywords.some(k => k.toLowerCase().includes(q))) ||
            l.currentWebsite.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'createdAt') {
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (sortBy === 'commercialName') {
          cmp = a.commercialName.localeCompare(b.commercialName);
        } else if (sortBy === 'status') {
          cmp = a.status - b.status;
        } else if (sortBy === 'lastContactDate') {
          const dateA = a.lastContactDate || a.createdAt;
          const dateB = b.lastContactDate || b.createdAt;
          cmp = new Date(dateA).getTime() - new Date(dateB).getTime();
        } else if (sortBy === 'estimatedBudget') {
          const budA = a.estimatedBudget !== null ? a.estimatedBudget : -1;
          const budB = b.estimatedBudget !== null ? b.estimatedBudget : -1;
          cmp = budA - budB;
        }
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [leads, search, sectorFilter, channelFilter, originFilter, statusFilter, pendingContactOnly, pendingFollowUpOnly, showArchived, sortBy, sortOrder]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const { importedLeads, errors } = parseCSVToLeads(content);
        if (importedLeads.length > 0) {
          onImportLeads(importedLeads);
          setImportStatus(`Se importaron con éxito ${importedLeads.length} prospectos desde el archivo CSV.`);
        } else {
          setImportStatus(`Error al importar: ${errors.join(', ')}`);
        }
      }
    };
    reader.readAsText(file, 'UTF-8');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusBadge = (status: CommercialStatus, isPending?: boolean) => {
    if (isPending) {
      return (
        <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 w-fit">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Pendiente de contactar</span>
        </span>
      );
    }
    switch (status) {
      case 0:
        return <span className="text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-mono">Estado 0 · Sin resp / No</span>;
      case 1:
        return <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-mono">Estado 1 · Respondió 1 vez</span>;
      case 2:
        return <span className="text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-[11px] font-mono">Estado 2 · Demo pedida</span>;
      case 3:
        return <span className="text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-mono">Estado 3 · Rechazada</span>;
      case 4:
        return <span className="text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px] font-mono">Estado 4 · Negociando</span>;
      case 5:
        return <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-mono font-bold">Estado 5 · Venta cerrada</span>;
    }
  };

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return <span className="text-slate-400 italic font-sans font-normal text-[11px]">Aún no especificado</span>;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: settings.currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto bg-[#F8FAFC]">
      {/* Top Banner Actions & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Directorio de Prospectos & Clientes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro comercial de leads chinos y locales, canales (Redbook, WeChat, WhatsApp), ubicación y palabras clave de rechazo
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors cursor-pointer"
            title="Importar prospectos desde archivo CSV"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Importar CSV</span>
          </button>

          <button
            onClick={onNewLeadClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Lead</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
          <span>{importStatus}</span>
          <button onClick={() => setImportStatus(null)} className="text-indigo-600 font-bold ml-2">×</button>
        </div>
      )}

      {/* Filter and Search Bar - Aesthetic Light */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por empresa (ej: 喜茶), contacto, email, teléfono, ciudad o keyword de rechazo..."
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          {/* Origen Filter (Inbound Redbook, Outbound, Recomendado, etc.) */}
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">Todos los orígenes</option>
            <option value="Redbook (Inbound - Nos contactan)">Redbook (Inbound - Nos contactan)</option>
            <option value="Redbook (Outbound - Contactamos nosotros)">Redbook (Outbound - Contactamos nosotros)</option>
            <option value="WeChat (Inbound - Nos agregan / contactan)">WeChat (Inbound - Nos agregan)</option>
            <option value="WeChat (Outbound - Contactamos nosotros)">WeChat (Outbound - Contactamos)</option>
            <option value="Recomendado / Referido (推荐)">Recomendado / Referido (推荐)</option>
            <option value="WhatsApp Directo">WhatsApp Directo</option>
            <option value="Prospección Activa / Scraping">Prospección Activa / Scraping</option>
          </select>

          {/* Sector filter */}
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">Todos los sectores</option>
            <option value="Hostelería y Restauración">Hostelería y Restauración</option>
            <option value="Salud y Clínicas Médicas">Salud y Clínicas Médicas</option>
            <option value="E-commerce y Retail">E-commerce y Retail</option>
            <option value="Inmobiliaria y Promoción">Inmobiliaria y Promoción</option>
            <option value="Servicios Profesionales y Legal">Servicios & Legal</option>
            <option value="Fitness y Bienestar">Fitness y Bienestar</option>
            <option value="Industria y Fabricación">Industria y Fabricación</option>
            <option value="Educación y Formación">Educación y Formación</option>
          </select>

          {/* Channel filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">Todos los canales</option>
            <option value="Redbook (小红书)">Redbook (小红书)</option>
            <option value="WeChat (微信)">WeChat (微信)</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Recomendado (推荐)">Recomendado (推荐)</option>
            <option value="Email en frío">Email en frío</option>
            <option value="LinkedIn DM">LinkedIn DM</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-indigo-500"
          >
            <option value="all">Todos los estados</option>
            <option value="0">Estado 0 (Sin respuesta / No)</option>
            <option value="1">Estado 1 (Respondió 1 vez)</option>
            <option value="2">Estado 2 (Demo solicitada)</option>
            <option value="3">Estado 3 (Demo rechazada)</option>
            <option value="4">Estado 4 (Negociando propuesta)</option>
            <option value="5">Estado 5 (Venta cerrada)</option>
          </select>

          {/* Pendientes de contactar toggle button */}
          <button
            onClick={() => setPendingContactOnly(!pendingContactOnly)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              pendingContactOnly
                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${pendingContactOnly ? 'text-amber-700' : 'text-slate-400'}`} />
            <span>Pendientes de contactar</span>
          </button>

          {/* Archived toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
              showArchived
                ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {showArchived ? 'Viendo Archivados' : 'Ver Archivados'}
          </button>
        </div>
      </div>

      {/* Leads Table - Aesthetic Light */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 uppercase text-[10px] font-bold tracking-wider select-none">
              <tr>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => {
                    if (sortBy === 'commercialName') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('commercialName'); setSortOrder('asc'); }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Empresa / Contacto</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Origen / Canal</th>
                <th className="py-3 px-4">Localización</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => {
                    if (sortBy === 'status') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('status'); setSortOrder('asc'); }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Estado Comercial</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900"
                  onClick={() => {
                    if (sortBy === 'estimatedBudget') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('estimatedBudget'); setSortOrder('desc'); }
                  }}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Presupuesto</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Tono de Contacto</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => {
                    if (sortBy === 'lastContactDate') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('lastContactDate'); setSortOrder('desc'); }
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Último Contacto</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Objeción / Keyword Rechazo</th>
                <th className="py-3 px-4 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No se encontraron prospectos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                processedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Empresa / Contacto */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2">
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                            <span>{lead.commercialName || lead.companyName}</span>
                            {lead.doNotContact && (
                              <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1 py-0.2 rounded">
                                Robinson / Baja
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            <span className="font-medium text-slate-700">{lead.contactPerson || 'Sin contacto'}</span>
                            {lead.sector && <span className="text-slate-300 mx-1">·</span>}
                            <span>{lead.sector}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Origen / Canal */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-semibold text-slate-800 block truncate max-w-[170px]" title={String(lead.leadSource)}>
                          {lead.leadSource || 'Prospección directa'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded inline-block">
                          {lead.channel}
                        </span>
                      </div>
                    </td>

                    {/* Localización */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[130px]">{lead.location || 'No especificada'}</span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <select
                          value={lead.status}
                          onChange={(e) => {
                            const newSt = Number(e.target.value) as CommercialStatus;
                            if (newSt !== lead.status && onUpdateLeadStatus) {
                              onUpdateLeadStatus(lead.id, newSt);
                            }
                          }}
                          className="bg-white border border-slate-200 text-slate-800 text-[11px] font-mono font-semibold rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs hover:border-slate-300"
                          title="Cambiar estado comercial directamente"
                        >
                          <option value={0}>E0 · Sin resp / No</option>
                          <option value={1}>E1 · Respondió 1 vez</option>
                          <option value={2}>E2 · Demo pedida</option>
                          <option value={3}>E3 · Demo rechazada</option>
                          <option value={4}>E4 · Negociando</option>
                          <option value={5}>E5 · Venta cerrada</option>
                        </select>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onUpdateLeadStatus) {
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
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all border cursor-pointer ${
                            lead.isPendingContact
                              ? 'text-amber-900 bg-amber-100 border-amber-300 hover:bg-amber-200 shadow-xs'
                              : 'text-slate-500 bg-slate-50 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                          }`}
                          title={lead.isPendingContact ? 'Marcado como PENDIENTE. Haz clic para marcar como YA CONTACTADO' : 'Marcado como CONTACTADO. Haz clic para marcar como PENDIENTE de contactar'}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${lead.isPendingContact ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{lead.isPendingContact ? 'Pendiente' : 'Contactado'}</span>
                        </button>
                      </div>
                    </td>

                    {/* Presupuesto */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 tabular-nums">
                      {lead.status === 5
                        ? formatCurrency(lead.agreedAmount || lead.estimatedBudget)
                        : formatCurrency(lead.estimatedBudget)}
                    </td>

                    {/* Tono de Contacto */}
                    <td className="py-3.5 px-4">
                      {lead.contactTone ? (
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${
                          lead.contactTone.includes('谦逊') || lead.contactTone.includes('关系') || lead.contactTone.includes('务实') || lead.contactTone.includes('专业') || lead.contactTone.includes('亲切') || lead.contactTone.includes('促销')
                            ? 'text-red-800 bg-red-50/90 border-red-200 font-semibold flex items-center gap-1 w-fit'
                            : 'text-indigo-700 bg-indigo-50 border-indigo-100 capitalize'
                        }`}>
                          {(lead.contactTone.includes('谦逊') || lead.contactTone.includes('关系') || lead.contactTone.includes('务实')) && (
                            <span className="text-[10px]">🇨🇳</span>
                          )}
                          <span>{lead.contactTone.includes('(') ? lead.contactTone.split('(')[0].trim() : lead.contactTone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Consultivo</span>
                      )}
                    </td>

                    {/* Último Contacto */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 tabular-nums">
                      {lead.lastContactDate || lead.firstContactDate || 'Pendiente'}
                    </td>

                    {/* Objeción / Keyword de Rechazo */}
                    <td className="py-3.5 px-4">
                      {lead.rejectionKeywords && lead.rejectionKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {lead.rejectionKeywords.map((kw) => (
                            <span key={kw} className="text-[10px] font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded">
                              {kw}
                            </span>
                          ))}
                        </div>
                      ) : lead.rejectionReasons && lead.rejectionReasons.length > 0 ? (
                        <span className="text-[11px] text-rose-600 truncate block max-w-[150px]">
                          {lead.rejectionReasons.join(', ')}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectLead(lead);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Abrir ficha detallada del cliente"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
