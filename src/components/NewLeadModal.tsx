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
import { X, AlertTriangle, UserPlus, MapPin, Radio } from 'lucide-react';
import { checkDuplicateLead } from '../services/storage';

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
      contactTone,
      offeredService,
      estimatedBudget: finalBudget,
      potentialValue: finalBudget ? Math.round(finalBudget * 1.25) : null,
      priority,
      assignedTo,
      notes: notes.trim(),
      nextFollowUpDate,
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

        {/* Pendiente de contactar toggle */}
        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-950 font-medium">
            <Radio className="w-4 h-4 text-amber-600" />
            <span>¿Marcar como pendiente de contactar?</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPendingContact}
              onChange={(e) => setIsPendingContact(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
          </label>
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
