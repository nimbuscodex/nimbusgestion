import React, { useState } from 'react';
import { 
  Lead, 
  MessageInteraction, 
  ToneAnalysisResult, 
  CommercialStatus, 
  OutreachChannel, 
  BusinessSector, 
  ServiceOffered, 
  LeadPriority,
  LeadOrigin,
  RejectionReason,
  Status0SecondaryReason,
  AppSettings
} from '../types';
import { 
  X, 
  Globe, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  History, 
  CheckCircle, 
  ShieldCheck, 
  Tag, 
  Layers, 
  FileEdit,
  Trash2,
  MapPin,
  Radio,
  ExternalLink,
  MessageSquare,
  Check
} from 'lucide-react';
import { analyzeMessageToneAPI, getObjectionAdviceAPI } from '../services/api';
import { checkDuplicateLead } from '../services/storage';

interface LeadDetailModalProps {
  lead: Lead;
  allLeads: Lead[];
  onClose: () => void;
  onSaveLead: (updated: Lead) => void;
  onDeleteLead: (id: string) => void;
  settings: AppSettings;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  allLeads,
  onClose,
  onSaveLead,
  onDeleteLead,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'messages' | 'transitions' | 'objections'>('info');

  // Form State
  const [formData, setFormData] = useState<Lead>({ ...lead });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Keyword input state
  const [keywordInput, setKeywordInput] = useState<string>('');

  // New Message State
  const [isAddingMessage, setIsAddingMessage] = useState<boolean>(false);
  const [newMessageBody, setNewMessageBody] = useState<string>('');
  const [newMessageChannel, setNewMessageChannel] = useState<OutreachChannel>(lead.channel);
  const [newMessageType, setNewMessageType] = useState<'inicial' | 'seguimiento' | 'negociacion'>('seguimiento');
  const [newMessageResponseReceived, setNewMessageResponseReceived] = useState<boolean>(false);
  const [newMessageResponseText, setNewMessageResponseText] = useState<string>('');
  const [newMessageResult, setNewMessageResult] = useState<any>('Sin respuesta');
  const [isAnalyzingTone, setIsAnalyzingTone] = useState<boolean>(false);
  const [tempToneAnalysis, setTempToneAnalysis] = useState<ToneAnalysisResult | null>(null);

  // AI Objection Advice State
  const [aiAdvice, setAiAdvice] = useState<any>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState<boolean>(false);

  // Check duplicates on change
  const handleFieldChange = (field: keyof Lead, value: any) => {
    const next = { ...formData, [field]: value };
    setFormData(next);

    if (field === 'email' || field === 'currentWebsite' || field === 'phone') {
      const dupCheck = checkDuplicateLead(allLeads, {
        email: next.email,
        currentWebsite: next.currentWebsite,
        phone: next.phone,
        idToIgnore: lead.id,
      });

      if (dupCheck.isDuplicate) {
        setDuplicateWarning(
          `Atención: Ya existe otro prospecto con el mismo ${dupCheck.duplicateField} (${dupCheck.matchedLead?.commercialName})`
        );
      } else {
        setDuplicateWarning(null);
      }
    }
  };

  const handleSaveGeneral = () => {
    onSaveLead(formData);
    setIsEditing(false);
  };

  // Add rejection keyword
  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    const formatted = keywordInput.trim().startsWith('#') 
      ? keywordInput.trim().toUpperCase() 
      : `#${keywordInput.trim().toUpperCase()}`;
    const current = formData.rejectionKeywords || [];
    if (!current.includes(formatted)) {
      const updated = { ...formData, rejectionKeywords: [...current, formatted] };
      setFormData(updated);
      onSaveLead(updated);
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    const current = formData.rejectionKeywords || [];
    const updated = {
      ...formData,
      rejectionKeywords: current.filter(k => k !== kwToRemove),
    };
    setFormData(updated);
    onSaveLead(updated);
  };

  // Analyze new message tone
  const handleAnalyzeTone = async () => {
    if (!newMessageBody.trim()) return;
    setIsAnalyzingTone(true);
    try {
      const res = await analyzeMessageToneAPI({
        text: newMessageBody,
        stage: newMessageType,
        channel: newMessageChannel,
        sector: formData.sector,
      });
      setTempToneAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingTone(false);
    }
  };

  // Save interaction
  const handleAddInteraction = () => {
    if (!newMessageBody.trim()) return;

    const todayDate = new Date().toISOString().split('T')[0];
    const newInteraction: MessageInteraction = {
      id: `msg-${Date.now()}`,
      date: todayDate,
      channel: newMessageChannel,
      messageType: newMessageType,
      body: newMessageBody,
      toneAnalysis: tempToneAnalysis || undefined,
      responseReceived: newMessageResponseReceived,
      responseDate: newMessageResponseReceived ? todayDate : undefined,
      responseText: newMessageResponseText || undefined,
      interactionResult: newMessageResult,
    };

    const nextInteractions = [newInteraction, ...(formData.interactions || [])];
    const nextTone = tempToneAnalysis?.primaryTones[0]?.tone || formData.contactTone || 'Consultivo';

    const updatedLead: Lead = {
      ...formData,
      interactions: nextInteractions,
      lastContactDate: todayDate,
      contactTone: nextTone,
      isPendingContact: false, // Ha sido contactado
      followUpsCount: newMessageType === 'seguimiento' 
        ? (formData.followUpsCount || 0) + 1 
        : formData.followUpsCount,
      lastResponseDate: newMessageResponseReceived ? todayDate : formData.lastResponseDate,
    };

    setFormData(updatedLead);
    onSaveLead(updatedLead);

    // Reset interaction input form
    setNewMessageBody('');
    setTempToneAnalysis(null);
    setNewMessageResponseReceived(false);
    setNewMessageResponseText('');
    setIsAddingMessage(false);
  };

