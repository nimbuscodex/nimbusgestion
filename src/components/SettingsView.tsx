import React, { useState } from 'react';
import { AppSettings, Lead } from '../types';
import { 
  Settings, 
  Download, 
  Upload, 
  Trash2, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  leads: Lead[];
  onClearRealData: () => void;
  onRestoreBackup: (leads: Lead[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  leads,
  onClearRealData,
  onRestoreBackup,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  // Full JSON Backup Export
  const handleExportFullBackup = () => {
    const backup = {
      app: 'Nimbuscodex Gestión',
      exportDate: new Date().toISOString(),
      settings: formData,
      totalLeads: leads.length,
      leads,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nimbuscodex-crm-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Full JSON Restore
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.leads && Array.isArray(parsed.leads)) {
          onRestoreBackup(parsed.leads);
          alert(`Copia restaurada con éxito: ${parsed.leads.length} prospectos recuperados y sincronizados.`);
        } else {
          alert('El archivo no tiene el formato de copia de seguridad esperado.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto bg-[#F8FAFC]">
      {/* Intro */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          <span>Configuración del Sistema, Divisas y Persistencia CRM</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Ajustes comerciales, sincronización permanente y copias de seguridad de la agencia
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-xl p-6 space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-700 block mb-1 font-semibold">Nombre de la Agencia / Estudio</label>
            <input
              type="text"
              value={formData.agencyName}
              onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">Responsable Comercial por Defecto</label>
            <input
              type="text"
              value={formData.defaultResponsible}
              onChange={(e) => setFormData({ ...formData, defaultResponsible: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">Moneda Principal</label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-indigo-500"
            >
              <option value="EUR">Euro (€ EUR)</option>
              <option value="USD">Dólar ($ USD)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-700 block mb-1 font-semibold">Formato de Fechas</label>
            <select
              value={formData.dateFormat}
              onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:border-indigo-500"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (Europa)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <Check className="w-4 h-4" />
                <span>Ajustes guardados correctamente</span>
              </span>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Guardar Configuración
          </button>
        </div>
      </form>

      {/* Backup and Restore Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Download className="w-4 h-4 text-indigo-600" />
            <span>Copia de Seguridad Completa</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Descarga un archivo JSON con todos los prospectos ({leads.length} leads), interacciones, transiciones de estado e información de contacto.
          </p>
          <button
            onClick={handleExportFullBackup}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Backup JSON ({leads.length} leads)</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Restaurar Copia de Seguridad</span>
          </div>
          <p className="text-slate-500 leading-relaxed">
            Importa un archivo JSON de respaldo previo para restaurar los prospectos y persistirlos en el servidor.
          </p>
          <label className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Seleccionar Archivo JSON</span>
            <input type="file" accept=".json" onChange={handleFileRestore} className="hidden" />
          </label>
        </div>
      </div>

      {/* Danger Zone: Clear CRM Leads */}
      <div className="bg-white border border-rose-200/80 rounded-xl p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-xs">
        <h3 className="font-bold text-rose-900 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-rose-600" />
          <span>Vaciar Directorio de Prospectos</span>
        </h3>
        <p className="text-slate-500 leading-relaxed">
          Elimina todos los prospectos actuales de la base de datos persistente. Esta acción no se puede deshacer a menos que tengas un archivo JSON de respaldo.
        </p>
        <button
          onClick={onClearRealData}
          className="px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
        >
          Vaciar Todos los Prospectos
        </button>
      </div>
    </div>
  );
};
