import { useCallback, useState, useEffect, useRef } from 'react';
import {
  usePipecatClient,
  usePipecatClientTransportState,
} from '@pipecat-ai/client-react';
import { DailyTransport } from '@pipecat-ai/daily-transport';
import { AgentProfile } from '../types';

interface UsePipecatConnectionReturn {
  isConnected: boolean;
  isSpeaking: boolean;
  isUserSpeaking: boolean;
  isWaitingForResponse: boolean;
  volume: number;
  connect: (agent: AgentProfile) => Promise<void>;
  disconnect: () => Promise<void>;
  error: string | null;
  assistantText: string | null; // Current text the assistant is saying (full text)
  assistantWords: Array<{ word: string; id: number }>; // Last 5-6 words for rolling display with stable IDs
}

export const usePipecatConnection = (): UsePipecatConnectionReturn => {
  const client = usePipecatClient();
  const transportState = usePipecatClientTransportState();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [assistantText, setAssistantText] = useState<string | null>(null);
  const [assistantWords, setAssistantWords] = useState<Array<{ word: string; id: number }>>([]); // Array of words with IDs for stable keys
  
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioStateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isUserSpeakingRef = useRef(false);
  const isNewResponseRef = useRef(true); // Track if we're starting a new response
  const wordsWithIdsRef = useRef<Array<{ word: string; id: number }>>([]); // Keep full word array with stable IDs
  const wordIdCounterRef = useRef(0); // Counter for unique word IDs
  const llmTextRef = useRef<string | null>(null); // Accumulate LLM text
  const wordDisplayTimeoutsRef = useRef<NodeJS.Timeout[]>([]); // Track timeouts for word display
  const useTtsFallbackRef = useRef(false); // Track if we're using TTS text as fallback
  const speechStartTimeRef = useRef<number>(0); // Track when bot started speaking for consistent timing
  const processedWordCountRef = useRef<number>(0); // Track how many words have been scheduled
  const transcriptClearTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout to clear transcript after speech ends
  const lastBotAudioActivityRef = useRef<number>(0); // Audio-based safety net for bot speech
  const lastUserActivityRef = useRef<number>(0); // Track last user VAD event
  const lastTranscriptUpdateRef = useRef<number>(0); // Track last time we updated transcript UI
  const fallbackMonitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isConnected = ['connected', 'ready'].includes(transportState);

  // Debug: Log transport state changes and reset connecting flag when connected
  useEffect(() => {
    console.log(`📡 Transport state changed: ${transportState}`);
    if (transportState === 'connected' || transportState === 'ready') {
      console.log('✅ Transport is connected and ready');
      isConnectingRef.current = false; // Reset connecting flag when connected
    } else if (transportState === 'error' || transportState === 'disconnected') {
      console.warn(`⚠️ Transport state: ${transportState}`);
      isConnectingRef.current = false; // Reset connecting flag on error/disconnect
    }
  }, [transportState]);

  // Listen to Pipecat client events for bot and user speaking
  useEffect(() => {
    if (!client) return;

    // Helper function to reset state for a new response
    const resetForNewResponse = () => {
      console.log('🔄 Resetting for new response');
      wordsWithIdsRef.current = [];
      wordIdCounterRef.current = 0;
      processedWordCountRef.current = 0;
      wordDisplayTimeoutsRef.current.forEach(t => clearTimeout(t));
      wordDisplayTimeoutsRef.current = [];
      isNewResponseRef.current = false;
      speechStartTimeRef.current = Date.now();
      
      // Clear transcript clear timeout since new response is starting
      if (transcriptClearTimeoutRef.current) {
        clearTimeout(transcriptClearTimeoutRef.current);
        transcriptClearTimeoutRef.current = null;
      }
    };

    // Helper function to process NEW words from accumulated LLM text
    // This handles streaming - only schedules words that haven't been scheduled yet
    const processNewLlmWords = (fullText: string) => {
      const words = fullText.split(/\s+/).filter(Boolean);
      const alreadyProcessed = processedWordCountRef.current;
      
      // Find NEW words that haven't been scheduled
      const newWordStrings = words.slice(alreadyProcessed);
      if (newWordStrings.length === 0) {
        console.log('📊 No new words to process');
        return;
      }
      
      console.log('📊 Processing', newWordStrings.length, 'new words (total:', words.length, ', already scheduled:', alreadyProcessed, ')');
      
      const msPerWord = 250;
      const maxWordsFor2Lines = 18;
      const now = Date.now();
      const elapsedSinceSpeechStart = now - speechStartTimeRef.current;
      
      // Add new words to the global list and schedule them
      newWordStrings.forEach((word, idx) => {
        const globalIdx = alreadyProcessed + idx;
        const wordData = { word, id: wordIdCounterRef.current++ };
        wordsWithIdsRef.current.push(wordData);
        
        // Calculate when this word SHOULD appear (absolute timing from speech start)
        const targetTime = globalIdx * msPerWord;
        // Delay = target - elapsed (but at least 0 for words that should already be visible)
        const delay = Math.max(0, targetTime - elapsedSinceSpeechStart);
        
        const capturedGlobalIdx = globalIdx; // Capture for closure
        const timeout = setTimeout(() => {
          const wordsToShow = wordsWithIdsRef.current.slice(0, capturedGlobalIdx + 1);
          const displayWordsWithIds = wordsToShow.slice(-maxWordsFor2Lines);
          const fullTextDisplay = wordsToShow.map(w => w.word).join(' ');
          
          setAssistantText(fullTextDisplay);
          setAssistantWords(displayWordsWithIds);
          lastTranscriptUpdateRef.current = Date.now();
          
          const i = wordDisplayTimeoutsRef.current.indexOf(timeout);
          if (i > -1) wordDisplayTimeoutsRef.current.splice(i, 1);
        }, delay);
        
        wordDisplayTimeoutsRef.current.push(timeout);
      });
      
      // Update the count of processed words
      processedWordCountRef.current = words.length;
      
      // Show first word immediately if this is the first batch
      if (alreadyProcessed === 0 && wordsWithIdsRef.current.length > 0) {
        const firstWord = wordsWithIdsRef.current[0];
        setAssistantText(firstWord.word);
        setAssistantWords([firstWord]);
        lastTranscriptUpdateRef.current = Date.now();
      }
      
      console.log('⏰ Scheduled', wordDisplayTimeoutsRef.current.length, 'word display timeouts');
    };

    const handleBotStartedSpeaking = () => {
      console.log('🤖 Bot started speaking');
      isSpeakingRef.current = true;
      setIsSpeaking(true);
      setIsUserSpeaking(false);
      isUserSpeakingRef.current = false;
      setIsWaitingForResponse(false);
      lastBotAudioActivityRef.current = Date.now();
      lastTranscriptUpdateRef.current = Date.now();
      
      // Always reset for new response at speech start
      resetForNewResponse();

      // Check if we have accumulated LLM text
      if (llmTextRef.current) {
        console.log('✅ LLM text available at speech start:', llmTextRef.current.substring(0, 50) + '...');
        useTtsFallbackRef.current = false;
        // Process the accumulated text - more may arrive later via streaming
        processNewLlmWords(llmTextRef.current);
      } else {
        // No LLM text yet - enable TTS fallback after a small delay
        // This gives LLM text a chance to arrive
        console.log('⏳ No LLM text at speech start → waiting briefly before TTS fallback');
        setTimeout(() => {
          // Only enable fallback if still no LLM text and still speaking
          if (!llmTextRef.current && isSpeakingRef.current && processedWordCountRef.current === 0) {
            console.log('⚠️ Enabling TTS fallback (no LLM text arrived)');
            useTtsFallbackRef.current = true;
          }
        }, 200);
      }
    };

    const handleBotStoppedSpeaking = () => {
      console.log('🤖 Bot stopped speaking');
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      setIsWaitingForResponse(true);
      setIsUserSpeaking(false);
      isUserSpeakingRef.current = false;
      lastBotAudioActivityRef.current = Date.now();
      useTtsFallbackRef.current = false;

      // IMPORTANT: Do NOT clear the wordDisplayTimeouts here.
      // Let scheduled timeouts complete so the remaining words are still displayed.
      
      // Calculate how long until all words are displayed, then clear transcript
      // to show "waiting for response..." state
      const totalWords = processedWordCountRef.current;
      const msPerWord = 250;
      const elapsedSinceSpeechStart = Date.now() - speechStartTimeRef.current;
      const totalDisplayTime = totalWords * msPerWord;
      const remainingDisplayTime = Math.max(0, totalDisplayTime - elapsedSinceSpeechStart);
      
      // Wait for all words to display + 2 seconds, then clear transcript
      const delayBeforeClear = remainingDisplayTime + 2000;
      
      console.log(`⏳ Will clear transcript in ${delayBeforeClear}ms (${remainingDisplayTime}ms for words + 2000ms pause)`);
      
      // Clear any existing timeout
      if (transcriptClearTimeoutRef.current) {
        clearTimeout(transcriptClearTimeoutRef.current);
      }
      
      transcriptClearTimeoutRef.current = setTimeout(() => {
        // Only clear if user hasn't started speaking (which would clear it anyway)
        if (!isSpeakingRef.current) {
          console.log('🧹 Clearing transcript to show waiting state');
          setAssistantText(null);
          setAssistantWords([]);
          lastTranscriptUpdateRef.current = Date.now();
        }
        transcriptClearTimeoutRef.current = null;
      }, delayBeforeClear);
    };

    const handleUserStartedSpeaking = () => {
      console.log('👤 User started speaking - setting isUserSpeaking to true');
      setIsWaitingForResponse(false);
      setIsUserSpeaking(true);
      isUserSpeakingRef.current = true;
      lastUserActivityRef.current = Date.now();
    };

    const handleUserStoppedSpeaking = () => {
      console.log('👤 User stopped speaking');
      lastUserActivityRef.current = Date.now();
      setTimeout(() => {
        if (!isSpeakingRef.current) {
          setIsUserSpeaking(false);
          setIsWaitingForResponse(false);
          isUserSpeakingRef.current = false;
        }
      }, 300);
    };

    // ============================================================
    // CAPTURE ASSISTANT TEXT: Listen for both LLM and TTS events
    // ============================================================
    const handleBotLlmText = (data: { text: string }) => {
      const llmText = data.text.trim();
      console.log('📝 Bot LLM text received:', llmText);

      // Accumulate text
      if (!llmTextRef.current) {
        llmTextRef.current = '';
      }
      if (llmTextRef.current && !llmTextRef.current.endsWith(' ')) {
        llmTextRef.current += ' ';
      }
      llmTextRef.current += llmText;

      // If bot is speaking, process new words immediately
      if (isSpeakingRef.current) {
        // If we were in TTS fallback mode, switch to LLM mode
        if (useTtsFallbackRef.current) {
          console.log('⚡ LLM text arrived while in TTS fallback → switching to LLM display');
          useTtsFallbackRef.current = false;
          // Reset state since we're switching from TTS to LLM
          wordsWithIdsRef.current = [];
          wordIdCounterRef.current = 0;
          processedWordCountRef.current = 0;
          wordDisplayTimeoutsRef.current.forEach(t => clearTimeout(t));
          wordDisplayTimeoutsRef.current = [];
          speechStartTimeRef.current = Date.now(); // Reset timing
        }
        
        // Process new words from the accumulated LLM text
        // This handles streaming - only new words will be scheduled
        console.log('🔄 Processing new LLM words while speaking');
        processNewLlmWords(llmTextRef.current);
      }
    };

    const handleBotTtsText = (data: { text: string }) => {
      const ttsText = data.text.trim();
      console.log('📝 Bot TTS text received (word-by-word):', ttsText);
      
      // ONLY process TTS text if:
      // 1. We're in TTS fallback mode (no LLM text available)
      // 2. Agent is currently speaking
      // This prevents duplicate display when LLM text is available
      if (useTtsFallbackRef.current && isSpeakingRef.current) {
        // TTS fallback mode - display words as they arrive
        // Reset for new response if needed
        if (isNewResponseRef.current) {
          isNewResponseRef.current = false;
          wordsWithIdsRef.current = [];
          wordIdCounterRef.current = 0;
        }
        
        // Split TTS text into words (it might be a phrase or sentence)
        const words = ttsText.split(/\s+/).filter(w => w.length > 0);
        
        words.forEach((word) => {
          const wordData = {
            word,
            id: wordIdCounterRef.current++,
          };
          
          wordsWithIdsRef.current.push(wordData);
          
          // Display immediately in real-time (no delay for TTS fallback)
          const maxWordsFor2Lines = 18;
          const displayWordsWithIds = wordsWithIdsRef.current.slice(-maxWordsFor2Lines);
          const fullTextDisplay = wordsWithIdsRef.current.map(w => w.word).join(' ');
          setAssistantText(fullTextDisplay);
          setAssistantWords(displayWordsWithIds);
          lastTranscriptUpdateRef.current = Date.now();
        });
      } else {
        // LLM text is available - IGNORE TTS text to prevent duplicates
        // TTS events will still fire, but we won't process them
        console.log('🚫 Ignoring TTS text (using LLM text instead)');
      }
    };

    // Clear text when user starts speaking (new conversation turn)
    const handleUserStartedSpeakingWithTextClear = () => {
      console.log('👤 User started speaking - clearing previous response');
      setIsWaitingForResponse(false);
      setIsUserSpeaking(true);
      isUserSpeakingRef.current = true;
      lastUserActivityRef.current = Date.now();

      // Clear UI transcript and global caches
      setAssistantText(null);
      setAssistantWords([]);
      wordsWithIdsRef.current = [];
      wordIdCounterRef.current = 0;
      processedWordCountRef.current = 0;
      isNewResponseRef.current = true;
      llmTextRef.current = null;
      useTtsFallbackRef.current = false;
      speechStartTimeRef.current = 0;

      // Clear scheduled timeouts for previous response
      wordDisplayTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      wordDisplayTimeoutsRef.current = [];
      
      // Clear transcript clear timeout
      if (transcriptClearTimeoutRef.current) {
        clearTimeout(transcriptClearTimeoutRef.current);
        transcriptClearTimeoutRef.current = null;
      }
    };

    // Listen to events
    console.log('📡 Setting up Pipecat event listeners');
    client.on('botStartedSpeaking', handleBotStartedSpeaking);
    client.on('botStoppedSpeaking', handleBotStoppedSpeaking);
    client.on('userStartedSpeaking', handleUserStartedSpeakingWithTextClear);
    client.on('userStoppedSpeaking', handleUserStoppedSpeaking);
    client.on('botLlmText', handleBotLlmText);
    client.on('botTtsText', handleBotTtsText);

    // Also try using RTVIEvent enum values as fallback
    try {
      const RTVIEvent = (client as any).constructor?.RTVIEvent;
      if (RTVIEvent) {
        console.log('📡 RTVIEvent enum available:', RTVIEvent);
      }
    } catch (e) {
      console.log('📡 Could not access RTVIEvent enum');
    }

    return () => {
      // Cleanup event listeners
      client.off('botStartedSpeaking', handleBotStartedSpeaking);
      client.off('botStoppedSpeaking', handleBotStoppedSpeaking);
      client.off('userStartedSpeaking', handleUserStartedSpeakingWithTextClear);
      client.off('userStoppedSpeaking', handleUserStoppedSpeaking);
      client.off('botLlmText', handleBotLlmText);
      client.off('botTtsText', handleBotTtsText);
      // Clear any pending timeouts
      wordDisplayTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      wordDisplayTimeoutsRef.current = [];
      // Clear transcript clear timeout
      if (transcriptClearTimeoutRef.current) {
        clearTimeout(transcriptClearTimeoutRef.current);
        transcriptClearTimeoutRef.current = null;
      }
    };
  }, [client]);

  // Setup audio visualizer and check Daily transport audio
  useEffect(() => {
    if (!isConnected || !client) {
      // Cleanup if not connected or client is null
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      setVolume(0);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setIsWaitingForResponse(false);
      isUserSpeakingRef.current = false;
      setIsUserSpeaking(false);
      lastBotAudioActivityRef.current = 0;
      lastUserActivityRef.current = 0;
      return;
    }

    // Try to access Daily transport's audio MediaStream for visualizer and debugging
    const setupAudioVisualizer = async () => {
      console.log('🎵 Setting up audio visualizer...');
      try {
        // Get the transport from the client
        const transport = (client as any).transport as DailyTransport;
        
        console.log('🔍 Transport found:', {
          hasTransport: !!transport,
          transportType: transport?.constructor?.name,
        });
        
        if (!transport) {
          console.warn('⚠️ Transport not found on client');
          return;
        }

        // Log all available properties on transport
        console.log('📋 Transport properties:', Object.keys(transport));
        
        // Try to access Daily's internal call object
        // DailyTransport may store it as _daily, _dailyCall, or call
        const dailyCall = (transport as any)._daily || 
                         (transport as any)._dailyCall || 
                         (transport as any).call ||
                         (transport as any)._dailyWrapper?.call;
        
        if (!dailyCall) {
          console.warn('⚠️ Daily call object not found. Waiting for connection...');
          // Wait a bit and try again
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryDailyCall = (transport as any)._daily || 
                                (transport as any)._dailyCall || 
                                (transport as any).call ||
                                (transport as any)._dailyWrapper?.call;
          if (!retryDailyCall) {
            console.error('❌ Daily call object still not found after retry');
            return;
          }
        }

        console.log('📞 Daily call object found:', {
          hasCall: !!dailyCall,
          roomName: (dailyCall as any).roomName,
          hasParticipants: typeof (dailyCall as any).participants === 'function',
        });

        // Function to get remote audio track from Daily call
        const getRemoteAudioTrack = (): MediaStreamTrack | null => {
          try {
            // Method 1: Get from participants
            if (typeof (dailyCall as any).participants === 'function') {
              const participants = (dailyCall as any).participants();
              console.log('👥 Participants:', Object.keys(participants));
              
              // Find remote participant (not local)
              for (const [participantId, participant] of Object.entries(participants as any)) {
                if (participant && (participant as any).local === false) {
                  const audioTrack = (participant as any).audioTrack;
                  if (audioTrack) {
                    console.log(`✅ Found remote audio track from participant: ${participantId}`);
                    return audioTrack;
                  }
                }
              }
            }

            // Method 2: Get from remoteMediaStream
            const remoteMediaStream = (dailyCall as any).remoteMediaStream;
            if (remoteMediaStream) {
              const audioTracks = remoteMediaStream.getAudioTracks();
              if (audioTracks.length > 0) {
                console.log(`✅ Found remote audio track from remoteMediaStream`);
                return audioTracks[0];
              }
            }

            // Method 3: Listen for participant-updated event
            // This will be handled by the event listener below
            return null;
          } catch (err) {
            console.error('❌ Error getting remote audio track:', err);
            return null;
          }
        };

        // Try to get audio track immediately
        let audioTrack = getRemoteAudioTrack();
        
        // If not found, wait and retry
        let attempts = 0;
        const maxAttempts = 20;
        while (!audioTrack && attempts < maxAttempts) {
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 500));
          audioTrack = getRemoteAudioTrack();
        }

        if (!audioTrack) {
          console.warn('⚠️ Remote audio track not found. Setting up listener for participant updates...');
          
          // Set up listener for when remote participant joins
          const handleParticipantUpdated = (event: any) => {
            console.log('📡 Participant updated event:', event);
            const participant = event?.participant;
            if (participant && !participant.local && participant.audioTrack) {
              console.log('✅ Remote audio track available from participant-updated event');
              setupAudioFromTrack(participant.audioTrack);
            }
          };

          const handleTrackStarted = (event: any) => {
            console.log('🎵 Track started event:', event);
            if (event?.track?.kind === 'audio' && !event?.participant?.local) {
              console.log('✅ Remote audio track started');
              setupAudioFromTrack(event.track);
            }
          };

          // Listen for participant updates
          if (typeof (dailyCall as any).on === 'function') {
            (dailyCall as any).on('participant-updated', handleParticipantUpdated);
            (dailyCall as any).on('track-started', handleTrackStarted);
            (dailyCall as any).on('track-stopped', (event: any) => {
              console.log('⏹️ Track stopped event:', event);
            });
          }
          
          // Also check periodically for new participants (fallback)
          const checkInterval = setInterval(() => {
            const newTrack = getRemoteAudioTrack();
            if (newTrack && newTrack.id !== audioTrack?.id) {
              console.log('✅ Found new remote audio track via polling');
              clearInterval(checkInterval);
              setupAudioFromTrack(newTrack);
            }
          }, 1000);
          
          // Clear interval after 30 seconds
          setTimeout(() => {
            clearInterval(checkInterval);
          }, 30000);
          
          // Fallback visualizer while waiting
          setupFallbackVisualizer();
          return;
        }

        // Setup audio visualizer from the track
        setupAudioFromTrack(audioTrack);

        async function setupAudioFromTrack(track: MediaStreamTrack) {
          try {
            console.log('🔊 Setting up audio from MediaStreamTrack:', {
              id: track.id,
              kind: track.kind,
              enabled: track.enabled,
              muted: track.muted,
              readyState: track.readyState,
            });

            // Create MediaStream from track
            const mediaStream = new MediaStream([track]);
            
            // IMPORTANT: Create an HTML audio element to play the MediaStream
            // Daily.co may not automatically play audio, so we need to do it explicitly
            const audioElement = document.createElement('audio');
            audioElement.autoplay = true;
            audioElement.setAttribute('playsinline', 'true'); // For mobile browsers
            audioElement.muted = false;
            audioElement.volume = 1.0;
            audioElement.srcObject = mediaStream;
            audioElement.setAttribute('data-pipecat-remote-audio', 'true');
            audioElement.style.display = 'none'; // Hide the element
            document.body.appendChild(audioElement);
            
            // Try to play the audio
            try {
              await audioElement.play();
              console.log('✅ Audio element playing');
            } catch (playErr: any) {
              console.warn('⚠️ Could not autoplay audio (may need user interaction):', playErr.message);
              // Try to play on user interaction
              const playOnInteraction = async () => {
                try {
                  await audioElement.play();
                  console.log('✅ Audio started playing after user interaction');
                  document.removeEventListener('click', playOnInteraction);
                  document.removeEventListener('touchstart', playOnInteraction);
                } catch (e) {
                  console.error('❌ Still could not play audio:', e);
                }
              };
              document.addEventListener('click', playOnInteraction, { once: true });
              document.addEventListener('touchstart', playOnInteraction, { once: true });
            }
            
            // Monitor audio element
            audioElement.addEventListener('playing', () => {
              console.log('✅ Audio element is playing - visualization should work now');
            });
            
            audioElement.addEventListener('play', () => {
              console.log('▶️ Audio element started playing');
            });
            
            audioElement.addEventListener('pause', () => {
              console.warn('⏸️ Audio element paused - visualization may not work');
            });
            
            // Check if audio is actually playing before starting visualizer
            const checkAudioPlaying = setInterval(() => {
              if (!audioElement.paused && audioElement.readyState >= 2) {
                console.log('✅ Audio confirmed playing, readyState:', audioElement.readyState);
                clearInterval(checkAudioPlaying);
              } else {
                console.warn('⚠️ Audio not playing yet:', {
                  paused: audioElement.paused,
                  readyState: audioElement.readyState,
                  srcObject: !!audioElement.srcObject
                });
              }
            }, 500);
            
            // Clear after 10 seconds
            setTimeout(() => clearInterval(checkAudioPlaying), 10000);
            audioElement.addEventListener('pause', () => {
              console.warn('⏸️ Audio element paused');
            });
            audioElement.addEventListener('loadedmetadata', () => {
              console.log('📥 Audio metadata loaded:', {
                duration: audioElement.duration,
                readyState: audioElement.readyState,
              });
            });
            audioElement.addEventListener('canplay', () => {
              console.log('✅ Audio can play');
            });
            audioElement.addEventListener('playing', () => {
              console.log('🎵 Audio is playing');
            });
            audioElement.addEventListener('waiting', () => {
              console.warn('⏳ Audio waiting for data');
            });
            audioElement.addEventListener('error', (e) => {
              console.error('❌ Audio element error:', e, audioElement.error);
            });
            
            // Log audio element state periodically
            audioStateIntervalRef.current = setInterval(() => {
              console.log('🔊 Audio element state:', {
                paused: audioElement.paused,
                muted: audioElement.muted,
                volume: audioElement.volume,
                readyState: audioElement.readyState,
                currentTime: audioElement.currentTime,
                duration: audioElement.duration,
                srcObject: !!audioElement.srcObject,
                hasTracks: mediaStream.getAudioTracks().length,
                trackEnabled: track.enabled,
                trackMuted: track.muted,
                trackReadyState: track.readyState,
              });
            }, 2000);
            
            // Clear interval when track ends
            track.addEventListener('ended', () => {
              if (audioStateIntervalRef.current) {
                clearInterval(audioStateIntervalRef.current);
                audioStateIntervalRef.current = null;
              }
            });
            
            // Create audio context for visualization
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass();
            
            // Resume audio context if suspended (browsers require user interaction)
            if (audioContextRef.current.state === 'suspended') {
              console.log('⏸️ AudioContext is suspended, attempting to resume...');
              try {
                await audioContextRef.current.resume();
                console.log('✅ AudioContext resumed successfully');
              } catch (resumeErr) {
                console.warn('⚠️ Could not resume AudioContext:', resumeErr);
              }
            }
            
            // IMPORTANT: Use createMediaStreamSource instead of createMediaElementSource
            // This directly analyzes the MediaStream, which is more reliable
            // The MediaStream can be used by both the audio element (for playback) and the analyzer (for visualization)
            
            // Verify MediaStream has active tracks
            const audioTracks = mediaStream.getAudioTracks();
            console.log('🎵 MediaStream audio tracks:', {
              count: audioTracks.length,
              tracks: audioTracks.map(t => ({
                id: t.id,
                enabled: t.enabled,
                muted: t.muted,
                readyState: t.readyState,
                label: t.label
              }))
            });
            
            if (audioTracks.length === 0) {
              console.error('❌ No audio tracks in MediaStream!');
              setError('No audio tracks available for visualization');
              return;
            }
            
            const source = audioContextRef.current.createMediaStreamSource(mediaStream);
            const analyzer = audioContextRef.current.createAnalyser();
            analyzer.fftSize = 256;
            analyzer.smoothingTimeConstant = 0.8; // Smooth the visualization
            analyzerRef.current = analyzer;
            
            // Connect: source -> analyzer
            // We don't connect analyzer to destination to avoid double audio playback
            // The audio element already handles playback
            source.connect(analyzer);
            
            console.log('✅ Audio analyzer connected to MediaStream, AudioContext state:', audioContextRef.current.state);
            console.log('📊 Analyzer settings:', {
              fftSize: analyzer.fftSize,
              frequencyBinCount: analyzer.frequencyBinCount,
              smoothingTimeConstant: analyzer.smoothingTimeConstant
            });
            
            console.log('✅ Audio analyzer connected, AudioContext state:', audioContextRef.current.state);
            
            // Monitor track state
            track.addEventListener('ended', () => {
              console.warn('⏹️ Audio track ended');
              setIsSpeaking(false);
              setVolume(0);
              if (audioStateIntervalRef.current) {
                clearInterval(audioStateIntervalRef.current);
                audioStateIntervalRef.current = null;
              }
            });
            
            track.addEventListener('mute', () => {
              console.warn('🔇 Audio track muted');
            });
            
            track.addEventListener('unmute', () => {
              console.log('🔊 Audio track unmuted');
            });
            
            // Store audio element reference for cleanup
            (audioElement as any)._pipecatTrack = track;
            
            // Monitor audio context state
            audioContextRef.current.addEventListener('statechange', () => {
              console.log('🎵 AudioContext state changed:', audioContextRef.current?.state);
            });
            
            // Start visualizer loop
            const dataArray = new Uint8Array(analyzer.frequencyBinCount);
            let frameCount = 0;
            const update = () => {
              if (!analyzerRef.current || !audioContextRef.current) {
                console.warn('⚠️ Analyzer or AudioContext is null, stopping visualizer');
                return;
              }
              
              // Check audio context state periodically
              if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume().catch(console.error);
              }
              
              try {
                analyzerRef.current.getByteFrequencyData(dataArray);
                
                let sum = 0;
                let maxVal = 0;
                for (let i = 0; i < dataArray.length; i++) {
                  sum += dataArray[i];
                  if (dataArray[i] > maxVal) maxVal = dataArray[i];
                }
                const avg = sum / dataArray.length;
                
                // Debug logging (first 10 frames, then every 60 frames ~1 second at 60fps)
                frameCount++;
                if (frameCount <= 10 || frameCount % 60 === 0) {
                  console.log('🎵 Audio visualization data:', { 
                    avg: avg.toFixed(2), 
                    max: maxVal, 
                    volume: volume.toFixed(2),
                    contextState: audioContextRef.current.state 
                  });
                }
                
                setVolume(avg);

                // Fallback: detect bot speech from audio energy in case events drop
                const now = Date.now();
                const botAudioThreshold = 12; // small, smoothed average; tuned to stay above background noise
                if (avg > botAudioThreshold) {
                  lastBotAudioActivityRef.current = now;
                }

                // If we see sustained audio without a botStarted event, force speaking state
                if (!isSpeakingRef.current && !isUserSpeakingRef.current && avg > botAudioThreshold) {
                  console.warn('🔊 Forcing bot speaking state from audio activity');
                  isSpeakingRef.current = true;
                  setIsSpeaking(true);
                  setIsWaitingForResponse(false);
                  setIsUserSpeaking(false);
                  isUserSpeakingRef.current = false;
                }

                // If we have been in speaking state but audio has been silent for a while, force stop
                const silenceDuration = now - lastBotAudioActivityRef.current;
                if (isSpeakingRef.current && silenceDuration > 3500) {
                  console.warn('⏱️ Forcing bot stopped state after audio silence');
                  isSpeakingRef.current = false;
                  setIsSpeaking(false);
                  setIsWaitingForResponse(true);
                  setIsUserSpeaking(false);
                  isUserSpeakingRef.current = false;
                  if (!transcriptClearTimeoutRef.current) {
                    transcriptClearTimeoutRef.current = setTimeout(() => {
                      if (!isSpeakingRef.current) {
                        setAssistantText(null);
                        setAssistantWords([]);
                        lastTranscriptUpdateRef.current = Date.now();
                      }
                      transcriptClearTimeoutRef.current = null;
                    }, 1500);
                  }
                }
                
                // Note: Volume here is from bot's audio, not user's mic
                // User speaking detection relies on Pipecat events
                // Volume is only used for visualizer
                
                animationFrameRef.current = requestAnimationFrame(update);
              } catch (err) {
                console.error('❌ Error in visualizer loop:', err);
              }
            };
            update();
            console.log('✅ Audio visualizer started');
          } catch (err) {
            console.error('❌ Error setting up audio from track:', err);
            setError('Audio setup failed: ' + (err as Error).message);
          }
        }

        function setupFallbackVisualizer() {
          console.log('⚠️ Using fallback visualizer (no audio input)');
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
          const analyzer = audioContextRef.current.createAnalyser();
          analyzer.fftSize = 256;
          analyzerRef.current = analyzer;
          
          const dataArray = new Uint8Array(analyzer.frequencyBinCount);
          const update = () => {
            if (!analyzerRef.current) return;
            // Simulate volume for visual effect
            setVolume(Math.random() * 20 + 5);
            setIsSpeaking(false);
            animationFrameRef.current = requestAnimationFrame(update);
          };
          update();
        }
      } catch (err) {
        console.error('❌ Could not setup audio visualizer:', err);
        setError('Audio setup failed: ' + (err as Error).message);
      }
    };

    setupAudioVisualizer();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (audioStateIntervalRef.current) {
        clearInterval(audioStateIntervalRef.current);
        audioStateIntervalRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      // Clean up any audio elements we created
      const audioElements = document.querySelectorAll('audio[data-pipecat-remote-audio]');
      audioElements.forEach(el => {
        const audioEl = el as HTMLAudioElement;
        audioEl.pause();
        audioEl.srcObject = null;
        audioEl.remove();
      });
      setVolume(0);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
      setIsWaitingForResponse(false);
      isUserSpeakingRef.current = false;
      setIsUserSpeaking(false);
      lastBotAudioActivityRef.current = 0;
      lastUserActivityRef.current = 0;
    };
  }, [isConnected, client]);

  // Safety net: periodically reset stuck flags and clear stale transcript
  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();

      // Auto-reset user speaking if no activity seen recently
      if (isUserSpeakingRef.current && now - lastUserActivityRef.current > 3000) {
        console.warn('⏱️ Clearing stale user speaking state');
        isUserSpeakingRef.current = false;
        setIsUserSpeaking(false);
        if (!isSpeakingRef.current) {
          setIsWaitingForResponse(false);
        }
      }

      // Clear stale transcript if it hasn't changed in a while and no one is speaking
      if (
        !isSpeakingRef.current &&
        !isUserSpeakingRef.current &&
        assistantWords.length > 0 &&
        now - lastTranscriptUpdateRef.current > 8000
      ) {
        console.warn('🧹 Clearing stale transcript due to inactivity');
        setAssistantText(null);
        setAssistantWords([]);
        lastTranscriptUpdateRef.current = now;
      }
    }, 1000);

    fallbackMonitorIntervalRef.current = intervalId;
    return () => {
      clearInterval(intervalId);
      fallbackMonitorIntervalRef.current = null;
    };
  }, [assistantWords.length]);


  const connect = useCallback(
    async (agent: AgentProfile) => {
      if (!client) {
        setError('Pipecat client is not initialized');
        return;
      }

      // Prevent duplicate connection attempts
      if (isConnectingRef.current) {
        console.log('⏭️ Connection already in progress, skipping duplicate call');
        return;
      }

      // Prevent connecting if already connected
      if (isConnected) {
        console.log('⏭️ Already connected, skipping duplicate call');
        return;
      }

      isConnectingRef.current = true;
      setError(null);

      try {
        // Use Vite-defined environment variable (from vite.config.ts)
        const apiBaseUrl = (process.env.API_BASE_URL as string) || 'http://localhost:3001';
        // Pass agent data as query parameters to avoid Pipecat client filtering them
        const params = new URLSearchParams({
          voiceAgentName: agent.id,
          systemInstruction: agent.systemInstruction,
          voiceName: agent.voiceName,
        });
        const endpoint = `${apiBaseUrl}/api/connect?${params.toString()}`;
        
        console.log('🔌 Connecting to Pipecat:', {
          endpoint,
          agentId: agent.id,
          agentName: agent.name,
        });
        
        // Pass minimal requestData - agent data is passed via query parameters
        // The server will extract these from query params and include in body sent to Pipecat Cloud
        await client.startBotAndConnect({
          endpoint,
          requestData: {},
        });
        
        console.log('✅ Connection initiated, waiting for transport state...');
      } catch (err: any) {
        console.error('❌ Connection error:', err);
        setError(err.message || 'Failed to connect to agent');
        isConnectingRef.current = false; // Reset on error
      }
      // Note: isConnectingRef will be reset when connection completes (connected state changes)
    },
    [client, isConnected]
  );

  const disconnect = useCallback(async () => {
    if (!client) {
      return;
    }

    isConnectingRef.current = false; // Reset connecting flag on disconnect

    try {
      await client.disconnect();
      setIsSpeaking(false);
      setIsUserSpeaking(false);
      isSpeakingRef.current = false;
      isUserSpeakingRef.current = false;
      setIsWaitingForResponse(false);
      setVolume(0);
      setError(null);
      setAssistantText(null);
      setAssistantWords([]);
      wordsWithIdsRef.current = [];
      wordIdCounterRef.current = 0;
      processedWordCountRef.current = 0;
      llmTextRef.current = null;
      useTtsFallbackRef.current = false;
      speechStartTimeRef.current = 0;
      lastBotAudioActivityRef.current = 0;
      lastUserActivityRef.current = 0;
      lastTranscriptUpdateRef.current = 0;
      // Clear any pending timeouts
      wordDisplayTimeoutsRef.current.forEach(t => clearTimeout(t));
      wordDisplayTimeoutsRef.current = [];
      // Clear transcript clear timeout
      if (transcriptClearTimeoutRef.current) {
        clearTimeout(transcriptClearTimeoutRef.current);
        transcriptClearTimeoutRef.current = null;
      }
    } catch (err: any) {
      console.error('Disconnect error:', err);
      setError(err.message || 'Failed to disconnect');
    }
  }, [client]);

  return {
    isConnected,
    isSpeaking,
    isUserSpeaking,
    isWaitingForResponse,
    volume,
    connect,
    disconnect,
    error,
    assistantText,
    assistantWords,
  };
};