  // --- Status Editing State & Handlers ---
  const [isChangeStatusModalOpen, setIsChangeStatusModalOpen] = useState<boolean>(false);
  const [targetStatus, setTargetStatus] = useState<CommercialStatus>(formData.status);
  const [statusTransitionNote, setStatusTransitionNote] = useState<string>('');
  const [status0Reason, setStatus0Reason] = useState<Status0SecondaryReason>(formData.status0Reason || 'No responde tras varios intentos');
  const [statusRejectionReasons, setStatusRejectionReasons] = useState<RejectionReason[]>(formData.rejectionReasons || []);
  const [statusAgreedAmount, setStatusAgreedAmount] = useState<number | ''>(formData.agreedAmount || formData.estimatedBudget || '');
  const [statusContractedService, setStatusContractedService] = useState<string>(formData.contractedService || formData.offeredService || '');
  const [statusCollectedAmount, setStatusCollectedAmount] = useState<number | ''>(formData.collectedAmount || '');

  const handleOpenChangeStatus = (newSt?: CommercialStatus) => {
    setTargetStatus(newSt !== undefined ? newSt : formData.status);
    setStatusTransitionNote('');
    setStatus0Reason(formData.status0Reason || 'No responde tras varios intentos');
    setStatusRejectionReasons(formData.rejectionReasons || []);
    setStatusAgreedAmount(formData.agreedAmount || formData.estimatedBudget || '');
    setStatusContractedService(formData.contractedService || formData.offeredService || '');
    setStatusCollectedAmount(formData.collectedAmount || '');
    setIsChangeStatusModalOpen(true);
  };

  const handleConfirmStatusChange = () => {
    const fromSt = formData.status;
    const toSt = targetStatus;
    const todayStr = new Date().toISOString().split('T')[0];

    const prevDate = formData.transitions?.[0]?.date || formData.lastContactDate || formData.createdAt;
    const diffDays = Math.max(0, Math.round((new Date().getTime() - new Date(prevDate).getTime()) / (1000 * 3600 * 24)));

    const newTransition = {
      id: `tr-${Date.now()}`,
      fromStatus: fromSt,
      toStatus: toSt,
      date: todayStr,
      durationDays: diffDays,
      notes: statusTransitionNote.trim() || `Transición manual de Estado ${fromSt} a Estado ${toSt}`,
    };

    const updatedLead: Lead = {
      ...formData,
      status: toSt,
      status0Reason: toSt === 0 ? status0Reason : formData.status0Reason,
      rejectionReasons: toSt === 3 ? statusRejectionReasons : formData.rejectionReasons,
      agreedAmount: toSt === 5 && typeof statusAgreedAmount === 'number' ? statusAgreedAmount : formData.agreedAmount,
      contractedService: toSt === 5 && statusContractedService ? statusContractedService : formData.contractedService,
      collectedAmount: toSt === 5 && typeof statusCollectedAmount === 'number' ? statusCollectedAmount : formData.collectedAmount,
      closedDate: toSt === 5 ? todayStr : formData.closedDate,
      transitions: [newTransition, ...(formData.transitions || [])],
    };

    setFormData(updatedLead);
    onSaveLead(updatedLead);
    setIsChangeStatusModalOpen(false);
  };

