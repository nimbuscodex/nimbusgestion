import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  GitBranch, 
  Sparkles, 
  ShieldAlert, 
  CheckSquare, 
  Settings, 
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  totalLeadsCount: number;
  doNotContactCount: number;
  urgentTasksCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  totalLeadsCount,
  doNotContactCount,
  urgentTasksCount = 0,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Velocidad', icon: LayoutDashboard },
    { id: 'leads', label: 'Directorio de Leads', icon: Users, badge: totalLeadsCount },
    { id: 'pipeline', label: 'Pipeline Comercial', icon: GitBranch },
    { id: 'tone-lab', label: 'Mensajes & Tonos IA', icon: Sparkles },
    { id: 'objections', label: 'Rechazos & Objeciones', icon: ShieldAlert },
    { 
      id: 'tasks', 
      label: 'Tareas & Seguimientos', 
      icon: CheckSquare, 
      badge: urgentTasksCount > 0 ? urgentTasksCount : undefined,
      isUrgentBadge: urgentTasksCount > 0 
    },
    { id: 'settings', label: 'Configuración & RGPD', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200/80 flex flex-col h-screen sticky top-0 select-none shadow-[1px_0_3px_rgba(0,0,0,0.02)]">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-sm shadow-indigo-600/30">
            N
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-900 leading-tight">
              Nimbuscodex
            </h1>
            <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
              Gestión Comercial & Clientes
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Plataforma Comercial
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded border ${
                    item.isUrgentBadge
                      ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                      : 'text-slate-500 bg-slate-100 border-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* RGPD & Status Footer Block */}
      <div className="p-3 border-t border-slate-100 space-y-2.5 bg-slate-50/60">
        {/* RGPD Safety Marker */}
        {doNotContactCount > 0 && (
          <div className="flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
              <span>Lista Robinson / Baja</span>
            </div>
            <span className="font-mono tabular-nums font-bold">{doNotContactCount}</span>
          </div>
        )}

        <div className="text-[10px] text-slate-400 px-1 flex items-center justify-between">
          <span>Prospección Web</span>
          <span className="font-mono font-medium text-slate-500">Persistencia Activa</span>
        </div>
      </div>
    </aside>
  );
};
