import React, { useState } from 'react';
import { AGENTS } from '../constants';
import { AgentProfile, AgentType } from '../types';
import LiveCallInterface from './LiveCallInterface';

const VoiceWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [showPatientFormModal, setShowPatientFormModal] = useState(false);
  const [selectedAgentForForm, setSelectedAgentForForm] = useState<AgentProfile | null>(null);
  const [patientData, setPatientData] = useState({
    name: '',
    phoneNumber: ''
  });

  const handleAgentSelect = (agent: AgentProfile) => {
    // Show patient form for all agents
    setSelectedAgentForForm(agent);
    setShowPatientFormModal(true);
  };

  const handlePatientFormSubmit = () => {
    if (patientData.name.trim() && patientData.phoneNumber.trim() && selectedAgentForForm) {
      // Add patient data to agent object
      const agentWithPatientData = {
        ...selectedAgentForForm,
        userName: patientData.name.trim(),
        phoneNumber: patientData.phoneNumber.trim()
      };
      setSelectedAgent(agentWithPatientData as AgentProfile);
      setShowPatientFormModal(false);
    }
  };

  const handlePatientFormCancel = () => {
    setShowPatientFormModal(false);
    setPatientData({ name: '', phoneNumber: '' });
    setSelectedAgentForForm(null);
  };

  const handleCloseCall = () => {
    setSelectedAgent(null);
    setPatientData({ name: '', phoneNumber: '' }); // Reset patient data
    setSelectedAgentForForm(null);
  };

  return (
    <div className="fixed bottom-8 right-4 sm:right-8 z-50 flex flex-col items-end space-y-4 font-sans">

      {/* Patient Information Form Modal */}
      {showPatientFormModal && selectedAgentForForm && (
        <div className="relative z-[60] flex items-center justify-center" style={{
          top: '-10%',
          left: '-10%',
          transform: 'translate(0%, -30%)',
          width: '100%',
          height: '100%'
        }}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[320px] p-4 relative">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-600">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Patient Information</h3>
              <p className="text-slate-600 text-sm">Connecting with {selectedAgentForForm.name}</p>
            </div>

            {/* Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={patientData.name}
                  onChange={(e) => setPatientData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors text-slate-900 placeholder-slate-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  value={patientData.phoneNumber}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9+\-\s]/g, '');
                    setPatientData(prev => ({ ...prev, phoneNumber: numericValue }));
                  }}
                  placeholder="+91 82002 92304"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors text-slate-900 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePatientFormCancel}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePatientFormSubmit}
                disabled={!patientData.name.trim() || !patientData.phoneNumber.trim()}
                className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                </svg>
                Start Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container (Modal) */}
      <div className={`
            bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden
            transition-all duration-500 origin-bottom-right ease-[cubic-bezier(0.23,1,0.32,1)]
            ${isOpen || selectedAgent
          ? 'w-[90vw] sm:w-[400px] h-[700px] max-h-[85vh] opacity-100 scale-100 translate-y-0'
          : 'w-[300px] h-[50px] opacity-0 scale-90 translate-y-10 pointer-events-none'}
            ${showPatientFormModal ? 'blur-sm pointer-events-none' : ''}
            flex flex-col absolute bottom-[calc(4rem+16px)] right-0
        `}>

        {selectedAgent ? (
          // --- View 2: Live Call Interface ---
          <LiveCallInterface agent={selectedAgent} onClose={handleCloseCall} />
        ) : (
          // --- View 1: Agent Selection ---
          <>
            {/* Professional Header */}
            <div className="bg-slate-900 p-6 pb-8 relative overflow-hidden shrink-0 select-none">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-2 bg-slate-800/50 backdrop-blur-md py-1 px-3 rounded-full border border-slate-700/50 shadow-lg">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Systems Online</span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all backdrop-blur-sm"
                    aria-label="Close"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                <h3 className="text-2xl font-bold text-white tracking-tight mb-1">Medical Consultation</h3>
                <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-[90%]">
                  Connect with our specialized AI doctors for instant medical guidance.
                </p>
              </div>
            </div>

            {/* List Container */}
            <div className="flex-1 overflow-y-auto p-4 -mt-6 bg-slate-50 custom-scrollbar relative z-20 rounded-t-3xl space-y-3 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">

              {AGENTS.map((agent) => (
                <div
                  key={agent.id}
                  className="group bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-brand-200 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Content */}
                  <div className="flex items-start gap-4 relative z-10">

                    {/* Avatar */}
                    <div className="relative flex-shrink-0 mt-1">
                      <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-brand-400 group-hover:to-brand-600 transition-colors duration-300">
                        <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full rounded-full object-cover border-2 border-white" />
                      </div>
                      <div className="absolute bottom-0 right-0 bg-white p-0.5 rounded-full shadow-md">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight group-hover:text-brand-700 transition-colors">{agent.name}</h4>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">{agent.role}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                        {agent.description}
                      </p>

                      {/* Visible Call Button */}
                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => handleAgentSelect(agent)}
                          className="bg-slate-900 hover:bg-brand-600 text-white text-[11px] font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-md w-full justify-center sm:w-auto"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" /></svg>
                          Call Agent
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Stats */}
            <div className="p-3 bg-white border-t border-slate-100 shrink-0 relative z-30">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center border-r border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg. Wait Time</p>
                  <p className="text-xs font-bold text-slate-700 font-mono">&lt; 10s</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Satisfaction</p>
                  <p className="text-xs font-bold text-slate-700 font-mono">99.8%</p>
                </div>
              </div>
              <div className="mt-2 text-center">
                <p className="text-[9px] text-slate-300 font-medium">Powered by Pipecat Cloud</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => !selectedAgent && !showPatientFormModal && setIsOpen(!isOpen)}
        className={`
            w-16 h-16 rounded-full shadow-2xl shadow-brand-900/30 flex items-center justify-center transition-all duration-500 z-50 relative
            ${isOpen || selectedAgent ? 'bg-slate-900 rotate-180 hover:bg-slate-800' : 'bg-brand-600 hover:bg-brand-500 hover:scale-110 hover:-translate-y-1'}
            ${showPatientFormModal ? 'blur-sm pointer-events-none' : ''}
        `}
        aria-label={isOpen ? "Close Support" : "Open Support"}
      >
        {isOpen || selectedAgent ? (
          <svg className="text-white w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <>
            {/* Ripples */}
            <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-20 animate-ping duration-1000"></span>
            <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-10 animate-pulse duration-2000 delay-75"></span>

            {/* Icon */}
            <svg className="text-white w-7 h-7 relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </>
        )}
      </button>
    </div>
  );
};

export default VoiceWidget;