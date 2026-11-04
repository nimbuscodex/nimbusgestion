import React from 'react';
import { Plus, Search, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNewLeadClick: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExportCSV: () => void;
}

const VIEW_TITLES: Record<string, { title: string; category: string }> = {
  dashboard: { title: 'Dashboard & Velocidad', category: 'Analítica Comercial' },
  leads: { title: 'Directorio de Leads', category: 'Gestión de Contactos' },
  pipeline: { title: 'Pipeline Kanban (Estados 0 - 5)', category: 'Embudo de Ventas' },
  'tone-lab': { title: 'Laboratorio de Tonos & IA', category: 'Inteligencia de Mensajes' },
  objections: { title: 'Análisis de Rechazos & Objeciones', category: 'Motivos de Pérdida' },
  tasks: { title: 'Seguimientos & Cadencias', category: 'Tareas Pendientes' },
  settings: { title: 'Configuración, Divisas & RGPD', category: 'Ajustes del Sistema' },
};

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNewLeadClick,
  searchQuery,
  onSearchChange,
  onExportCSV,
}) => {
  const currentInfo = VIEW_TITLES[currentView] || { title: 'Plataforma', category: 'Comercial' };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-slate-200/80 flex items-center justify-between gap-8 px-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Zone 1: Contextual Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
          {currentInfo.category}
        </span>
        <span className="text-slate-300" aria-hidden="true">/</span>
        <h2 className="text-sm font-bold text-slate-900 whitespace-nowrap truncate">
          {currentInfo.title}
        </h2>
      </div>

      {/* Zone 2: Global Search Input */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por empresa (ej: 喜茶, Momo), contacto, email, web, origen o ciudad..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onExportCSV}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
          title="Exportar todos los prospectos a CSV"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>Exportar CSV</span>
        </button>

        <button
          onClick={onNewLeadClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg transition-colors shadow-sm shadow-indigo-600/25 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Lead</span>
        </button>
      </div>
    </header>
  );
};
