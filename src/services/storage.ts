import { Lead, AppSettings } from '../types';
import { MOMO_ORIGINAL_LEAD } from '../data/demoData';

const STORAGE_KEY_LEADS = 'nimbus_crm_leads';
const STORAGE_KEY_SETTINGS = 'nimbus_app_settings';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'EUR',
  dateFormat: 'DD/MM/YYYY',
  agencyName: 'Nimbuscodex Studio',
  defaultResponsible: 'Alex M.',
  dataRetentionMonths: 24,
  strictGdprMode: true,
};

/**
 * Filter out artificial demo placeholder leads created as samples
 */
export function isFakeMockLead(lead: Lead | any): boolean {
  if (!lead) return true;
  if (lead.isDemo === true) return true;
  if (typeof lead.id === 'string' && /^lead-0[0-2][0-9]$/.test(lead.id)) return true;
  const name = (lead.commercialName || lead.companyName || '').toLowerCase();
  if (
    name.includes('xunwei') ||
    name.includes('寻味') ||
    name.includes('dingsheng') ||
    name.includes('鼎盛') ||
    name.includes('huaxia') ||
    name.includes('华夏工业') ||
    name.includes('huayang') ||
    name.includes('花漾花店') ||
    name.includes('silver moon') ||
    name.includes('银月珠宝')
  ) {
    return true;
  }
  return false;
}

// ==========================================
// SERVER PERSISTENCE & SYNC
// ==========================================

export async function fetchServerLeads(): Promise<Lead[] | null> {
  try {
    const res = await fetch('/api/leads');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && Array.isArray(data.leads)) {
      // 1. Filter out any mock dummy leads from server
      const cleanServerLeads = data.leads.filter((l: Lead) => !isFakeMockLead(l));

      // 2. Combine with any user leads locally stored in browser
      const localLeads = loadLeads();
      const mergedMap = new Map<string, Lead>();

      cleanServerLeads.forEach((l: Lead) => mergedMap.set(l.id, l));
      localLeads.forEach((l: Lead) => {
        if (!mergedMap.has(l.id)) {
          mergedMap.set(l.id, l);
        }
      });

      const merged = Array.from(mergedMap.values()).filter((l) => !isFakeMockLead(l));
      const finalList = merged.length > 0 ? merged : [MOMO_ORIGINAL_LEAD];

      // Ensure Momo has Redbook channel
      const sanitized = finalList.map((l) => {
        const isMomo = (l.commercialName && l.commercialName.toLowerCase().includes('momo')) ||
                       (l.companyName && l.companyName.toLowerCase().includes('momo'));
        if (isMomo && l.channel !== 'Redbook (小红书)') {
          return {
            ...l,
            channel: 'Redbook (小红书)' as const,
            leadSource: l.leadSource || 'Redbook (Inbound - Nos contactan)',
          };
        }
        return l;
      });

      localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(sanitized));

      // If local had leads not yet on server, update server
      if (sanitized.length > cleanServerLeads.length) {
        syncLeadsWithServer(sanitized);
      }

      return sanitized;
    }
  } catch (err) {
    console.warn('Could not fetch leads from server backend:', err);
  }
  return null;
}

export async function syncLeadsWithServer(leads: Lead[]): Promise<boolean> {
  try {
    const clean = leads.filter((l) => !isFakeMockLead(l));
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads: clean }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not persist leads to server:', err);
    return false;
  }
}

// ==========================================
// CLIENT LEADS MANAGEMENT (ORIGINAL USER LEADS ONLY)
// ==========================================

export function loadLeads(): Lead[] {
  try {
    const recoveredMap = new Map<string, Lead>();

    // Helper to safely inspect previous localStorage buckets
    const inspectStorage = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((l: Lead) => {
            if (!isFakeMockLead(l) && l && l.id) {
              recoveredMap.set(l.id, l);
            }
          });
        }
      } catch (e) {}
    };

    // 1. Recover from user's real storage
    inspectStorage('nimbus_leads_real');
    inspectStorage(STORAGE_KEY_LEADS);
    inspectStorage('nimbus_leads_demo');

    // 2. Purge fake sample keys from browser storage
    try {
      localStorage.removeItem('nimbus_leads_demo');
      localStorage.removeItem('nimbus_experiments_demo');
      localStorage.removeItem('nimbus_experiments_real');
    } catch (e) {}

    let realList = Array.from(recoveredMap.values());

    // 3. Ensure Momo lead is present as the user's original lead
    const hasMomo = realList.some(
      (l) =>
        (l.commercialName && l.commercialName.toLowerCase().includes('momo')) ||
        (l.companyName && l.companyName.toLowerCase().includes('momo'))
    );

    if (!hasMomo) {
      realList.unshift(MOMO_ORIGINAL_LEAD);
    }

    // 4. Sanitize channels (Momo strictly Redbook)
    realList = realList.map((l) => {
      const isMomo =
        (l.commercialName && l.commercialName.toLowerCase().includes('momo')) ||
        (l.companyName && l.companyName.toLowerCase().includes('momo'));
      if (isMomo) {
        return {
          ...l,
          channel: 'Redbook (小红书)' as const,
          leadSource:
            typeof l.leadSource === 'string' && l.leadSource.includes('Redbook')
              ? l.leadSource
              : 'Redbook (Inbound - Nos contactan)',
        };
      }
      return l;
    });

    localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(realList));
    return realList;
  } catch (e) {
    console.error('Error loading leads from storage:', e);
    return [MOMO_ORIGINAL_LEAD];
  }
}

