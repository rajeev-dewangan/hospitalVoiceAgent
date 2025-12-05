import React, { useEffect, useRef, useState } from 'react';
import { AgentProfile } from '../types';
import { usePipecatConnection } from '../hooks/usePipecatConnection';
import { VoiceAgentProvider } from '../providers/PipecatProvider';

interface LiveCallInterfaceProps {
  agent: AgentProfile;
  onClose: () => void;
}

const LiveCallInterfaceInner: React.FC<LiveCallInterfaceProps> = ({ agent, onClose }) => {
  const { isConnected, isSpeaking, isUserSpeaking, isWaitingForResponse, volume, connect, disconnect, error, assistantText, assistantWords } = usePipecatConnection();
  const hasConnectedRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasInitiatedConnectionRef = useRef(false);
  const [hasBotSpoken, setHasBotSpoken] = useState(false);

  // Debug: Log connection state
  useEffect(() => {
    console.log('🔊 LiveCallInterface state:', {
      isConnected,
      isSpeaking,
      volume,
      error,
      agentName: agent.name,
    });
  }, [isConnected, isSpeaking, volume, error, agent.name]);

  // Track when we actually connect
  useEffect(() => {
    if (isConnected) {
      hasConnectedRef.current = true;
    }
  }, [isConnected]);

  // Track when bot first starts speaking - update immediately when isSpeaking becomes true
  useEffect(() => {
    if (isSpeaking && !hasBotSpoken) {
      setHasBotSpoken(true);
      console.log('🎤 Bot has started the conversation - showing Live Secure Line');
    }
  }, [isSpeaking, hasBotSpoken]);


  // Auto-connect when this component mounts
  useEffect(() => {
    // Prevent duplicate connection attempts (React Strict Mode in dev causes double mount)
    if (hasInitiatedConnectionRef.current) {
      console.log('⏭️ Connection already initiated, skipping duplicate mount');
      return;
    }

    isMountedRef.current = true;
    hasInitiatedConnectionRef.current = true;
    console.log(`🚀 Auto-connecting to agent: ${agent.name} (${agent.id})`);
    
    const connectAgent = async () => {
      if (isMountedRef.current) {
        await connect(agent);
      }
    };
    
    connectAgent();
    
    return () => {
      isMountedRef.current = false;
      hasInitiatedConnectionRef.current = false;
      // Only disconnect if we actually connected (prevents React Strict Mode double-cleanup)
      if (hasConnectedRef.current) {
        console.log(`🛑 Disconnecting from agent: ${agent.name}`);
        disconnect();
        hasConnectedRef.current = false;
      } else {
        console.log(`⏭️ Skipping disconnect - never connected`);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <div className="h-full w-full bg-slate-900 text-white flex flex-col relative overflow-hidden select-none">
      {/* Background Gradient & Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 z-0"></div>
      <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-500/10 rounded-full blur-[100px] transition-all duration-1000 z-0 ${isSpeaking ? 'scale-150 opacity-50' : 'scale-100 opacity-30'}`}></div>
      
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-slate-900/10 backdrop-blur-sm z-20 border-b border-white/5">
        <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${hasBotSpoken ? 'bg-red-500 animate-pulse' : isConnected ? 'bg-yellow-500' : 'bg-yellow-500'}`}></div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {hasBotSpoken ? 'Live Secure Line' : isConnected ? 'Establishing Connection...' : 'Connecting...'}
            </span>
        </div>
        <button 
          onClick={async () => {
            await disconnect();
            onClose();
          }}
          className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 py-12 relative z-10 min-h-0">
        {/* Error Message */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg text-xs text-center backdrop-blur-md animate-fade-in">
            {error}
          </div>
        )}

        {/* Agent Avatar/Identity */}
        <div className="relative mb-8 -mt-16">
           {/* Ripple Rings when speaking */}
           <div className={`absolute -inset-4 border border-brand-500/30 rounded-full transition-all duration-300 ${isSpeaking ? 'scale-110 opacity-100' : 'scale-100 opacity-0'}`}></div>
           <div className={`absolute -inset-8 border border-brand-500/10 rounded-full transition-all duration-500 delay-75 ${isSpeaking ? 'scale-110 opacity-100' : 'scale-100 opacity-0'}`}></div>
           
           <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-800/80 shadow-2xl relative z-10 ring-1 ring-white/10">
             <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
           </div>
           
           {/* Status Badge */}
           <div className="absolute bottom-1 right-1 bg-slate-900 rounded-full p-1 shadow-lg z-20">
              <div className={`w-3.5 h-3.5 rounded-full border-2 border-slate-900 transition-colors duration-300 ${isConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
           </div>
        </div>

        <div className="text-center space-y-2 mb-0">
            <h2 className="text-2xl font-bold text-white tracking-tight">{agent.name}</h2>
            <div className="inline-block bg-white/5 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
                <p className="text-brand-300 text-[10px] font-bold uppercase tracking-widest">{agent.role}</p>
            </div>
        </div>

        {/* Audio Visualizer */}
        <div className="relative h-32 w-full mb-8 -mt-12 overflow-visible z-10">
          <div className="absolute inset-0 flex items-end justify-center space-x-1.5 px-4">
            {isConnected ? (
              <>
                 {/* Dynamic bars - FIXED: Remove random, use volume with consistent multipliers */}
                 {[...Array(5)].map((_, i) => {
                    // Use consistent multipliers based on bar index (no random!)
                    const multipliers = [0.4, 0.6, 0.5, 0.7, 0.45]; // Different heights for visual variety
                    const heightMultiplier = multipliers[i];
                    
                    // Scale volume (0-255) to pixel height (6-120px)
                    // Use full container height (h-32 = 128px)
                    const normalizedVolume = volume / 255; // 0 to 1
                    const maxHeight = 120; // Max bar height (increased)
                    const minHeight = 6; // Min bar height
                    const heightVal = Math.min(maxHeight, Math.max(minHeight, minHeight + (normalizedVolume * (maxHeight - minHeight) * heightMultiplier)));
                    
                    // Opacity based on volume, with minimum for visibility
                    // Keep opacity high so bars are always visible
                    const opacity = Math.min(1, Math.max(0.6, normalizedVolume * 1.5 + 0.4));
                    
                    return (
                      <div 
                        key={i} 
                        className="w-1.5 rounded-full transition-all duration-75 ease-out shadow-[0_0_12px_rgba(14,165,233,0.4)]"
                        style={{ 
                          height: `${heightVal}px`,
                          opacity: opacity,
                          background: 'linear-gradient(to top, rgb(14, 165, 233), rgb(186, 230, 253))', // brand-500 to brand-200 with full opacity
                        }}
                      ></div>
                    )
                 })}
              </>
            ) : (
               <div className="flex flex-col items-center space-y-3 opacity-50">
                   <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-slate-400 text-[10px] font-mono animate-pulse">SYNCING...</span>
               </div>
            )}
          </div>
        </div>
      </div>

        {/* Status Text - Positioned at 65% from top */}
      {hasBotSpoken && (
        <div className="absolute top-[60%] left-0 right-0 text-center z-10">
          {/* Show transcript when speaking OR when we have words to display */}
          {isSpeaking || assistantWords.length > 0 ? (
            /* Transcript Display - 2 Lines */
            assistantWords.length > 0 ? (
              <div className="px-6 max-w-3xl mx-auto">
                <div 
                  className="flex flex-wrap justify-center items-start gap-x-2 gap-y-1 min-h-[4rem] max-h-[4.5rem] overflow-visible"
                  style={{
                    lineHeight: '1.5rem',
                  }}
                >
                  {assistantWords.map((wordData) => (
                    <span
                      key={wordData.id}
                      className="text-gray-400 text-base font-normal inline-block"
                    >
                      {wordData.word}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-gray-600 text-lg font-medium">speaking...</span>
            )
          ) : (
            <span className="text-gray-600 text-lg font-medium">
              {isUserSpeaking 
                ? 'listening...' 
                : isWaitingForResponse 
                  ? 'waiting for response...' 
                  : 'thinking...'}
            </span>
          )}
        </div>
      )}

      {/* Footer Controls */}
      <div className="p-6 bg-slate-900/40 backdrop-blur-md border-t border-white/5 flex justify-center pb-10 z-20">
        <button
          onClick={async () => {
            await disconnect();
            onClose();
          }}
          className="group flex flex-col items-center gap-3 transition-all"
        >
          <div className="w-16 h-16 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-900/50 transition-all transform group-hover:scale-105 group-hover:shadow-red-500/20 ring-4 ring-red-500/20">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/></svg>
          </div>
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-widest">End Call</span>
        </button>
      </div>
    </div>
  );
};

const LiveCallInterface: React.FC<LiveCallInterfaceProps> = ({ agent, onClose }) => {
  return (
    <VoiceAgentProvider agentName={agent.id}>
      <LiveCallInterfaceInner agent={agent} onClose={onClose} />
    </VoiceAgentProvider>
  );
};

export default LiveCallInterface;