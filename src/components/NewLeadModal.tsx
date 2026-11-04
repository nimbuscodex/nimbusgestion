import React, { useState } from 'react';
import { 
  Lead, 
  CommercialStatus, 
  BusinessSector, 
  OutreachChannel, 
  ServiceOffered, 
  LeadPriority,
  LeadOrigin,
  AppSettings 
} from '../types';
import { X, AlertTriangle, UserPlus, MapPin, Radio, Clock, CalendarClock, Repeat } from 'lucide-react';
import { checkDuplicateLead } from '../services/storage';
import { calculateScheduleDate, formatScheduleBadge } from '../utils/dateSchedule';

interface NewLeadModalProps {
  allLeads: Lead[];
  onClose: () => void;
  onSave: (newLead: Lead) => void;
  settings: AppSettings;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  allLeads,
  onClose,
  onSave,
  settings,
}) => {
  const [commercialName, setCommercialName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [currentWebsite, setCurrentWebsite] = useState<string>('');
  const [socialUrl, setSocialUrl] = useState<string>('');
  const [sector, setSector] = useState<BusinessSector>('Hostelería y Restauración');
  const [location, setLocation] = useState<string>('');
  const [channel, setChannel] = useState<OutreachChannel>('Redbook (小红书)');
  const [leadSource, setLeadSource] = useState<LeadOrigin>('Redbook (Inbound - Nos contactan)');
  const [isPendingContact, setIsPendingContact] = useState<boolean>(true);
  const [contactSchedulePreset, setContactSchedulePreset] = useState<'1_week' | '1_month' | 'tomorrow' | 'custom'>('1_week');
  const [scheduledContactDate, setScheduledContactDate] = useState<string>(calculateScheduleDate('1_week'));

  const [isPendingFollowUp, setIsPendingFollowUp] = useState<boolean>(false);
  const [followUpSchedulePreset, setFollowUpSchedulePreset] = useState<'1_week' | '1_month' | 'tomorrow' | 'custom'>('1_week');
  const [scheduledFollowUpDate, setScheduledFollowUpDate] = useState<string>(calculateScheduleDate('1_week'));

  const [contactTone, setContactTone] = useState<string>('Consultivo');
  const [offeredService, setOfferedService] = useState<ServiceOffered>('Rediseño web corporativo');
  
  // Budget - Support "Aún no especificado"
  const [isBudgetUnspecified, setIsBudgetUnspecified] = useState<boolean>(false);
  const [estimatedBudget, setEstimatedBudget] = useState<number>(3200);
  
  const [priority, setPriority] = useState<LeadPriority>('Media');
  const [assignedTo, setAssignedTo] = useState<string>(settings.defaultResponsible || 'Alex M.');
  const [notes, setNotes] = useState<string>('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<CommercialStatus>(0);

  // Duplicate warning
  const duplicateResult = checkDuplicateLead(allLeads, {
    email,
    currentWebsite,
    phone,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commercialName.trim() && !companyName.trim()) return;

    const finalBudget = isBudgetUnspecified ? null : Number(estimatedBudget);

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      commercialName: commercialName.trim() || companyName.trim(),
      companyName: companyName.trim() || commercialName.trim(),
      contactPerson: contactPerson.trim(),
      email: email.trim(),
      phone: phone.trim(),
      currentWebsite: currentWebsite.trim(),
      socialUrl: socialUrl.trim(),
      sector,
      location: location.trim(),
      channel,
      leadSource,
      isPendingContact,
      contactSchedulePreset: isPendingContact ? contactSchedulePreset : undefined,
      scheduledContactDate: isPendingContact ? scheduledContactDate : undefined,
      isPendingFollowUp,
      followUpSchedulePreset: isPendingFollowUp ? followUpSchedulePreset : undefined,
      scheduledFollowUpDate: isPendingFollowUp ? scheduledFollowUpDate : undefined,
      contactTone,
      offeredService,
      estimatedBudget: finalBudget,
      potentialValue: finalBudget ? Math.round(finalBudget * 1.25) : null,
      priority,
      assignedTo,
      notes: notes.trim(),
      nextFollowUpDate: isPendingFollowUp && scheduledFollowUpDate ? scheduledFollowUpDate : nextFollowUpDate,
      status,
      createdAt: new Date().toISOString().split('T')[0],
      firstContactDate: isPendingContact ? '' : new Date().toISOString().split('T')[0],
      lastContactDate: isPendingContact ? undefined : new Date().toISOString().split('T')[0],
      doNotContact: false,
      isArchived: false,
      transitions: [
        {
          id: `tr-${Date.now()}`,
          fromStatus: status,
          toStatus: status,
          date: new Date().toISOString().split('T')[0],
          notes: 'Alta inicial del prospecto',
        },
      ],
      interactions: [],
      isDemo: false,
    };

    onSave(newLead);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-auto text-slate-800"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Registrar Nuevo Prospecto Comercial
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Warning Banner */}
        {duplicateResult.isDuplicate && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Posible contacto duplicado:</strong> Ya existe un lead registrado con este{' '}
              {duplicateResult.duplicateField} (
              <strong>{duplicateResult.matchedLead?.commercialName}</strong>).
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          <div>
            <label className="text-slate-700 block mb-1 font-semibold">
              Nombre Comercial *
            </label>
            <input
              type="text"
              required
              value={commercialName}
              onChange={(e) => setCommercialName(e.target.value)}
              placeholder="Ej: 喜茶 Heytea / 寻味川菜"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">
              Razón Social / Empresa
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej: Heytea España S.L."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">
              Persona de Contacto
            </label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Ej: 王敏 (Gerente de Expansión)"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Localización del Cliente</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Madrid - Usera, Barcelona, Valencia, Shanghai..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          {/* Origen del Lead (Inbound Redbook, Outbound, Recomendado, etc.) */}
          <div>
            <label className="text-slate-700 block mb-1 font-semibold flex items-center justify-between">
              <span>Origen del Lead *</span>
              <span className="text-[10px] text-indigo-600 font-normal">Sincroniza canal</span>
            </label>
            <select
              value={leadSource}
              onChange={(e) => {
                const val = e.target.value as LeadOrigin;
                setLeadSource(val);
                if (val.includes('Redbook')) {
                  setChannel('Redbook (小红书)');
                } else if (val.includes('WeChat')) {
                  setChannel('WeChat (微信)');
                } else if (val.includes('WhatsApp')) {
                  setChannel('WhatsApp');
                } else if (val.includes('Recomendado')) {
                  setChannel('Recomendado (推荐)');
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium"
            >
              <option value="Redbook (Inbound - Nos contactan)">Redbook (Inbound - Nos contactan ellos)</option>
              <option value="Redbook (Outbound - Contactamos nosotros)">Redbook (Outbound - Contactamos nosotros)</option>
              <option value="WeChat (Inbound - Nos agregan / contactan)">WeChat (Inbound - Nos agregan / contactan)</option>
              <option value="WeChat (Outbound - Contactamos nosotros)">WeChat (Outbound - Contactamos nosotros)</option>
              <option value="Recomendado / Referido (推荐)">Recomendado / Referido (推荐)</option>
              <option value="WhatsApp Directo">WhatsApp Directo</option>
              <option value="Web Inbound / Formulario">Web Inbound / Formulario</option>
              <option value="Prospección Activa / Scraping">Prospección Activa / Scraping</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold flex items-center justify-between">
              <span>Canal de Comunicación</span>
              <span className="text-[10px] text-slate-500 font-normal">Canal efectivo</span>
            </label>
            <select
              value={channel}
              onChange={(e) => {
                const newCh = e.target.value as OutreachChannel;
                setChannel(newCh);
                if (newCh === 'Redbook (小红书)' && !leadSource.includes('Redbook')) {
                  setLeadSource('Redbook (Inbound - Nos contactan)');
                } else if (newCh === 'WeChat (微信)' && !leadSource.includes('WeChat')) {
                  setLeadSource('WeChat (Inbound - Nos agregan / contactan)');
                } else if (newCh === 'WhatsApp' && !leadSource.includes('WhatsApp')) {
                  setLeadSource('WhatsApp Directo');
                } else if (newCh === 'Recomendado (推荐)' && !leadSource.includes('Recomendado')) {
                  setLeadSource('Recomendado / Referido (推荐)');
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 font-medium"
            >
              <option value="Redbook (小红书)">Redbook (小红书)</option>
              <option value="WeChat (微信)">WeChat (微信)</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Recomendado (推荐)">Recomendado (推荐)</option>
              <option value="Email en frío">Email en frío</option>
              <option value="LinkedIn DM">LinkedIn DM</option>
              <option value="Instagram DM">Instagram DM</option>
              <option value="Llamada / Teléfono">Llamada / Teléfono</option>
              <option value="Formulario web">Formulario web</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">
              Tono de Mensaje Inicial
            </label>
            <select
              value={contactTone}
              onChange={(e) => setContactTone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
            >
              <optgroup label="🇨🇳 Tonos Chinos (商务沟通语调)">
                <option value="谦逊礼貌 (Humble & Polite)">谦逊礼貌 (Humble & Polite / 客气谦逊)</option>
                <option value="建立关系 (Guanxi & Trust)">建立关系 (Guanxi & Trust / 同胞与熟人)</option>
                <option value="务实真诚 (Pragmatic & ROI)">务实真诚 (Pragmatic & ROI / 降本增效)</option>
                <option value="专业背书 (Authority & Social Proof)">专业背书 (Authority & Social Proof / 案例背书)</option>
                <option value="亲切诚恳 (Warm & Sincere)">亲切诚恳 (Warm & Sincere / 亲切热诚)</option>
                <option value="促销让利 (Direct Offer & Benefit)">促销让利 (Direct Offer & Benefit / 优惠让利)</option>
              </optgroup>
              <optgroup label="🇪🇸 Tonos Estándar B2B">
                <option value="Consultivo">Consultivo (Auditoría previa)</option>
                <option value="Cercano">Cercano & Empático</option>
                <option value="Orientado a beneficios">Orientado a beneficios</option>
                <option value="Directo">Directo al grano</option>
                <option value="Profesional">Profesional formal</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">
              Web Actual (URL)
            </label>
            <input
              type="text"
              value={currentWebsite}
              onChange={(e) => setCurrentWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@empresa.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">
              Teléfono / WeChat ID
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+34 600... o WeChat ID"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">
              Sector
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as BusinessSector)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
            >
              <option value="Hostelería y Restauración">Hostelería y Restauración</option>
              <option value="Salud y Clínicas Médicas">Salud y Clínicas Médicas</option>
              <option value="E-commerce y Retail">E-commerce y Retail</option>
              <option value="Inmobiliaria y Promoción">Inmobiliaria y Promoción</option>
              <option value="Servicios Profesionales y Legal">Servicios Profesionales y Legal</option>
              <option value="Fitness y Bienestar">Fitness y Bienestar</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* Presupuesto con opción de "Aún no especificado" */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-semibold">
                Presupuesto Estimado (€)
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBudgetUnspecified}
                  onChange={(e) => setIsBudgetUnspecified(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Aún no especificado</span>
              </label>
            </div>
            <input
              type="number"
              disabled={isBudgetUnspecified}
              value={isBudgetUnspecified ? '' : estimatedBudget}
              onChange={(e) => setEstimatedBudget(Number(e.target.value))}
              placeholder={isBudgetUnspecified ? 'Por definir en cualificación' : '3200'}
              className={`w-full border rounded-lg p-2.5 font-mono text-slate-900 focus:outline-none ${
                isBudgetUnspecified ? 'bg-slate-100 border-slate-200 text-slate-400 italic' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
              }`}
            />
          </div>
        </div>

        {/* Card 1: Contacto Inicial & Programación (1 semana, 1 mes) */}
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-950 font-bold">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Estado de Contacto Inicial (Selección Manual):</span>
              </div>
              <p className="text-[11px] text-amber-800 mt-0.5">
                {isPendingContact 
                  ? 'Guardando como PENDIENTE de contactar. Selecciona cuándo contactarle (1 semana, 1 mes, etc.):' 
                  : 'Guardando como YA CONTACTADO inicialmente.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-amber-200 shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setIsPendingContact(true);
                  if (!scheduledContactDate) {
                    setScheduledContactDate(calculateScheduleDate('1_week'));
                  }
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  isPendingContact
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>⏳ Pendiente de contactar</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPendingContact(false)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  !isPendingContact
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>✓ Ya contactado</span>
              </button>
            </div>
          </div>

          {isPendingContact && (
            <div className="pt-2 border-t border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white/70 p-3 rounded-lg">
              <div>
                <span className="text-xs font-semibold text-amber-950 block">¿Cuándo contactar?</span>
                <p className="text-[11px] text-amber-800">
                  Programado:{' '}
                  <strong className="text-amber-950 font-mono">
                    {formatScheduleBadge(scheduledContactDate, 'Contactar').label}
                  </strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-amber-100/90 p-0.5 rounded-lg border border-amber-200">
                  <button
                    type="button"
                    onClick={() => {
                      setContactSchedulePreset('1_week');
                      setScheduledContactDate(calculateScheduleDate('1_week'));
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                      contactSchedulePreset === '1_week'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    📅 En 1 semana
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContactSchedulePreset('1_month');
                      setScheduledContactDate(calculateScheduleDate('1_month'));
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                      contactSchedulePreset === '1_month'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    🗓️ En 1 mes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setContactSchedulePreset('tomorrow');
                      setScheduledContactDate(calculateScheduleDate('tomorrow'));
                    }}
                    className={`px-2 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                      contactSchedulePreset === 'tomorrow'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-amber-900 hover:bg-amber-200'
                    }`}
                  >
                    ⚡ Mañana
                  </button>
                </div>

                <input
                  type="date"
                  value={scheduledContactDate}
                  onChange={(e) => {
                    setContactSchedulePreset('custom');
                    setScheduledContactDate(e.target.value);
                  }}
                  className="bg-white border border-amber-300 text-slate-800 text-xs rounded-lg px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Seguimiento Comercial & Programación */}
        <div className="p-4 rounded-xl bg-purple-50/80 border border-purple-200/90 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-purple-950 font-bold">
                <CalendarClock className="w-4 h-4 text-purple-600" />
                <span>Seguimiento Comercial (Selección Manual):</span>
              </div>
              <p className="text-[11px] text-purple-800 mt-0.5">
                {isPendingFollowUp 
                  ? 'Marcado como PENDIENTE de seguimiento. Selecciona cuándo programarlo:' 
                  : 'Sin seguimiento comercial pendiente.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-purple-200 shrink-0 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setIsPendingFollowUp(true);
                  if (!scheduledFollowUpDate) {
                    setScheduledFollowUpDate(calculateScheduleDate('1_week'));
                  }
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  isPendingFollowUp
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>🔄 Pendiente de seguimiento</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPendingFollowUp(false)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  !isPendingFollowUp
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>✓ Al día</span>
              </button>
            </div>
          </div>

          {isPendingFollowUp && (
            <div className="pt-2 border-t border-purple-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white/70 p-3 rounded-lg">
              <div>
                <span className="text-xs font-semibold text-purple-950 block">¿Cuándo hacer el seguimiento?</span>
                <p className="text-[11px] text-purple-800">
                  Programado:{' '}
                  <strong className="text-purple-950 font-mono">
                    {formatScheduleBadge(scheduledFollowUpDate, 'Seguimiento').label}
                  </strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-purple-100/90 p-0.5 rounded-lg border border-purple-200">
                  <button
                    type="button"
                    onClick={() => {
                      setFollowUpSchedulePreset('1_week');
                      setScheduledFollowUpDate(calculateScheduleDate('1_week'));
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                      followUpSchedulePreset === '1_week'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-purple-900 hover:bg-purple-200'
                    }`}
                  >
                    📅 En 1 semana
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFollowUpSchedulePreset('1_month');
                      setScheduledFollowUpDate(calculateScheduleDate('1_month'));
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                      followUpSchedulePreset === '1_month'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-purple-900 hover:bg-purple-200'
                    }`}
                  >
                    🗓️ En 1 mes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFollowUpSchedulePreset('tomorrow');
                      setScheduledFollowUpDate(calculateScheduleDate('tomorrow'));
                    }}
                    className={`px-2 py-1 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                      followUpSchedulePreset === 'tomorrow'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-purple-900 hover:bg-purple-200'
                    }`}
                  >
                    ⚡ Mañana
                  </button>
                </div>

                <input
                  type="date"
                  value={scheduledFollowUpDate}
                  onChange={(e) => {
                    setFollowUpSchedulePreset('custom');
                    setScheduledFollowUpDate(e.target.value);
                  }}
                  className="bg-white border border-purple-300 text-slate-800 text-xs rounded-lg px-2 py-1 font-mono focus:outline-none focus:ring-1 focus:ring-purple-500 shadow-xs"
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="text-slate-700 block mb-1 text-xs font-semibold">
            Notas Iniciales / Diagnóstico del Sitio Web
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Puntos débiles detectados en su web móvil, redes chinas (Redbook), necesidades..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            Guardar Prospecto
          </button>
        </div>
      </form>
    </div>
  );
};