export function saveLeads(leads: Lead[]): void {
  // Purge any accidental mock leads
  const clean = leads.filter((l) => !isFakeMockLead(l));

  try {
    localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(clean));
  } catch (e) {
    console.error('Error saving leads to localStorage:', e);
  }

  syncLeadsWithServer(clean);
}

// ==========================================
// SETTINGS
// ==========================================

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    }).catch(() => {});
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

// ==========================================
// DUPLICATE DETECTION
// ==========================================

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateField?: 'email' | 'domain' | 'phone';
  matchedLead?: Lead;
}

function extractDomain(url: string): string {
  try {
    if (!url) return '';
    let clean = url.trim().toLowerCase();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    const hostname = new URL(clean).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].trim();
  }
}

function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

export function checkDuplicateLead(
  leads: Lead[],
  target: {
    email?: string;
    currentWebsite?: string;
    phone?: string;
    idToIgnore?: string;
  }
): DuplicateCheckResult {
  const targetEmail = target.email?.toLowerCase().trim();
  const targetDomain = extractDomain(target.currentWebsite || '');
  const targetPhone = normalizePhone(target.phone || '');

  for (const lead of leads) {
    if (target.idToIgnore && lead.id === target.idToIgnore) continue;

    if (targetEmail && lead.email && lead.email.toLowerCase().trim() === targetEmail) {
      return { isDuplicate: true, duplicateField: 'email', matchedLead: lead };
    }

    if (targetDomain && lead.currentWebsite) {
      const leadDomain = extractDomain(lead.currentWebsite);
      if (leadDomain && leadDomain === targetDomain) {
        return { isDuplicate: true, duplicateField: 'domain', matchedLead: lead };
      }
    }

    if (targetPhone && lead.phone) {
      const leadPhone = normalizePhone(lead.phone);
      if (leadPhone && leadPhone.length >= 7 && leadPhone === targetPhone) {
        return { isDuplicate: true, duplicateField: 'phone', matchedLead: lead };
      }
    }
  }

  return { isDuplicate: false };
}

// ==========================================
// CSV EXPORT & IMPORT
// ==========================================

