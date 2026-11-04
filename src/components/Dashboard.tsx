import React, { useState, useMemo } from 'react';
import { 
  Lead, 
  CommercialStatus, 
  AppSettings 
} from '../types';
import { 
  TrendingUp, 
  Users, 
  Send, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  Briefcase, 
  Award, 
  Euro, 
  Filter, 
  BarChart3, 
  Compass, 
  Layers, 
  Flame, 
  Clock, 
  Zap, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface DashboardProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  settings: AppSettings;
}

export const Dashboard: React.FC<DashboardProps> = ({ leads, onSelectLead, settings }) => {
  // Filters
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [toneFilter, setToneFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    const now = Date.now();
    return leads.filter((l) => {
      // Date filter
      if (dateFilter !== 'all') {
        const leadTime = new Date(l.createdAt).getTime();
        const days = (now - leadTime) / (1000 * 60 * 60 * 24);
        if (dateFilter === '7d' && days > 7) return false;
        if (dateFilter === '30d' && days > 30) return false;
        if (dateFilter === '90d' && days > 90) return false;
      }
      // Sector
      if (sectorFilter !== 'all' && l.sector !== sectorFilter) return false;
      // Channel
      if (channelFilter !== 'all' && l.channel !== channelFilter) return false;
      // Status
      if (statusFilter !== 'all' && String(l.status) !== statusFilter) return false;
      // Tone (if contactTone matches or interaction has tone)
      if (toneFilter !== 'all') {
        const matchContactTone = l.contactTone?.toLowerCase() === toneFilter.toLowerCase();
        const hasInteractionTone = l.interactions.some((i) =>
          i.toneAnalysis?.primaryTones.some((t) => t.tone.toLowerCase() === toneFilter.toLowerCase())
        );
        if (!matchContactTone && !hasInteractionTone) return false;
      }
      return true;
    });
  }, [leads, dateFilter, sectorFilter, channelFilter, statusFilter, toneFilter]);

  // Unique Sectors and Channels in leads
  const sectorsList = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => l.sector && set.add(l.sector));
    return Array.from(set);
  }, [leads]);

  const channelsList = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => l.channel && set.add(l.channel));
    return Array.from(set);
  }, [leads]);

  const tonesList = [
    'consultivo',
    'orientado a beneficios',
    'directo',
    'cercano',
    'profesional',
    'centrado en problemas',
    'técnico',
    'breve'
  ];

  // Mathematical KPIs computation (Strict formulas with distinct Numerators and Denominators)
  const stats = useMemo(() => {
    const totalLeads = filteredLeads.length;

    // Contacted leads: lead with firstContactDate or at least 1 interaction or status > 0
    const contactedLeads = filteredLeads.filter(
      (l) => l.firstContactDate || l.interactions.length > 0 || l.status > 0
    ).length;

    // New leads created in the last 14 days
    const now = Date.now();
    const newLeads = filteredLeads.filter((l) => {
      const diff = (now - new Date(l.createdAt).getTime()) / (1000 * 3600 * 24);
      return diff <= 14;
    }).length;

    // Responded leads: leads with at least 1 response received OR status >= 1
    const respondedLeads = filteredLeads.filter(
      (l) => l.status >= 1 || l.interactions.some((i) => i.responseReceived)
    ).length;

    // Interested leads: arrived at demo, negotiation or closed sale (status 2, 3, 4, 5) OR positive interaction
    const interestedLeads = filteredLeads.filter(
      (l) => l.status >= 2 || l.interactions.some((i) => i.interactionResult === 'Respuesta positiva' || i.interactionResult === 'Agendó demo')
    ).length;

    // Demos requested: reached Status 2 or higher
    const demosRequested = filteredLeads.filter((l) => l.status >= 2).length;

    // Demos completed: arrived at status 3, 4, or 5
    const demosCompleted = filteredLeads.filter((l) => l.status >= 3).length;

    // Open negotiations: currently in status 4
    const openNegotiations = filteredLeads.filter((l) => l.status === 4).length;

    // Closed sales: currently in status 5
    const closedSales = filteredLeads.filter((l) => l.status === 5).length;

    // Rates:
    const responseRate = contactedLeads > 0 ? (respondedLeads / contactedLeads) * 100 : 0;
    const interestRate = contactedLeads > 0 ? (interestedLeads / contactedLeads) * 100 : 0;
    const demoRate = contactedLeads > 0 ? (demosRequested / contactedLeads) * 100 : 0;
    const demoToSaleRate = demosCompleted > 0 ? (closedSales / demosCompleted) * 100 : 0;
    const closedSaleRate = contactedLeads > 0 ? (closedSales / contactedLeads) * 100 : 0;

    // Financial calculations: Agreed vs Effectively Collected
    let totalAgreedSold = 0;
    let totalCollectedAmount = 0;
    let totalPotentialPipeline = 0;

    filteredLeads.forEach((l) => {
      if (l.status === 5) {
        totalAgreedSold += l.agreedAmount || l.estimatedBudget || 0;
        totalCollectedAmount += l.collectedAmount || 0;
      }
      if (l.status === 2 || l.status === 4) {
        totalPotentialPipeline += l.potentialValue || l.estimatedBudget || 0;
      }
    });

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      respondedLeads,
      responseRate,
      interestedLeads,
      interestRate,
      demosRequested,
      demoRate,
      demosCompleted,
      openNegotiations,
      closedSales,
      closedSaleRate,
      demoToSaleRate,
      totalAgreedSold,
      totalCollectedAmount,
      totalPotentialPipeline,
    };
  }, [filteredLeads]);

  // ==========================================
  // CONVERSION VELOCITY & BOTTLENECK ANALYSIS (100% REAL MATHEMATICAL DERIVATION)
  // ==========================================
  const velocityData = useMemo(() => {
    // Stage-to-stage transitions duration accumulation
    const transitionDurations: Record<string, number[]> = {
      '0->1': [], // First response
      '1->2': [], // Demo requested
      '2->4': [], // Negotiating proposal
      '4->5': [], // Closed sale
    };

    const fullCycleDays: number[] = [];
    const toneVelocity: Record<string, { daysToDemo: number[]; sales: number; totalLeads: number }> = {};
    const channelVelocity: Record<string, { daysToDemo: number[]; totalLeads: number; sales: number }> = {};

    filteredLeads.forEach((lead) => {
      // 1. Analyze explicit transition records
      if (lead.transitions && lead.transitions.length > 0) {
        lead.transitions.forEach((tr) => {
          const key = `${tr.fromStatus}->${tr.toStatus}`;
          if (transitionDurations[key] !== undefined && typeof tr.durationDays === 'number' && tr.durationDays >= 0) {
            transitionDurations[key].push(tr.durationDays);
          }
        });
      }

      // 2. Derive durations from concrete timestamps if transitions did not store durationDays
      if (transitionDurations['0->1'].length === 0 && lead.status >= 1 && lead.firstContactDate) {
        const respDate = lead.lastResponseDate || lead.interactions.find(i => i.responseReceived)?.responseDate;
        if (respDate) {
          const diff = (new Date(respDate).getTime() - new Date(lead.firstContactDate).getTime()) / (1000 * 3600 * 24);
          if (diff >= 0) transitionDurations['0->1'].push(Math.round(diff));
        }
      }

      if (transitionDurations['1->2'].length === 0 && lead.status >= 2 && lead.demoScheduledDate) {
        const prev = lead.lastResponseDate || lead.firstContactDate;
        if (prev) {
          const diff = (new Date(lead.demoScheduledDate).getTime() - new Date(prev).getTime()) / (1000 * 3600 * 24);
          if (diff >= 0) transitionDurations['1->2'].push(Math.round(diff));
        }
      }

      // 3. If closed sale (status 5), compute total sales cycle days
      if (lead.status === 5) {
        const start = lead.firstContactDate || lead.createdAt;
        const end = lead.closedDate || lead.transitions?.find(t => t.toStatus === 5)?.date;
        if (start && end) {
          const diff = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 3600 * 24);
          if (diff >= 0) fullCycleDays.push(Math.round(diff));
        }
      }

      // 4. Outreach Tone velocity to demo
      const tone = (lead.contactTone || 'Consultivo').toLowerCase();
      if (!toneVelocity[tone]) {
        toneVelocity[tone] = { daysToDemo: [], sales: 0, totalLeads: 0 };
      }
      toneVelocity[tone].totalLeads += 1;
      if (lead.status === 5) toneVelocity[tone].sales += 1;

      const demoTr = lead.transitions?.find(t => t.toStatus === 2);
      if (demoTr && typeof demoTr.durationDays === 'number' && demoTr.durationDays >= 0) {
        toneVelocity[tone].daysToDemo.push(demoTr.durationDays);
      }

      // 5. Channel velocity to demo
      const ch = lead.channel || 'Redbook (小红书)';
      if (!channelVelocity[ch]) {
        channelVelocity[ch] = { daysToDemo: [], totalLeads: 0, sales: 0 };
      }
      channelVelocity[ch].totalLeads += 1;
      if (lead.status === 5) channelVelocity[ch].sales += 1;
      if (demoTr && typeof demoTr.durationDays === 'number' && demoTr.durationDays >= 0) {
        channelVelocity[ch].daysToDemo.push(demoTr.durationDays);
      }
    });

    const calcAvg = (arr: number[]): number | null => {
      if (!arr || arr.length === 0) return null;
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    };

    const avg0to1 = calcAvg(transitionDurations['0->1']);
    const count0to1 = transitionDurations['0->1'].length;

    const avg1to2 = calcAvg(transitionDurations['1->2']);
    const count1to2 = transitionDurations['1->2'].length;

    const avg2to4 = calcAvg(transitionDurations['2->4']);
    const count2to4 = transitionDurations['2->4'].length;

    const avg4to5 = calcAvg(transitionDurations['4->5']);
    const count4to5 = transitionDurations['4->5'].length;

    const avgFullCycle = calcAvg(fullCycleDays);
    const countFullCycle = fullCycleDays.length;

    // Detect bottleneck: stage with the highest actual average duration
    const stages = [
      { id: '0->1', name: 'Primer Contacto → Respuesta (E0 a E1)', days: avg0to1, count: count0to1, severity: (avg0to1 !== null && avg0to1 > 4) ? 'high' : 'normal' },
      { id: '1->2', name: 'Respuesta → Demo Agendada (E1 a E2)', days: avg1to2, count: count1to2, severity: (avg1to2 !== null && avg1to2 > 5) ? 'high' : 'normal' },
      { id: '2->4', name: 'Demo Realizada → Negociación (E2 a E4)', days: avg2to4, count: count2to4, severity: (avg2to4 !== null && avg2to4 > 5) ? 'high' : 'normal' },
      { id: '4->5', name: 'Negociación → Venta Cerrada (E4 a E5)', days: avg4to5, count: count4to5, severity: (avg4to5 !== null && avg4to5 > 7) ? 'bottleneck' : 'normal' },
    ];

    const stagesWithData = stages.filter(s => s.days !== null) as Array<typeof stages[0] & { days: number }>;
    const bottleneck = stagesWithData.length > 0 ? [...stagesWithData].sort((a, b) => b.days - a.days)[0] : null;

    // Summary of tones velocity (real metrics only)
    const toneVelocityList = Object.entries(toneVelocity).map(([tone, data]) => ({
      tone,
      avgDaysToDemo: calcAvg(data.daysToDemo),
      demoCount: data.daysToDemo.length,
      totalLeads: data.totalLeads,
      sales: data.sales,
      saleRate: data.totalLeads > 0 ? (data.sales / data.totalLeads) * 100 : 0,
    })).sort((a, b) => {
      if (a.avgDaysToDemo === null && b.avgDaysToDemo === null) return 0;
      if (a.avgDaysToDemo === null) return 1;
      if (b.avgDaysToDemo === null) return -1;
      return a.avgDaysToDemo - b.avgDaysToDemo;
    });

    // Summary of channel velocity (real metrics only)
    const channelVelocityList = Object.entries(channelVelocity).map(([channel, data]) => ({
      channel,
      avgDaysToDemo: calcAvg(data.daysToDemo),
      demoCount: data.daysToDemo.length,
      totalLeads: data.totalLeads,
      sales: data.sales,
      saleRate: data.totalLeads > 0 ? (data.sales / data.totalLeads) * 100 : 0,
    })).sort((a, b) => {
      if (a.avgDaysToDemo === null && b.avgDaysToDemo === null) return 0;
      if (a.avgDaysToDemo === null) return 1;
      if (b.avgDaysToDemo === null) return -1;
      return a.avgDaysToDemo - b.avgDaysToDemo;
    });

    return {
      avg0to1,
      count0to1,
      avg1to2,
      count1to2,
      avg2to4,
      count2to4,
      avg4to5,
      count4to5,
      avgFullCycle,
      countFullCycle,
      stages,
      bottleneck,
      toneVelocityList,
      channelVelocityList,
    };
  }, [filteredLeads]);

  // Last Contact Freshness Distribution (<3 days, 3-7 days, >7 days)
  const contactFreshness = useMemo(() => {
    const now = Date.now();
    let fresh = 0;     // <= 3 days
    let regular = 0;   // 4 - 7 days
    let cold = 0;      // > 7 days or no contact

    filteredLeads.forEach((l) => {
      if (l.status === 0 || l.status === 5 || l.doNotContact) return; // Only active prospect funnel
      const dateToUse = l.lastContactDate || l.firstContactDate || l.createdAt;
      if (!dateToUse) {
        cold++;
        return;
      }
      const days = (now - new Date(dateToUse).getTime()) / (1000 * 3600 * 24);
      if (days <= 3) fresh++;
      else if (days <= 7) regular++;
      else cold++;
    });

    const activeTotal = fresh + regular + cold;
    return {
      fresh,
      regular,
      cold,
      activeTotal,
      freshPct: activeTotal > 0 ? (fresh / activeTotal) * 100 : 0,
      regularPct: activeTotal > 0 ? (regular / activeTotal) * 100 : 0,
      coldPct: activeTotal > 0 ? (cold / activeTotal) * 100 : 0,
    };
  }, [filteredLeads]);

  // Conversions by Tone
  const conversionsByTone = useMemo(() => {
    const toneMap: Record<
      string,
      { contacted: number; responded: number; demos: number; sales: number }
    > = {};

    leads.forEach((l) => {
      const leadTones = new Set<string>();
      if (l.contactTone) leadTones.add(l.contactTone.toLowerCase());
      l.interactions.forEach((i) => {
        i.toneAnalysis?.primaryTones.forEach((t) => leadTones.add(t.tone.toLowerCase()));
      });

      leadTones.forEach((t) => {
        if (!toneMap[t]) toneMap[t] = { contacted: 0, responded: 0, demos: 0, sales: 0 };
        toneMap[t].contacted += 1;
        if (l.status >= 1 || l.interactions.some((i) => i.responseReceived)) {
          toneMap[t].responded += 1;
        }
        if (l.status >= 2) toneMap[t].demos += 1;
        if (l.status === 5) toneMap[t].sales += 1;
      });
    });

    return Object.entries(toneMap)
      .map(([tone, val]) => ({
        tone,
        ...val,
        responseRate: val.contacted > 0 ? (val.responded / val.contacted) * 100 : 0,
        demoRate: val.contacted > 0 ? (val.demos / val.contacted) * 100 : 0,
        saleRate: val.contacted > 0 ? (val.sales / val.contacted) * 100 : 0,
      }))
      .sort((a, b) => b.demos - a.demos)
      .slice(0, 6);
  }, [leads]);

  // Conversions by Channel
  const conversionsByChannel = useMemo(() => {
    const channelMap: Record<
      string,
      { contacted: number; responded: number; demos: number; sales: number }
    > = {};

    leads.forEach((l) => {
      const ch = l.channel || 'Redbook (小红书)';
      if (!channelMap[ch]) channelMap[ch] = { contacted: 0, responded: 0, demos: 0, sales: 0 };
      channelMap[ch].contacted += 1;
      if (l.status >= 1 || l.interactions.some((i) => i.responseReceived)) {
        channelMap[ch].responded += 1;
      }
      if (l.status >= 2) channelMap[ch].demos += 1;
      if (l.status === 5) channelMap[ch].sales += 1;
    });

    return Object.entries(channelMap).map(([channel, val]) => ({
      channel,
      ...val,
      responseRate: val.contacted > 0 ? (val.responded / val.contacted) * 100 : 0,
      demoRate: val.contacted > 0 ? (val.demos / val.contacted) * 100 : 0,
    })).sort((a, b) => b.contacted - a.contacted);
  }, [leads]);

  // Conversions by Sector
  const conversionsBySector = useMemo(() => {
    const sectorMap: Record<
      string,
      { contacted: number; demos: number; sales: number; pipeline: number }
    > = {};

    leads.forEach((l) => {
      const sec = l.sector || 'Otro';
      if (!sectorMap[sec]) sectorMap[sec] = { contacted: 0, demos: 0, sales: 0, pipeline: 0 };
      sectorMap[sec].contacted += 1;
      if (l.status >= 2) sectorMap[sec].demos += 1;
      if (l.status === 5) sectorMap[sec].sales += 1;
      if (l.status === 5) sectorMap[sec].pipeline += (l.agreedAmount || l.estimatedBudget || 0);
    });

    return Object.entries(sectorMap)
      .map(([sector, val]) => ({
        sector,
        ...val,
        demoRate: val.contacted > 0 ? (val.demos / val.contacted) * 100 : 0,
      }))
      .sort((a, b) => b.contacted - a.contacted)
      .slice(0, 5);
  }, [leads]);

  // Rejection reasons frequency
  const rejectionReasonsStats = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      if (l.rejectionReasons) {
        l.rejectionReasons.forEach((r) => {
          counts[r] = (counts[r] || 0) + 1;
        });
      }
      if (l.status0Reason) {
        counts[l.status0Reason] = (counts[l.status0Reason] || 0) + 1;
      }
    });

    const totalLost = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: totalLost > 0 ? (count / totalLost) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [leads]);

  // Formatter for currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: settings.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-7xl mx-auto bg-[#F8FAFC]">
      {/* Top Banner / Filter Bar - Aesthetic Light */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Segmentación Activa
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({filteredLeads.length} de {leads.length} prospectos)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-indigo-500"
            >
              <option value="all">Todo el histórico</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Último trimestre</option>
            </select>

            {/* Sector filter */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-indigo-500 max-w-[160px] truncate"
            >
              <option value="all">Todos los sectores</option>
              {sectorsList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Channel filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-indigo-500"
            >
              <option value="all">Todos los canales</option>
              {channelsList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Tone filter */}
            <select
              value={toneFilter}
              onChange={(e) => setToneFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:border-indigo-500"
            >
              <option value="all">Todos los tonos</option>
              {tonesList.map((t) => (
                <option key={t} value={t}>Tono {t}</option>
              ))}
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
              <option value="2">Estado 2 (Interesado en demo)</option>
              <option value="3">Estado 3 (Demo rechazada)</option>
              <option value="4">Estado 4 (En negociación)</option>
              <option value="5">Estado 5 (Venta cerrada)</option>
            </select>

            {(dateFilter !== 'all' || sectorFilter !== 'all' || channelFilter !== 'all' || toneFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setDateFilter('all');
                  setSectorFilter('all');
                  setChannelFilter('all');
                  setToneFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold underline ml-1 cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actionable Intelligence Alert / Executive Summary - Aesthetic Light */}
      <div className="bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/50 border border-indigo-100 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-indigo-100/70 border border-indigo-200/60 text-indigo-700 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Conclusiones Accionables & Prospección con Clientes Chinos
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Basado en {stats.contactedLeads} prospectos contactados
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              • <strong className="text-indigo-900">Canales Redbook (小红书) y WeChat (微信):</strong> Suelen agilizar la primera respuesta y agendamiento al conectar directamente con el decisor en su canal habitual sin la fricción del correo formal.
              <br />
              • <strong className="text-indigo-900">Tono Consultivo con Auditoría Web:</strong> Genera la mayor tasa de interés en hostelería y retail, demostrando el problema de antemano.
              <br />
              • <strong className="text-amber-800">Cuello de botella en Negociación (E4):</strong> {velocityData.avg4to5 !== null ? `Se registran ${velocityData.avg4to5.toFixed(1)} días promedio antes del cierre (${velocityData.count4to5} cierres medidos).` : 'Sin datos suficientes de cierre aún.'}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* NUEVO MÓDULO: VELOCIDAD DE CONVERSIÓN & CUELLOS DE BOTELLA */}
      {/* ======================================================== */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Velocidad de Conversión & Diagnóstico de Cuellos de Botella
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Tiempo promedio real (en días) que tarda un lead en avanzar entre estados comerciales
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Ciclo total promedio:{' '}
                <strong className="font-mono">
                  {velocityData.avgFullCycle !== null ? `${velocityData.avgFullCycle.toFixed(1)} días` : '—'}
                </strong>
                {velocityData.countFullCycle > 0 && (
                  <span className="text-[10px] text-indigo-500 ml-1">({velocityData.countFullCycle} ventas)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Bottleneck Warning Callout */}
        {velocityData.bottleneck && velocityData.bottleneck.days !== null ? (
          <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed flex-1">
              <strong>⚠️ Cuello de botella detectado en: {velocityData.bottleneck.name}</strong>
              <p className="text-amber-800 mt-0.5">
                Los prospectos permanecen un promedio real de <strong>{velocityData.bottleneck.days.toFixed(1)} días</strong> en esta etapa antes de dar el siguiente paso (calculado sobre {velocityData.bottleneck.count} transiciones registradas). 
                {velocityData.bottleneck.id === '4->5' 
                  ? ' Causa común: Duda sobre retorno de inversión o falta de facilidades de pago. Solución: Propuesta por entregables y contrato simplificado bilingüe.'
                  : ' Causa común: Falta de seguimiento oportuno. Solución: Acortar cadencia de contacto a 48h con mensaje en Redbook o WeChat.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-3">
            <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 leading-relaxed flex-1">
              <strong>ℹ️ Métricas calculadas en tiempo real sin inventar datos</strong>
              <p className="text-slate-500 mt-0.5">
                Los tiempos entre etapas se calculan exclusivamente a partir de las transiciones de estado e interacciones de tus prospectos reales.
              </p>
            </div>
          </div>
        )}

        {/* Transition Stages Velocity Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Transition 1: 0 -> 1 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Paso 1: Primer Contacto
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-700">
                E0 → E1
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {velocityData.avg0to1 !== null ? velocityData.avg0to1.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {velocityData.avg0to1 !== null ? 'días promedio' : 'sin datos'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${velocityData.avg0to1 !== null ? Math.min(100, (velocityData.avg0to1 / 10) * 100) : 0}%` }} 
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {velocityData.count0to1 > 0 
                ? `Tiempo hasta la 1ª respuesta (${velocityData.count0to1} datos)`
                : 'Pendiente de registrar primeras respuestas'}
            </p>
          </div>

          {/* Transition 2: 1 -> 2 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Paso 2: Agendar Demo
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-100 text-sky-800">
                E1 → E2
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {velocityData.avg1to2 !== null ? velocityData.avg1to2.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {velocityData.avg1to2 !== null ? 'días promedio' : 'sin datos'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${velocityData.avg1to2 !== null ? Math.min(100, (velocityData.avg1to2 / 10) * 100) : 0}%` }} 
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {velocityData.count1to2 > 0 
                ? `Conversión a demo (${velocityData.count1to2} transiciones)` 
                : 'Pendiente de agendar demos'}
            </p>
          </div>

          {/* Transition 3: 2 -> 4 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                Paso 3: Pasar a Negociación
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                E2 → E4
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {velocityData.avg2to4 !== null ? velocityData.avg2to4.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {velocityData.avg2to4 !== null ? 'días promedio' : 'sin datos'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${velocityData.avg2to4 !== null ? Math.min(100, (velocityData.avg2to4 / 10) * 100) : 0}%` }} 
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {velocityData.count2to4 > 0 
                ? `Envío de presupuesto (${velocityData.count2to4} datos)` 
                : 'Pendiente de pasar a negociación'}
            </p>
          </div>

          {/* Transition 4: 4 -> 5 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <span>Paso 4: Cierre Venta</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                E4 → E5
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-slate-900">
                {velocityData.avg4to5 !== null ? velocityData.avg4to5.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {velocityData.avg4to5 !== null ? 'días promedio' : 'sin datos'}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${velocityData.avg4to5 !== null ? Math.min(100, (velocityData.avg4to5 / 15) * 100) : 0}%` }} 
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {velocityData.count4to5 > 0 
                ? `Ciclo de negociación y firma (${velocityData.count4to5} cierres)` 
                : 'Pendiente de registrar ventas cerradas'}
            </p>
          </div>
        </div>

        {/* Sub-table: Velocidad por Tono y por Canal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          {/* Velocidad por Tono */}
          <div className="border border-slate-200/80 rounded-lg p-4 bg-slate-50/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Velocidad hacia Demo según Tono de Mensaje
              </h4>
              <span className="text-[11px] text-slate-500">Métricas reales registradas</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {velocityData.toneVelocityList.slice(0, 5).map((item) => (
                <div key={item.tone} className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 capitalize">
                      Tono {item.tone}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({item.totalLeads} prospectos)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-indigo-700 font-bold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded text-[11px]">
                      {item.avgDaysToDemo !== null ? `${item.avgDaysToDemo.toFixed(1)} días a demo` : '— (sin demos)'}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-mono font-medium">
                      {item.sales} cierres ({item.saleRate.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Velocidad por Canal (Chinos / Redes Sociales) */}
          <div className="border border-slate-200/80 rounded-lg p-4 bg-slate-50/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Velocidad por Canal (Redbook, WeChat, WhatsApp...)
              </h4>
              <span className="text-[11px] text-slate-500">Días reales a demo</span>
            </div>

            <div className="space-y-2.5 text-xs">
              {velocityData.channelVelocityList.slice(0, 5).map((item) => (
                <div key={item.channel} className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {item.channel}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({item.totalLeads})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-teal-700 font-bold bg-teal-50 border border-teal-100 px-2 py-0.5 rounded text-[11px]">
                      {item.avgDaysToDemo !== null ? `${item.avgDaysToDemo.toFixed(1)} días a demo` : '— (sin demos)'}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-mono font-medium">
                      {item.sales} ventas
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Freshness Bar / Último Contacto */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-700">
              Distribución de Frescura del Último Contacto ({contactFreshness.activeTotal} en prospección activa)
            </span>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-emerald-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                ≤3 días: {contactFreshness.fresh} leads ({contactFreshness.freshPct.toFixed(0)}%)
              </span>
              <span className="text-amber-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                4-7 días: {contactFreshness.regular} leads ({contactFreshness.regularPct.toFixed(0)}%)
              </span>
              <span className="text-rose-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                &gt;7 días sin contacto: {contactFreshness.cold} leads ({contactFreshness.coldPct.toFixed(0)}%)
              </span>
            </div>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${contactFreshness.freshPct}%` }} 
              className="bg-emerald-500 h-full transition-all" 
              title={`Fresco: ${contactFreshness.fresh} prospectos`}
            />
            <div 
              style={{ width: `${contactFreshness.regularPct}%` }} 
              className="bg-amber-400 h-full transition-all" 
              title={`Regular: ${contactFreshness.regular} prospectos`}
            />
            <div 
              style={{ width: `${contactFreshness.coldPct}%` }} 
              className="bg-rose-500 h-full transition-all" 
              title={`Frío: ${contactFreshness.cold} prospectos`}
            />
          </div>
        </div>
      </div>

      {/* 11 Primary Core Metrics Cards - Aesthetic Light */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Métricas Clave de Rendimiento Comercial
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Numerador / Denominador en cada tarjeta
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
          {/* Card 1: Total Leads */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Total Leads</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.totalLeads}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Base de prospectos total
            </div>
          </div>

          {/* Card 2: Nuevos Leads */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Nuevos Leads</span>
              <Calendar className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold text-sky-700 font-mono tabular-nums">
              {stats.newLeads}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Últimos 14 días
            </div>
          </div>

          {/* Card 3: Contactados */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Contactados</span>
              <Send className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.contactedLeads}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats.totalLeads > 0 ? ((stats.contactedLeads / stats.totalLeads) * 100).toFixed(0) : 0}% de la base
            </div>
          </div>

          {/* Card 4: Tasa de Respuesta */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Tasa de Respuesta</span>
              <MessageSquare className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {stats.responseRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              {stats.respondedLeads}/{stats.contactedLeads} leads
            </div>
          </div>

          {/* Card 5: Tasa de Interés */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Tasa de Interés</span>
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-teal-700 font-mono tabular-nums">
              {stats.interestRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              {stats.interestedLeads}/{stats.contactedLeads} leads
            </div>
          </div>

          {/* Card 6: Demos Solicitadas */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Demos Solicitadas</span>
              <Compass className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
              {stats.demosRequested}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              {stats.demoRate.toFixed(1)}% de contactados
            </div>
          </div>

          {/* Card 7: Demos Realizadas */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Demos Realizadas</span>
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.demosCompleted}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              {stats.demosRequested > 0 ? ((stats.demosCompleted / stats.demosRequested) * 100).toFixed(0) : 0}% de solicitadas
            </div>
          </div>

          {/* Card 8: Negociaciones Abiertas */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Negociaciones</span>
              <Briefcase className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700 font-mono tabular-nums">
              {stats.openNegotiations}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono truncate">
              {formatCurrency(stats.totalPotentialPipeline)} pipeline
            </div>
          </div>

          {/* Card 9: Ventas Cerradas */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Ventas Cerradas</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {stats.closedSales}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Conv. demo: {stats.demoToSaleRate.toFixed(1)}%
            </div>
          </div>

          {/* Card 10: Tasa Conv. a Venta */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Conv. Total a Venta</span>
              <BarChart3 className="w-4 h-4 text-violet-600" />
            </div>
            <div className="text-2xl font-bold text-violet-700 font-mono tabular-nums">
              {stats.closedSaleRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              {stats.closedSales}/{stats.contactedLeads} contactados
            </div>
          </div>

          {/* Card 11: Valor Vendido vs Cobrado */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] col-span-2 md:col-span-3 lg:col-span-2 hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold text-slate-600">Facturación Acordada / Cobrada</span>
              <Euro className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                {formatCurrency(stats.totalAgreedSold)}
              </div>
              <span className="text-xs text-emerald-700 font-mono font-semibold">
                ({formatCurrency(stats.totalCollectedAmount)} cobrado)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {stats.totalAgreedSold > 0
                ? `${((stats.totalCollectedAmount / stats.totalAgreedSold) * 100).toFixed(0)}% cobrado efectivamente en cuenta`
                : 'Sin ingresos registrados'}
            </div>
          </div>
        </div>
      </div>

      {/* Commercial Funnel / Embudo Comercial Visual - Aesthetic Light */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Embudo Comercial de Prospección
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Transición de prospectos desde el primer contacto hasta el cierre de la venta
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Eficiencia demo-a-venta: <strong className="text-emerald-700">{stats.demoToSaleRate.toFixed(1)}%</strong>
          </span>
        </div>

        {/* Funnel Visual Steps */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2.5">
          {/* Step 1 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-slate-600 block mb-1">
              1. Contactados
            </span>
            <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.contactedLeads}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">100% base</div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-slate-600 block mb-1">
              2. Respondieron
            </span>
            <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums">
              {stats.respondedLeads}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              {stats.responseRate.toFixed(1)}% conv.
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-slate-600 block mb-1">
              3. Demo Solicitada
            </span>
            <div className="text-xl font-bold text-amber-700 font-mono tabular-nums">
              {stats.demosRequested}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              {stats.demoRate.toFixed(1)}% de base
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-slate-600 block mb-1">
              4. Demo Realizada
            </span>
            <div className="text-xl font-bold text-indigo-700 font-mono tabular-nums">
              {stats.demosCompleted}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              {stats.demosRequested > 0 ? ((stats.demosCompleted / stats.demosRequested) * 100).toFixed(0) : 0}% efectividad
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-slate-600 block mb-1">
              5. Negociación
            </span>
            <div className="text-xl font-bold text-blue-700 font-mono tabular-nums">
              {stats.openNegotiations}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">Activas</div>
          </div>

          {/* Step 6 */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-emerald-800 block mb-1">
              6. Ventas Cerradas
            </span>
            <div className="text-xl font-bold text-emerald-700 font-mono tabular-nums">
              {stats.closedSales}
            </div>
            <div className="text-[11px] text-emerald-700 font-mono font-medium">
              {formatCurrency(stats.totalAgreedSold)}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Conversions by Tone & Conversions by Channel - Aesthetic Light */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module A: Conversión por Tono de Mensaje */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Rendimiento Comercial por Tono de Mensaje
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ¿Qué tono genera más demos y ventas en desarrollo web?
              </p>
            </div>
            <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
              Top Tonos
            </span>
          </div>

          <div className="space-y-3">
            {conversionsByTone.map((item) => (
              <div key={item.tone} className="p-3 rounded-lg bg-slate-50/60 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 capitalize">
                      Tono {item.tone}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ({item.contacted} envíos)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-emerald-700">
                      Resp: {item.responseRate.toFixed(0)}%
                    </span>
                    <span className="text-amber-700 font-semibold">
                      Demos: {item.demos} ({item.demoRate.toFixed(0)}%)
                    </span>
                    <span className="text-indigo-700">
                      Ventas: {item.sales}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, item.demoRate)}%` }}
                    className="bg-amber-500 h-full rounded-full transition-all"
                    title={`Tasa de demo: ${item.demoRate.toFixed(1)}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module B: Conversión por Canal (Con soporte para Redbook, WeChat, WhatsApp) */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Eficacia por Canal de Prospección
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparativa en clientes: Redbook, WeChat, WhatsApp y referidos
              </p>
            </div>
            <span className="text-xs text-slate-500">Tasa de respuesta</span>
          </div>

          <div className="space-y-3">
            {conversionsByChannel.map((ch) => (
              <div key={ch.channel} className="p-3 rounded-lg bg-slate-50/60 border border-slate-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-800">
                    {ch.channel}
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-500">{ch.contacted} prospectos</span>
                    <span className="text-emerald-700 font-semibold">
                      {ch.responseRate.toFixed(1)}% respuesta
                    </span>
                    <span className="text-amber-700">
                      {ch.demos} demos
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, ch.responseRate)}%` }}
                    className="bg-indigo-600 h-full rounded-full transition-all"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Conversión por Sector & Análisis de Rechazos - Aesthetic Light */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module C: Conversión por Sector */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Rendimiento por Sector de Cliente
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Volumen de contactos, tasa de demo y facturación cerrada
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {conversionsBySector.map((sec) => (
              <div key={sec.sector} className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    {sec.sector}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {sec.contacted} contactados · {sec.demos} demos ({sec.demoRate.toFixed(0)}%)
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    {formatCurrency(sec.pipeline)}
                  </span>
                  <span className="text-[11px] text-slate-500 block font-mono">
                    {sec.sales} ventas cerradas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module D: Motivos de Rechazo */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Principales Motivos de Pérdida y Rechazo
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Objeciones más repetidas en Estado 0 y Estado 3
              </p>
            </div>
            <span className="text-xs text-rose-700 font-semibold bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
              Objeciones
            </span>
          </div>

          <div className="space-y-2.5">
            {rejectionReasonsStats.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No hay rechazos registrados en el filtro seleccionado.</p>
            ) : (
              rejectionReasonsStats.map((item) => (
                <div key={item.reason} className="p-2.5 rounded-lg bg-slate-50/70 border border-slate-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-700 font-medium truncate max-w-[240px]">
                      {item.reason}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-rose-700 font-semibold">
                      {item.count} leads ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${item.percentage}%` }}
                      className="bg-rose-500 h-full rounded-full transition-all"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