  // --- Edit Existing Message State & Handlers ---
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMsgDate, setEditMsgDate] = useState<string>('');
  const [editMsgChannel, setEditMsgChannel] = useState<OutreachChannel>(formData.channel);
  const [editMsgType, setEditMsgType] = useState<'inicial' | 'seguimiento' | 'negociacion'>('seguimiento');
  const [editMsgBody, setEditMsgBody] = useState<string>('');
  const [editMsgResponseReceived, setEditMsgResponseReceived] = useState<boolean>(false);
  const [editMsgResponseDate, setEditMsgResponseDate] = useState<string>('');
  const [editMsgResponseText, setEditMsgResponseText] = useState<string>('');
  const [editMsgResult, setEditMsgResult] = useState<MessageInteraction['interactionResult']>('Sin respuesta');
  const [editMsgToneAnalysis, setEditMsgToneAnalysis] = useState<ToneAnalysisResult | null>(null);
  const [isReanalyzingTone, setIsReanalyzingTone] = useState<boolean>(false);

  const handleStartEditMessage = (msg: MessageInteraction) => {
    setEditingMessageId(msg.id);
    setEditMsgDate(msg.date);
    setEditMsgChannel(msg.channel);
    setEditMsgType(msg.messageType);
    setEditMsgBody(msg.body);
    setEditMsgResponseReceived(msg.responseReceived);
    setEditMsgResponseDate(msg.responseDate || msg.date);
    setEditMsgResponseText(msg.responseText || '');
    setEditMsgResult(msg.interactionResult);
    setEditMsgToneAnalysis(msg.toneAnalysis || null);
  };

  const handleCancelEditMessage = () => {
    setEditingMessageId(null);
    setEditMsgToneAnalysis(null);
  };

  const handleReanalyzeEditedMessageTone = async () => {
    if (!editMsgBody.trim()) return;
    setIsReanalyzingTone(true);
    try {
      const res = await analyzeMessageToneAPI({
        text: editMsgBody,
        stage: editMsgType,
        channel: editMsgChannel,
        sector: formData.sector,
      });
      setEditMsgToneAnalysis(res);
    } catch (err) {
      console.error('Error al re-analizar tono del mensaje:', err);
    } finally {
      setIsReanalyzingTone(false);
    }
  };

  const handleSaveEditedMessage = () => {
    if (!editingMessageId || !editMsgBody.trim()) return;

    const updatedInteractions = (formData.interactions || []).map((msg) => {
      if (msg.id !== editingMessageId) return msg;
      return {
        ...msg,
        date: editMsgDate,
        channel: editMsgChannel,
        messageType: editMsgType,
        body: editMsgBody,
        responseReceived: editMsgResponseReceived,
        responseDate: editMsgResponseReceived ? (editMsgResponseDate || editMsgDate) : undefined,
        responseText: editMsgResponseReceived ? editMsgResponseText : undefined,
        interactionResult: editMsgResult,
        toneAnalysis: editMsgToneAnalysis || msg.toneAnalysis,
      };
    });

    const updatedLead: Lead = {
      ...formData,
      interactions: updatedInteractions,
      contactTone: editMsgToneAnalysis?.primaryTones[0]?.tone || formData.contactTone,
    };

    setFormData(updatedLead);
    onSaveLead(updatedLead);
    setEditingMessageId(null);
    setEditMsgToneAnalysis(null);
  };

  const handleDeleteMessage = (msgId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este mensaje del historial?')) return;
    const updatedInteractions = (formData.interactions || []).filter((m) => m.id !== msgId);
    const updatedLead: Lead = {
      ...formData,
      interactions: updatedInteractions,
    };
    setFormData(updatedLead);
    onSaveLead(updatedLead);
  };

  // AI Objection Advice
  const handleFetchObjectionAdvice = async () => {
    setIsLoadingAdvice(true);
    try {
      const reasons = formData.rejectionReasons?.join(', ') || formData.status0Reason || 'Precio y falta de presupuesto';
      const advice = await getObjectionAdviceAPI({
        objectionReason: reasons,
        sector: formData.sector,
        currentStage: `Estado ${formData.status}`,
        offer: formData.offeredService,
        notes: `${formData.notes || ''}. Keywords: ${formData.rejectionKeywords?.join(', ') || ''}`,
      });
      setAiAdvice(advice);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const getStatusBadge = (status: CommercialStatus, isPending?: boolean) => {
    if (isPending) {
      return (
        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Pendiente de contactar</span>
        </span>
      );
    }
    switch (status) {
      case 0:
        return <span className="text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded text-xs font-mono font-semibold">Estado 0 · Sin resp / No</span>;
      case 1:
        return <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded text-xs font-mono font-semibold">Estado 1 · Respondió 1 vez</span>;
      case 2:
        return <span className="text-sky-800 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded text-xs font-mono font-semibold">Estado 2 · Demo pedida</span>;
      case 3:
        return <span className="text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded text-xs font-mono font-semibold">Estado 3 · Demo rechazada</span>;
      case 4:
        return <span className="text-indigo-800 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded text-xs font-mono font-semibold">Estado 4 · Negociando</span>;
      case 5:
        return <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded text-xs font-mono font-bold">Estado 5 · Venta cerrada</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-800">
        
        {/* Modal Top Header - Aesthetic Light */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {formData.commercialName || formData.companyName}
              </h2>
              {getStatusBadge(formData.status, formData.isPendingContact)}
              {formData.doNotContact && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  Lista Robinson (RGPD)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{formData.companyName}</span>
              <span>·</span>
              <span className="flex items-center gap-1 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{formData.location || 'Sin localización'}</span>
              </span>
              <span>·</span>
              <span>Origen: <strong className="text-slate-700">{formData.leadSource}</strong></span>
              <span>·</span>
              <span>Canal: <strong className="text-slate-700">{formData.channel}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors cursor-pointer"
              >
                <FileEdit className="w-3.5 h-3.5 text-indigo-600" />
                <span>Editar Ficha</span>
              </button>
            ) : (
              <button
                onClick={handleSaveGeneral}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Commercial Status Bar */}
        <div className="px-5 py-2.5 bg-slate-100/70 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Estado Comercial:</span>
            </span>

            {([
              { status: 0 as CommercialStatus, label: 'E0', short: 'Sin resp / No', color: 'slate' },
              { status: 1 as CommercialStatus, label: 'E1', short: 'Respondió 1 vez', color: 'amber' },
              { status: 2 as CommercialStatus, label: 'E2', short: 'Demo pedida', color: 'sky' },
              { status: 3 as CommercialStatus, label: 'E3', short: 'Demo rechazada', color: 'rose' },
              { status: 4 as CommercialStatus, label: 'E4', short: 'Negociando', color: 'indigo' },
              { status: 5 as CommercialStatus, label: 'E5', short: 'Venta cerrada', color: 'emerald' },
            ]).map((st) => {
              const isActive = formData.status === st.status;
              return (
                <button
                  key={st.status}
                  type="button"
                  onClick={() => handleOpenChangeStatus(st.status)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-mono font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isActive
                      ? st.status === 5
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 font-bold'
                        : st.status === 4
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 font-bold'
                        : st.status === 3
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400 font-bold'
                        : st.status === 2
                        ? 'bg-sky-600 text-white ring-2 ring-sky-400 font-bold'
                        : st.status === 1
                        ? 'bg-amber-600 text-white ring-2 ring-amber-400 font-bold'
                        : 'bg-slate-700 text-white ring-2 ring-slate-400 font-bold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-slate-900'
                  }`}
                  title={`Cambiar a Estado ${st.status} (${st.short})`}
                >
                  {isActive && <CheckCircle className="w-3 h-3 text-white" />}
                  <span>{st.label}</span>
                  <span className="hidden sm:inline font-sans text-[11px] font-medium opacity-90">
                    {st.short}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handleOpenChangeStatus(formData.status)}
            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
          >
            <FileEdit className="w-3 h-3 text-indigo-600" />
            <span>Editar Estado & Motivo</span>
          </button>
        </div>

        {/* Duplicate Warning */}
        {duplicateWarning && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 text-xs text-amber-900 flex items-center gap-2 shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{duplicateWarning}</span>
          </div>
        )}

        {/* Navigation Tabs - Aesthetic Light */}
        <div className="flex items-center gap-1 px-5 border-b border-slate-100 bg-white shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Datos del Prospecto & Origen
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'messages'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Historial & Analizador de Tono ({formData.interactions?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('transitions')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'transitions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Transiciones de Estado ({formData.transitions?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('objections')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'objections'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Keywords de Rechazo & IA</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: General Info */}
          {activeTab === 'info' && (
            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Nombre Comercial</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.commercialName}
                      onChange={(e) => handleFieldChange('commercialName', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:border-indigo-500"
                    />
                  ) : (
                    <p className="font-bold text-slate-900">{formData.commercialName}</p>
                  )}
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Empresa / Razón Social</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleFieldChange('companyName', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-slate-700">{formData.companyName || '—'}</p>
                  )}
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Persona de Contacto</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.contactPerson}
                      onChange={(e) => handleFieldChange('contactPerson', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-slate-800 font-semibold">{formData.contactPerson || '—'}</p>
                  )}
                </div>

                {/* Localización */}
                <div>
                  <label className="text-slate-500 block mb-1 font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Localización del Cliente</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleFieldChange('location', e.target.value)}
                      placeholder="Ej: Madrid - Usera, Barcelona, Valencia, Shanghai..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-slate-800 font-medium">{formData.location || 'No especificada'}</p>
                  )}
                </div>

                {/* Origen del Lead */}
                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Origen del Lead</label>
                  {isEditing ? (
                    <select
                      value={formData.leadSource}
                      onChange={(e) => handleFieldChange('leadSource', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:border-indigo-500"
                    >
                      <option value="Redbook (Inbound - Nos contactan)">Redbook (Inbound - Nos contactan)</option>
                      <option value="Redbook (Outbound - Contactamos nosotros)">Redbook (Outbound - Contactamos)</option>
                      <option value="WeChat (Inbound - Nos agregan / contactan)">WeChat (Inbound - Nos agregan)</option>
                      <option value="WeChat (Outbound - Contactamos nosotros)">WeChat (Outbound - Contactamos)</option>
                      <option value="Recomendado / Referido (推荐)">Recomendado / Referido (推荐)</option>
                      <option value="WhatsApp Directo">WhatsApp Directo</option>
                      <option value="Web Inbound / Formulario">Web Inbound / Formulario</option>
                      <option value="Prospección Activa / Scraping">Prospección Activa / Scraping</option>
                    </select>
                  ) : (
                    <p className="text-indigo-700 font-semibold">{formData.leadSource}</p>
                  )}
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Canal de Contacto</label>
                  {isEditing ? (
                    <select
                      value={formData.channel}
                      onChange={(e) => handleFieldChange('channel', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:border-indigo-500 font-medium"
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
                  ) : (
                    <p className="text-slate-900 font-semibold flex items-center gap-1.5">
                      {formData.channel.includes('Redbook') && <span>📕</span>}
                      {formData.channel.includes('WeChat') && <span>💬</span>}
                      {formData.channel.includes('WhatsApp') && <span>📱</span>}
                      <span>{formData.channel}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-slate-700 font-mono">{formData.email || '—'}</p>
                  )}
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Teléfono / WeChat ID</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-slate-700 font-mono">{formData.phone || '—'}</p>
                  )}
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Web Actual</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.currentWebsite}
                      onChange={(e) => handleFieldChange('currentWebsite', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-indigo-600 truncate font-mono">
                      {formData.currentWebsite ? (
                        <a href={formData.currentWebsite} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {formData.currentWebsite}
                        </a>
                      ) : '—'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Sector</label>
                  {isEditing ? (
                    <select
                      value={formData.sector}
                      onChange={(e) => handleFieldChange('sector', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:border-indigo-500"
                    >
                      <option value="Hostelería y Restauración">Hostelería y Restauración</option>
                      <option value="Salud y Clínicas Médicas">Salud y Clínicas Médicas</option>
                      <option value="E-commerce y Retail">E-commerce y Retail</option>
                      <option value="Inmobiliaria y Promoción">Inmobiliaria y Promoción</option>
                      <option value="Servicios Profesionales y Legal">Servicios Profesionales y Legal</option>
                      <option value="Fitness y Bienestar">Fitness y Bienestar</option>
                      <option value="Otro">Otro</option>
                    </select>
                  ) : (
                    <p className="text-slate-800">{formData.sector}</p>
                  )}
                </div>

                {/* Presupuesto Estimado con soporte para "Aún no especificado" */}
                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Presupuesto Estimado (€)</label>
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <input
                        type="number"
                        disabled={formData.estimatedBudget === null}
                        value={formData.estimatedBudget !== null ? formData.estimatedBudget : ''}
                        onChange={(e) => handleFieldChange('estimatedBudget', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="Por definir en cualificación"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500 disabled:bg-slate-100"
                      />
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.estimatedBudget === null}
                          onChange={(e) => handleFieldChange('estimatedBudget', e.target.checked ? null : 3000)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Aún no especificado / Por definir</span>
                      </label>
                    </div>
                  ) : (
                    <p className="text-slate-900 font-mono font-bold">
                      {formData.estimatedBudget !== null ? `${formData.estimatedBudget} €` : <span className="text-slate-400 font-normal italic">Aún no especificado</span>}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Tono del Mensaje de Contacto</label>
                  {isEditing ? (
                    <select
                      value={formData.contactTone || '谦逊礼貌 (Humble & Polite)'}
                      onChange={(e) => handleFieldChange('contactTone', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:border-indigo-500"
                    >
                      <optgroup label="🇨🇳 Tonos Chinos (商务沟通语调)">
                        <option value="谦逊礼貌 (Humble & Polite)">谦逊礼貌 (Humble & Polite / Respetuoso y Humilde)</option>
                        <option value="建立关系 (Guanxi & Trust)">建立关系 (Guanxi & Trust / Confianza y Comunidad)</option>
                        <option value="务实真诚 (Pragmatic & ROI)">务实真诚 (Pragmatic & ROI / 降本增效)</option>
                        <option value="专业背书 (Authority & Social Proof)">专业背书 (Authority & Social Proof / Casos de Éxito)</option>
                        <option value="亲切诚恳 (Warm & Sincere)">亲切诚恳 (Warm & Sincere / Cercano y Empático)</option>
                        <option value="促销让利 (Direct Offer & Benefit)">促销让利 (Direct Offer & Benefit / Oferta y Ventaja)</option>
                        <option value="商务正式 (Formal Business)">商务正式 (Formal Business / Corporativo)</option>
                      </optgroup>
                      <optgroup label="🇪🇸 Tonos Estándar B2B">
                        <option value="Consultivo">Consultivo (Auditoría previa)</option>
                        <option value="Cercano">Cercano & Empático</option>
                        <option value="Orientado a beneficios">Orientado a beneficios</option>
                        <option value="Directo">Directo al grano</option>
                        <option value="Profesional">Profesional formal</option>
                        <option value="Persuasivo">Persuasivo</option>
                        <option value="Centrado en problemas">Centrado en problemas</option>
                      </optgroup>
                    </select>
                  ) : (
                    <p className={`font-semibold ${
                      formData.contactTone?.includes('谦逊') || formData.contactTone?.includes('关系') || formData.contactTone?.includes('务实')
                        ? 'text-red-700 flex items-center gap-1'
                        : 'text-indigo-700'
                    }`}>
                      {formData.contactTone?.includes('(') ? (
                        <span>🇨🇳 {formData.contactTone}</span>
                      ) : (
                        <span>{formData.contactTone || 'Consultivo'}</span>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Día de Último Contacto</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.lastContactDate || ''}
                      onChange={(e) => handleFieldChange('lastContactDate', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-slate-800 font-mono font-medium">{formData.lastContactDate || formData.firstContactDate || 'Pendiente'}</p>
                  )}
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Fecha Siguiente Seguimiento</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formData.nextFollowUpDate}
                      onChange={(e) => handleFieldChange('nextFollowUpDate', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono focus:bg-white focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-slate-700 font-mono">{formData.nextFollowUpDate || '—'}</p>
                  )}
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Responsable Comercial</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.assignedTo}
                      onChange={(e) => handleFieldChange('assignedTo', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-slate-800 font-medium">{formData.assignedTo}</p>
                  )}
                </div>

                <div>
                  <label className="text-slate-500 block mb-1 font-medium">Estado Comercial Actual</label>
                  {isEditing ? (
                    <select
                      value={formData.status}
                      onChange={(e) => handleFieldChange('status', Number(e.target.value) as CommercialStatus)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 font-mono font-semibold focus:bg-white focus:border-indigo-500"
                    >
                      <option value={0}>Estado 0 · Sin respuesta / No interesado</option>
                      <option value={1}>Estado 1 · Respondió 1 vez y silencio</option>
                      <option value={2}>Estado 2 · Interesado en ver demo</option>
                      <option value={3}>Estado 3 · Demo vista pero rechazada</option>
                      <option value={4}>Estado 4 · Negociando propuesta</option>
                      <option value={5}>Estado 5 · Venta cerrada</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 pt-0.5">
                      {getStatusBadge(formData.status, formData.isPendingContact)}
                      <button
                        type="button"
                        onClick={() => handleOpenChangeStatus()}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                      >
                        Cambiar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pendiente de contactar status row */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Estado de Prospección Inicial</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formData.isPendingContact 
                      ? 'Prospecto marcado como pendiente de primer contacto.' 
                      : 'Prospecto ya abordado inicialmente con mensaje registrado.'}
                  </p>
                </div>
                {isEditing ? (
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!formData.isPendingContact}
                      onChange={(e) => handleFieldChange('isPendingContact', e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span>Pendiente de contactar</span>
                  </label>
                ) : (
                  formData.isPendingContact && (
                    <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-xs font-semibold">
                      Pendiente de contactar
                    </span>
                  )
                )}
              </div>

              {/* Notes block */}
              <div>
                <label className="text-slate-700 block mb-1 text-xs font-semibold">Notas y Diagnóstico</label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
                  />
                ) : (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    {formData.notes || 'Sin notas registradas.'}
                  </div>
                )}
              </div>

              {/* RGPD & Opt-out toggle */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                    <span className="text-xs font-bold text-slate-900">Privacidad y Solicitud de Baja (RGPD)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {formData.doNotContact
                      ? `Bloqueado para recontacto: ${formData.doNotContactReason || 'Solicitud de exclusión'}`
                      : 'Actualmente apto para prospección comercial.'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    const updated = {
                      ...formData,
                      doNotContact: !formData.doNotContact,
                      doNotContactReason: !formData.doNotContact ? 'Marcado manualmente como baja' : undefined,
                    };
                    setFormData(updated);
                    onSaveLead(updated);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    formData.doNotContact
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {formData.doNotContact ? 'Quitar de Lista Robinson' : 'Marcar No Contactar'}
                </button>
              </div>

              {/* Danger Zone: Delete */}
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400 font-mono">ID: {formData.id}</span>
                <button
                  onClick={() => onDeleteLead(formData.id)}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Prospecto</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Messages History & AI Tone Analyzer */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Cronología de Interacciones & Tono de Contacto
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Registra mensajes enviados y analiza su tono para evaluar qué enfoque convierte mejor
                  </p>
                </div>

                {!isAddingMessage && (
                  <button
                    onClick={() => setIsAddingMessage(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Registrar Mensaje Enviado</span>
                  </button>
                )}
              </div>

              {/* Add Interaction Form with AI Tone Analyzer */}
              {isAddingMessage && (
                <div className="bg-slate-50 border border-indigo-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Nuevo Mensaje & Análisis de Tono</span>
                    </span>
                    <button
                      onClick={() => setIsAddingMessage(false)}
                      className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1 font-medium">Tipo de Mensaje</label>
                      <select
                        value={newMessageType}
                        onChange={(e) => setNewMessageType(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg p-2"
                      >
                        <option value="inicial">Mensaje Inicial</option>
                        <option value="seguimiento">Seguimiento</option>
                        <option value="negociacion">Mensaje de Negociación</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1 font-medium">Canal</label>
                      <select
                        value={newMessageChannel}
                        onChange={(e) => setNewMessageChannel(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg p-2"
                      >
                        <option value="Redbook (小红书)">Redbook (小红书)</option>
                        <option value="WeChat (微信)">WeChat (微信)</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Recomendado (推荐)">Recomendado (推荐)</option>
                        <option value="Email en frío">Email en frío</option>
                        <option value="LinkedIn DM">LinkedIn DM</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1 font-medium">Resultado</label>
                      <select
                        value={newMessageResult}
                        onChange={(e) => setNewMessageResult(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-slate-800 text-xs rounded-lg p-2"
                      >
                        <option value="Sin respuesta">Sin respuesta (a la espera)</option>
                        <option value="Respuesta positiva">Respuesta positiva</option>
                        <option value="Pidió más info">Pidió más info</option>
                        <option value="Agendó demo">Agendó demo</option>
                        <option value="Objeción planteada">Objeción planteada</option>
                        <option value="Rechazo respetuoso">Rechazo respetuoso</option>
                        <option value="Petición de baja (No contactar)">Petición de baja (No contactar)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1 font-medium">
                      Texto del Mensaje Enviado:
                    </label>
                    <textarea
                      rows={4}
                      value={newMessageBody}
                      onChange={(e) => setNewMessageBody(e.target.value)}
                      placeholder="Pega aquí el mensaje enviado para clasificar su tono y estructura..."
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleAnalyzeTone}
                      disabled={isAnalyzingTone || !newMessageBody.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{isAnalyzingTone ? 'Analizando con IA...' : 'Analizar Tono con IA'}</span>
                    </button>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {newMessageBody.trim().split(/\s+/).filter(Boolean).length} palabras
                    </span>
                  </div>

                  {/* Analysis Result Banner */}
                  {tempToneAnalysis && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Diagnóstico de Tono Detectado:</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          {tempToneAnalysis.isChineseToneDetected && (
                            <span className="text-[10px] font-bold text-red-700 bg-red-100/80 px-2 py-0.5 rounded-full border border-red-200">
                              🇨🇳 Tono Chino Detectado
                            </span>
                          )}
                          <span className="text-[10px] text-indigo-700 font-mono">
                            {tempToneAnalysis.analyzerVersion}
                          </span>
                        </div>
                      </div>

                      {/* Chinese Tones if detected */}
                      {tempToneAnalysis.chineseTones && tempToneAnalysis.chineseTones.length > 0 && (
                        <div className="p-2.5 rounded-lg bg-red-50/80 border border-red-200 space-y-1.5">
                          <span className="text-[10px] font-bold text-red-900 block uppercase tracking-wider">
                            Tonos de Comunicación China:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {tempToneAnalysis.chineseTones.map((ct) => (
                              <span
                                key={ct.tone}
                                className="bg-white text-red-900 border border-red-200 px-2 py-0.5 rounded text-[10px] font-semibold"
                              >
                                {ct.zhTone} ({ct.esTone || ct.enTone}) {ct.score}%
                              </span>
                            ))}
                          </div>
                          {tempToneAnalysis.culturalInsights && (
                            <p className="text-[11px] text-red-900/90 pt-1 leading-relaxed border-t border-red-100">
                              <strong>Consejo cultural:</strong> {tempToneAnalysis.culturalInsights.culturalAdvice}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-medium">Tonos generales:</span>
                        {tempToneAnalysis.primaryTones.map((t) => (
                          <span
                            key={t.tone}
                            className="bg-white text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded text-[11px] font-mono font-semibold"
                          >
                            {t.tone} ({t.score}%)
                          </span>
                        ))}
                      </div>

                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {tempToneAnalysis.aiReasoning}
                      </p>
                    </div>
                  )}

                  {/* Optional Response Received */}
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="respRec"
                        checked={newMessageResponseReceived}
                        onChange={(e) => setNewMessageResponseReceived(e.target.checked)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="respRec" className="text-xs text-slate-700 font-medium">
                        El cliente ya ha respondido a este mensaje
                      </label>
                    </div>

                    {newMessageResponseReceived && (
                      <textarea
                        rows={2}
                        value={newMessageResponseText}
                        onChange={(e) => setNewMessageResponseText(e.target.value)}
                        placeholder="Texto de la respuesta recibida..."
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                      />
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingMessage(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddInteraction}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm cursor-pointer"
                    >
                      Guardar en Historial
                    </button>
                  </div>
                </div>
              )}

              {/* Message List */}
              <div className="space-y-3.5">
                {(!formData.interactions || formData.interactions.length === 0) ? (
                  <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                    No hay mensajes registrados aún. Haz clic en &quot;Registrar Mensaje Enviado&quot; para auditar el primer contacto.
                  </div>
                ) : (
                  formData.interactions.map((msg) => (
                    editingMessageId === msg.id ? (
                      <div
                        key={msg.id}
                        className="bg-white border-2 border-indigo-400 rounded-xl p-4.5 space-y-4 shadow-md"
                      >
                        <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <FileEdit className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-bold text-slate-900">
                              Editando Mensaje Enviado
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">({msg.id})</span>
                          </div>
                          <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                            Modo edición de mensaje
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-slate-500 block mb-1 text-xs font-medium">Etapa / Tipo</label>
                            <select
                              value={editMsgType}
                              onChange={(e) => setEditMsgType(e.target.value as any)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
                            >
                              <option value="inicial">Mensaje Inicial (Primer contacto)</option>
                              <option value="seguimiento">Seguimiento comercial</option>
                              <option value="negociacion">Mensaje de Negociación</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-slate-500 block mb-1 text-xs font-medium">Canal de Envío</label>
                            <select
                              value={editMsgChannel}
                              onChange={(e) => setEditMsgChannel(e.target.value as OutreachChannel)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:bg-white focus:border-indigo-500"
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
                            <label className="text-slate-500 block mb-1 text-xs font-medium">Fecha de Envío</label>
                            <input
                              type="date"
                              value={editMsgDate}
                              onChange={(e) => setEditMsgDate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 font-mono focus:bg-white focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Body */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-slate-700 text-xs font-semibold">Cuerpo del Mensaje Enviado</label>
                            <button
                              type="button"
                              onClick={handleReanalyzeEditedMessageTone}
                              disabled={isReanalyzingTone || !editMsgBody.trim()}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>{isReanalyzingTone ? 'Analizando tono...' : 'Re-analizar Tono con IA'}</span>
                            </button>
                          </div>
                          <textarea
                            rows={4}
                            value={editMsgBody}
                            onChange={(e) => setEditMsgBody(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 leading-relaxed font-sans"
                            placeholder="Texto del mensaje..."
                          />
                        </div>

                        {/* Tone Result if available or edited */}
                        {(editMsgToneAnalysis || msg.toneAnalysis) && (
                          <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-indigo-950 text-[11px]">Tonos clasificados:</span>
                              <span className="text-[10px] text-indigo-600 font-mono">
                                Estructura: {(editMsgToneAnalysis || msg.toneAnalysis)?.structure || 'Consultivo'}
                              </span>
                            </div>

                            {/* Chinese tones if present in message */}
                            {((editMsgToneAnalysis || msg.toneAnalysis)?.chineseTones || []).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pb-1">
                                {((editMsgToneAnalysis || msg.toneAnalysis)?.chineseTones || []).map((ct) => (
                                  <span
                                    key={ct.tone}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-900 border border-red-200"
                                  >
                                    🇨🇳 {ct.zhTone} ({ct.esTone || ct.enTone}) {ct.score}%
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-1.5">
                              {((editMsgToneAnalysis || msg.toneAnalysis)?.primaryTones || []).map((t) => (
                                <span
                                  key={t.tone}
                                  className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-indigo-800 border border-indigo-200"
                                >
                                  {t.tone} {t.score}%
                                </span>
                              ))}
                            </div>
                            {(editMsgToneAnalysis || msg.toneAnalysis)?.aiReasoning && (
                              <p className="text-[11px] text-slate-600 italic pt-0.5">
                                &quot;{(editMsgToneAnalysis || msg.toneAnalysis)?.aiReasoning}&quot;
                              </p>
                            )}
                          </div>
                        )}

                        {/* Response toggle and details */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                              <input
                                type="checkbox"
                                checked={editMsgResponseReceived}
                                onChange={(e) => setEditMsgResponseReceived(e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>El cliente respondió a este mensaje</span>
                            </label>

                            {editMsgResponseReceived && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-500">Fecha respuesta:</span>
                                <input
                                  type="date"
                                  value={editMsgResponseDate}
                                  onChange={(e) => setEditMsgResponseDate(e.target.value)}
                                  className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-mono"
                                />
                              </div>
                            )}
                          </div>

                          {editMsgResponseReceived && (
                            <div>
                              <label className="text-[11px] text-slate-600 block mb-1 font-medium">Texto de la respuesta recibida:</label>
                              <textarea
                                rows={2}
                                value={editMsgResponseText}
                                onChange={(e) => setEditMsgResponseText(e.target.value)}
                                placeholder="Escribe la respuesta del cliente..."
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:border-indigo-500"
                              />
                            </div>
                          )}

                          <div>
                            <label className="text-[11px] text-slate-600 block mb-1 font-medium">Resultado comercial de la interacción:</label>
                            <select
                              value={editMsgResult}
                              onChange={(e) => setEditMsgResult(e.target.value as any)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:border-indigo-500 font-medium"
                            >
                              <option value="Sin respuesta">Sin respuesta</option>
                              <option value="Respuesta positiva">Respuesta positiva</option>
                              <option value="Pidió más info">Pidió más info</option>
                              <option value="Agendó demo">Agendó demo</option>
                              <option value="Objeción planteada">Objeción planteada</option>
                              <option value="Rechazo respetuoso">Rechazo respetuoso</option>
                              <option value="Petición de baja (No contactar)">Petición de baja (No contactar)</option>
                            </select>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleCancelEditMessage}
                            className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEditedMessage}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Guardar Mensaje Editado</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={msg.id}
                        className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 capitalize">
                              {msg.messageType}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-600 font-medium">{msg.channel}</span>
                            <span className="text-slate-300">·</span>
                            <span className="text-slate-500 font-mono text-[11px]">{msg.date}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              msg.interactionResult === 'Agendó demo' || msg.interactionResult === 'Respuesta positiva'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : msg.interactionResult === 'Petición de baja (No contactar)'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {msg.interactionResult}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleStartEditMessage(msg)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded transition-colors cursor-pointer font-medium"
                              title="Editar este mensaje enviado"
                            >
                              <FileEdit className="w-3 h-3 text-indigo-500" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Eliminar mensaje del historial"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap">
                          {msg.body}
                        </p>

                        {msg.toneAnalysis && (
                          <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 space-y-1 text-xs">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] font-bold text-indigo-900">
                                Tonos detectados:
                              </span>
                              {msg.toneAnalysis.chineseTones && msg.toneAnalysis.chineseTones.length > 0 && (
                                msg.toneAnalysis.chineseTones.map((ct) => (
                                  <span
                                    key={ct.tone}
                                    className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-900 border border-red-200 flex items-center gap-1"
                                  >
                                    <span>🇨🇳 {ct.zhTone}</span>
                                    <span className="text-[9px] opacity-75">{ct.score}%</span>
                                  </span>
                                ))
                              )}
                              {msg.toneAnalysis.primaryTones.map((t) => (
                                <span
                                  key={t.tone}
                                  className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-white text-indigo-800 border border-indigo-200"
                                >
                                  {t.tone} {t.score}%
                                </span>
                              ))}
                            </div>
                            {msg.toneAnalysis.culturalInsights?.culturalAdvice && (
                              <p className="text-[11px] text-slate-600 leading-snug pt-0.5">
                                <span className="font-semibold text-slate-700">Insight cultural:</span> {msg.toneAnalysis.culturalInsights.culturalAdvice}
                              </p>
                            )}
                          </div>
                        )}

                        {msg.responseReceived && msg.responseText && (
                          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs space-y-1">
                            <span className="font-semibold text-emerald-900 block text-[11px]">
                              Respuesta recibida ({msg.responseDate || msg.date}):
                            </span>
                            <p className="text-emerald-800 italic">
                              &quot;{msg.responseText}&quot;
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Status Transition History */}
          {activeTab === 'transitions' && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Registro Inmutable de Transiciones Comerciales
                </h3>
                <p className="text-[11px] text-slate-500">
                  Historial cronológico de cambios de estado sin sobrescritura de datos
                </p>
              </div>

              {(!formData.transitions || formData.transitions.length === 0) ? (
                <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                  Aún no hay transiciones manuales registradas en este prospecto.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {formData.transitions.map((tr, idx) => (
                    <div
                      key={tr.id || idx}
                      className="bg-white border border-slate-200/80 rounded-xl p-3.5 flex items-start gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                    >
                      <div className="p-1.5 rounded-full bg-slate-100 text-indigo-600 shrink-0 mt-0.5">
                        <History className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-1 flex-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            Estado {tr.fromStatus} → Estado {tr.toStatus}
                          </span>
                          <span className="text-slate-500 font-mono text-[11px]">
                            {tr.date} {tr.durationDays !== undefined ? `(${tr.durationDays} días)` : ''}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs">
                          {tr.notes || 'Sin notas registradas.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Objection AI Strategy & Rejection Keywords */}
          {activeTab === 'objections' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Motivos de Rechazo & Palabras Clave
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Adjunta el motivo de rechazo y añade keywords para análisis agregado posterior
                  </p>
                </div>

                <button
                  onClick={handleFetchObjectionAdvice}
                  disabled={isLoadingAdvice}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLoadingAdvice ? 'Generando...' : 'Recomendación IA'}</span>
                </button>
              </div>

              {/* Keyword addition form */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                <span className="text-slate-700 font-semibold block">
                  Palabras Clave del Rechazo / Objeción:
                </span>

                <div className="flex flex-wrap gap-1.5">
                  {(formData.rejectionKeywords || []).map((kw) => (
                    <span
                      key={kw}
                      className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-rose-500 hover:text-rose-700 ml-0.5 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    placeholder="Ej: PRECIO_ALTO, PROVEEDOR_CHINO, DECISION_APLAZADA..."
                    className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono uppercase text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  >
                    + Añadir Keyword
                  </button>
                </div>

                {/* Quick suggestions */}
                <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <span>Sugerencias rápidas:</span>
                  {['#PRECIO_ELEVADO', '#YA_TIENE_AGENCIA', '#PREFIERE_SOLO_REDBOOK', '#DECISION_APLAZADA', '#FALTA_CONFIANZA'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => {
                        const current = formData.rejectionKeywords || [];
                        if (!current.includes(sug)) {
                          const updated = { ...formData, rejectionKeywords: [...current, sug] };
                          setFormData(updated);
                          onSaveLead(updated);
                        }
                      }}
                      className="text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded hover:border-indigo-300 font-mono text-[10px] cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current registered reasons */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <span className="text-slate-700 block font-semibold">Motivos de rechazo registrados:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(formData.rejectionReasons || []).map((r) => (
                    <span key={r} className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-medium">
                      {r}
                    </span>
                  ))}
                  {formData.status0Reason && (
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                      Estado 0: {formData.status0Reason}
                    </span>
                  )}
                </div>
                {formData.rejectionNotes && (
                  <p className="text-slate-600 pt-1 text-[11px] italic">
                    &quot;{formData.rejectionNotes}&quot;
                  </p>
                )}
              </div>

              {/* AI Strategic Output */}
              {aiAdvice && (
                <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-5 space-y-4 text-xs">
                  <div>
                    <span className="font-bold text-indigo-950 block mb-1">
                      1. Diagnóstico de la Objeción Real:
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {aiAdvice.diagnosis}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-indigo-950 block mb-1">
                      2. Recomendación Táctica para la Agencia:
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {aiAdvice.actionRecommendation}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-emerald-900 block mb-1">
                      3. Mensaje Sugerido para Responder / Reactivar:
                    </span>
                    <div className="bg-white p-3.5 rounded-lg border border-indigo-100 text-slate-800 font-sans leading-relaxed whitespace-pre-wrap select-all shadow-xs">
                      {aiAdvice.recommendedFollowUpMessage}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-amber-900 block mb-1">
                      4. Medida Preventiva en Futuras Demos:
                    </span>
                    <p className="text-slate-700 leading-relaxed">
                      {aiAdvice.preventativeAction}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Change Confirmation Modal Overlay */}
        {isChangeStatusModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Cambiar Estado Comercial</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Actualiza la etapa y registra la transición histórica con motivo
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangeStatusModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Target status selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Nuevo Estado Comercial:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {([
                    { status: 0 as CommercialStatus, label: 'E0 · Sin resp / No' },
                    { status: 1 as CommercialStatus, label: 'E1 · Respondió 1 vez' },
                    { status: 2 as CommercialStatus, label: 'E2 · Demo pedida' },
                    { status: 3 as CommercialStatus, label: 'E3 · Demo rechazada' },
                    { status: 4 as CommercialStatus, label: 'E4 · Negociando' },
                    { status: 5 as CommercialStatus, label: 'E5 · Venta cerrada' },
                  ]).map((st) => (
                    <button
                      key={st.status}
                      type="button"
                      onClick={() => setTargetStatus(st.status)}
                      className={`p-2 rounded-lg text-xs font-mono font-semibold border transition-all text-left cursor-pointer ${
                        targetStatus === st.status
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{st.label}</span>
                        {targetStatus === st.status && <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* If moving to Estado 0 */}
              {targetStatus === 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <label className="font-semibold text-slate-800 block">Motivo secundario (Estado 0):</label>
                  <select
                    value={status0Reason}
                    onChange={(e) => setStatus0Reason(e.target.value as Status0SecondaryReason)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                  >
                    <option value="No responde tras varios intentos">No responde tras varios intentos</option>
                    <option value="Rechazo explícito">Rechazo explícito</option>
                    <option value="No es el decisor adecuado">No es el decisor adecuado</option>
                    <option value="Email o contacto inválido">Email o contacto inválido</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              )}

              {/* If moving to Estado 3 */}
              {targetStatus === 3 && (
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2 text-xs">
                  <label className="font-semibold text-rose-900 block">Motivo de rechazo de la demo:</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                    {([
                      'Precio',
                      'Falta de presupuesto',
                      'No ve suficiente valor',
                      'No necesita web',
                      'Ya tiene proveedor',
                      'Mal momento',
                      'Falta de confianza',
                      'Funcionalidades insuficientes',
                      'Decisión aplazada',
                      'Eligió a la competencia',
                      'Otro',
                    ] as RejectionReason[]).map((r) => {
                      const isSelected = statusRejectionReasons.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setStatusRejectionReasons(
                              isSelected
                                ? statusRejectionReasons.filter((x) => x !== r)
                                : [...statusRejectionReasons, r]
                            );
                          }}
                          className={`px-2 py-1 text-[11px] rounded border text-left cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-rose-600 text-white border-rose-600 font-semibold'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-rose-50'
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* If moving to Estado 5 */}
              {targetStatus === 5 && (
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <label className="font-semibold text-emerald-950 block">Datos del Cierre de Venta:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-slate-600 block mb-0.5">Importe Acordado (€):</span>
                      <input
                        type="number"
                        value={statusAgreedAmount}
                        onChange={(e) => setStatusAgreedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Ej: 3500"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-600 block mb-0.5">Servicio Contratado:</span>
                      <input
                        type="text"
                        value={statusContractedService}
                        onChange={(e) => setStatusContractedService(e.target.value)}
                        placeholder="Ej: Web corporativa + SEO"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Transition Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nota o Justificación de la Transición (opcional):
                </label>
                <textarea
                  rows={2}
                  value={statusTransitionNote}
                  onChange={(e) => setStatusTransitionNote(e.target.value)}
                  placeholder="Ej: Cliente aceptó videollamada de demo para el jueves a las 11:00..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white focus:border-indigo-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsChangeStatusModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg bg-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStatusChange}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Confirmar y Guardar Estado</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