export function exportLeadsToCSV(leads: Lead[]): void {
  const clean = leads.filter((l) => !isFakeMockLead(l));
  const headers = [
    'ID',
    'Nombre Comercial',
    'Empresa',
    'Persona de Contacto',
    'Email',
    'Teléfono',
    'Web Actual',
    'Canal',
    'Tono de Contacto',
    'Sector',
    'Ubicación',
    'Estado (0-5)',
    'Servicio Ofrecido',
    'Presupuesto (€)',
    'Valor Potencial (€)',
    'Importe Acordado (€)',
    'Importe Cobrado (€)',
    'Prioridad',
    'Responsable',
    'Fecha Alta',
    'Fecha Primer Contacto',
    'Día Último Contacto',
    'Fecha Siguiente Seguimiento',
    'No Contactar (RGPD)',
    'Notas',
  ];

  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = clean.map((l) =>
    [
      escapeCSV(l.id),
      escapeCSV(l.commercialName),
      escapeCSV(l.companyName),
      escapeCSV(l.contactPerson),
      escapeCSV(l.email),
      escapeCSV(l.phone),
      escapeCSV(l.currentWebsite),
      escapeCSV(l.channel),
      escapeCSV(l.contactTone || ''),
      escapeCSV(l.sector),
      escapeCSV(l.location),
      escapeCSV(`Estado ${l.status}`),
      escapeCSV(l.offeredService),
      escapeCSV(l.estimatedBudget !== null ? l.estimatedBudget : 'Aún no especificado'),
      escapeCSV(l.potentialValue !== null ? l.potentialValue : 'Aún no especificado'),
      escapeCSV(l.agreedAmount || 0),
      escapeCSV(l.collectedAmount || 0),
      escapeCSV(l.priority),
      escapeCSV(l.assignedTo),
      escapeCSV(l.createdAt),
      escapeCSV(l.firstContactDate),
      escapeCSV(l.lastContactDate || ''),
      escapeCSV(l.nextFollowUpDate),
      escapeCSV(l.doNotContact ? 'SÍ' : 'NO'),
      escapeCSV(l.notes),
    ].join(',')
  );

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseCSVToLeads(csvText: string): { importedLeads: Partial<Lead>[]; errors: string[] } {
  const errors: string[] = [];
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { importedLeads: [], errors: ['El archivo CSV no contiene filas de datos.'] };
  }

  const delimiter = lines[0].includes(';') ? ';' : ',';

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headerCols = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[\s\-_]/g, ''));

  const findCol = (keywords: string[]) => {
    return headerCols.findIndex((h) => keywords.some((k) => h.includes(k)));
  };

  const colCompany = findCol(['empresa', 'company', 'nombrecomercial']);
  const colContact = findCol(['contacto', 'persona', 'nombre']);
  const colEmail = findCol(['email', 'correo']);
  const colPhone = findCol(['tel', 'telefono', 'phone', 'movil']);
  const colWeb = findCol(['web', 'sitio', 'url', 'pagina']);
  const colSector = findCol(['sector', 'industria', 'categoria']);
  const colLocation = findCol(['ubicacion', 'ciudad', 'localidad', 'provincia']);
  const colStatus = findCol(['estado', 'status', 'fase']);
  const colBudget = findCol(['presupuesto', 'budget', 'estimado']);
  const colChannel = findCol(['canal', 'channel']);
  const colTone = findCol(['tono', 'tone']);
  const colLastContact = findCol(['ultimocontacto', 'lastcontact', 'ultimavez']);

  const importedLeads: Partial<Lead>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = parseLine(lines[i]);
    if (!vals || vals.length === 0 || !vals.some((v) => v.length > 0)) continue;

    const companyName = colCompany >= 0 ? vals[colCompany] : `Prospecto #${i}`;
    const email = colEmail >= 0 ? vals[colEmail] : '';
    const phone = colPhone >= 0 ? vals[colPhone] : '';
    const currentWebsite = colWeb >= 0 ? vals[colWeb] : '';

    let status = 0;
    if (colStatus >= 0 && vals[colStatus]) {
      const match = vals[colStatus].match(/[0-5]/);
      if (match) status = parseInt(match[0], 10);
    }

    let parsedBudget: number | null = null;
    if (colBudget >= 0 && vals[colBudget]) {
      const rawVal = vals[colBudget].trim().toLowerCase();
      if (!rawVal.includes('no especificado') && !rawVal.includes('definir') && rawVal !== '') {
        const num = parseFloat(rawVal.replace(/[^0-9.]/g, ''));
        if (!isNaN(num) && num > 0) {
          parsedBudget = num;
        }
      }
    }

    const channelVal = colChannel >= 0 && vals[colChannel] ? vals[colChannel] : 'Redbook (小红书)';
    const toneVal = colTone >= 0 && vals[colTone] ? vals[colTone] : 'Consultivo';
    const lastContactVal =
      colLastContact >= 0 && vals[colLastContact]
        ? vals[colLastContact]
        : new Date().toISOString().split('T')[0];

    importedLeads.push({
      companyName: companyName || 'Empresa sin nombre',
      commercialName: companyName || 'Prospecto',
      contactPerson: colContact >= 0 ? vals[colContact] : '',
      email,
      phone,
      currentWebsite,
      sector: (colSector >= 0 && vals[colSector] ? vals[colSector] : 'Otro') as any,
      location: colLocation >= 0 ? vals[colLocation] : '',
      status: status as any,
      estimatedBudget: parsedBudget,
      potentialValue: parsedBudget,
      channel: channelVal as any,
      contactTone: toneVal,
      lastContactDate: lastContactVal,
      offeredService: 'Rediseño web corporativo',
      priority: 'Media',
      assignedTo: 'Alex M.',
      leadSource: 'Importación CSV',
      notes: 'Importado vía archivo CSV',
      nextFollowUpDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      firstContactDate: new Date().toISOString().split('T')[0],
      doNotContact: false,
      isArchived: false,
      transitions: [],
      interactions: [],
    });
  }

  return { importedLeads, errors };
}
