import React, { useState, useEffect } from 'react';
import { 
  Lead, 
  CommercialStatus, 
  AppSettings 
} from './types';
import { 
  loadLeads, 
  saveLeads, 
  fetchServerLeads,
  loadSettings, 
  saveSettings, 
  exportLeadsToCSV
} from './services/storage';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { LeadsView } from './components/LeadsView';
import { PipelineView } from './components/PipelineView';
import { ToneLabView } from './components/ToneLabView';
import { ObjectionsView } from './components/ObjectionsView';
import { TasksView } from './components/TasksView';
import { SettingsView } from './components/SettingsView';
import { LeadDetailModal } from './components/LeadDetailModal';
import { NewLeadModal } from './components/NewLeadModal';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [leads, setLeads] = useState<Lead[]>(() => loadLeads());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Initial load: retrieve fresh persistent leads from server backend
  useEffect(() => {
    fetchServerLeads().then((serverLeads) => {
      if (serverLeads && serverLeads.length > 0) {
        setLeads(serverLeads);
      } else {
        // If server database is empty, seed it with current leads
        const current = loadLeads();
        saveLeads(current);
      }
    });
  }, []);

  // Lead CRUD handlers
  const handleSaveLead = (updatedLead: Lead) => {
    const index = leads.findIndex((l) => l.id === updatedLead.id);
    let updatedList: Lead[];
    if (index >= 0) {
      updatedList = [...leads];
      updatedList[index] = updatedLead;
    } else {
      updatedList = [updatedLead, ...leads];
    }
    setLeads(updatedList);
    saveLeads(updatedList);
    if (selectedLead?.id === updatedLead.id) {
      setSelectedLead(updatedLead);
    }
  };

  const handleDeleteLead = (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este prospecto?')) return;
    const updated = leads.filter((l) => l.id !== id);
    setLeads(updated);
    saveLeads(updated);
    if (selectedLead?.id === id) {
      setSelectedLead(null);
    }
  };

  const handleImportLeads = (newLeadsPartial: Partial<Lead>[]) => {
    const fullLeads: Lead[] = newLeadsPartial.map((p, idx) => ({
      id: `lead-imp-${Date.now()}-${idx}`,
      commercialName: p.commercialName || 'Empresa Importada',
      companyName: p.companyName || 'Empresa Importada S.L.',
      contactPerson: p.contactPerson || '',
      currentWebsite: p.currentWebsite || '',
      socialUrl: p.socialUrl || '',
      sector: p.sector || 'Otro',
      location: p.location || '',
      email: p.email || '',
      phone: p.phone || '',
      channel: p.channel || 'Redbook (小红书)',
      createdAt: p.createdAt || new Date().toISOString().split('T')[0],
      firstContactDate: p.firstContactDate || new Date().toISOString().split('T')[0],
      leadSource: p.leadSource || 'Importación CSV',
      offeredService: p.offeredService || 'Rediseño web corporativo',
      estimatedBudget: p.estimatedBudget !== undefined ? p.estimatedBudget : null,
      potentialValue: p.estimatedBudget ? Math.round(p.estimatedBudget * 1.25) : null,
      priority: p.priority || 'Media',
      assignedTo: p.assignedTo || settings.defaultResponsible || 'Alex M.',
      notes: p.notes || 'Importado vía CSV',
      lastContactDate: p.lastContactDate || new Date().toISOString().split('T')[0],
      contactTone: p.contactTone || 'Consultivo',
      isPendingContact: p.isPendingContact || false,
      nextFollowUpDate: p.nextFollowUpDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      status: p.status || 0,
      doNotContact: false,
      isArchived: false,
      transitions: [
        {
          id: `tr-${Date.now()}-${idx}`,
          fromStatus: p.status || 0,
          toStatus: p.status || 0,
          date: new Date().toISOString().split('T')[0],
          notes: 'Importación masiva',
        },
      ],
      interactions: [],
    }));

    const combined = [...fullLeads, ...leads];
    setLeads(combined);
    saveLeads(combined);
  };

  // State update in Pipeline Kanban & LeadsView
  const handleUpdateLeadStatus = (
    leadId: string,
    newStatus: CommercialStatus,
    additionalData: Partial<Lead> = {},
    transitionNote: string = ''
  ) => {
    const target = leads.find((l) => l.id === leadId);
    if (!target) return;

    const oldStatus = target.status;
    const today = new Date().toISOString().split('T')[0];

    // Compute real duration in days spent in previous stage
    const prevDate = target.transitions?.[0]?.date || target.lastContactDate || target.firstContactDate || target.createdAt || today;
    const diffMs = new Date(today).getTime() - new Date(prevDate).getTime();
    const durationDays = Math.max(0, Math.round(diffMs / (1000 * 3600 * 24)));

    const newTransition = {
      id: `tr-${Date.now()}`,
      fromStatus: oldStatus,
      toStatus: newStatus,
      date: today,
      durationDays,
      notes: transitionNote || `Cambio de Estado ${oldStatus} a Estado ${newStatus}`,
    };

    const updated: Lead = {
      ...target,
      ...additionalData,
      status: newStatus,
      transitions: [newTransition, ...(target.transitions || [])],
    };

    handleSaveLead(updated);
  };

  // Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleClearRealData = () => {
    if (confirm('¿Deseas vaciar la base de prospectos?')) {
      setLeads([]);
      saveLeads([]);
    }
  };

  const handleRestoreBackup = (restoredLeads: Lead[]) => {
    setLeads(restoredLeads);
    saveLeads(restoredLeads);
  };

  // Count of leads requested Do Not Contact
  const doNotContactCount = leads.filter((l) => l.doNotContact).length;

  // Count of urgent tasks (Seguimiento vencido o para hoy)
  const todayStr = new Date().toISOString().split('T')[0];
  const urgentTasksCount = leads.filter(
    (l) => !l.isArchived && !l.doNotContact && l.status !== 0 && l.status !== 5 && l.nextFollowUpDate && l.nextFollowUpDate <= todayStr
  ).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] text-slate-800 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        totalLeadsCount={leads.length}
        doNotContactCount={doNotContactCount}
        urgentTasksCount={urgentTasksCount}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          currentView={currentView}
          onNewLeadClick={() => setIsNewLeadModalOpen(true)}
          searchQuery={globalSearch}
          onSearchChange={(q) => {
            setGlobalSearch(q);
            if (currentView !== 'leads' && q.trim().length > 0) {
              setCurrentView('leads');
            }
          }}
          onExportCSV={() => exportLeadsToCSV(leads)}
        />

        {/* Dynamic View Container */}
        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <Dashboard
              leads={leads}
              onSelectLead={(l) => setSelectedLead(l)}
              settings={settings}
            />
          )}

          {currentView === 'leads' && (
            <LeadsView
              leads={leads}
              onSelectLead={(l) => setSelectedLead(l)}
              onNewLeadClick={() => setIsNewLeadModalOpen(true)}
              onImportLeads={handleImportLeads}
              onExportCSV={() => exportLeadsToCSV(leads)}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              settings={settings}
            />
          )}

          {currentView === 'pipeline' && (
            <PipelineView
              leads={leads}
              onSelectLead={(l) => setSelectedLead(l)}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              settings={settings}
            />
          )}

          {currentView === 'tone-lab' && (
            <ToneLabView
              leads={leads}
              onAssignToNewLead={() => {
                setIsNewLeadModalOpen(true);
              }}
            />
          )}

          {currentView === 'objections' && (
            <ObjectionsView
              leads={leads}
              settings={settings}
            />
          )}

          {currentView === 'tasks' && (
            <TasksView
              leads={leads}
              onSelectLead={(l) => setSelectedLead(l)}
              onUpdateLead={handleSaveLead}
              settings={settings}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              leads={leads}
              onClearRealData={handleClearRealData}
              onRestoreBackup={handleRestoreBackup}
            />
          )}
        </main>
      </div>

      {/* Client Detail Sheet Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          allLeads={leads}
          onClose={() => setSelectedLead(null)}
          onSaveLead={handleSaveLead}
          onDeleteLead={handleDeleteLead}
          settings={settings}
        />
      )}

      {/* New Lead Modal */}
      {isNewLeadModalOpen && (
        <NewLeadModal
          allLeads={leads}
          onClose={() => setIsNewLeadModalOpen(false)}
          onSave={(newLead) => {
            handleSaveLead(newLead);
            setIsNewLeadModalOpen(false);
            setSelectedLead(newLead);
          }}
          settings={settings}
        />
      )}
    </div>
  );
}
