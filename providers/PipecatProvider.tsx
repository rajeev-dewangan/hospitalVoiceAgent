'use client';

import { PipecatClient } from '@pipecat-ai/client-js';
import { DailyTransport } from '@pipecat-ai/daily-transport';
import { PipecatClientProvider } from '@pipecat-ai/client-react';
import { ReactNode, useEffect, useState } from 'react';
import { VoiceAgentName } from '../types';

interface VoiceAgentProviderProps {
  children: ReactNode;
  agentName: VoiceAgentName;
}

export function VoiceAgentProvider({ children, agentName }: VoiceAgentProviderProps) {
  const [client, setClient] = useState<PipecatClient | null>(null);

  useEffect(() => {
    console.log(`Setting up Transport and Client for ${agentName}`);
    const transport = new DailyTransport();

    const pipecatClient = new PipecatClient({
      transport,
      enableMic: true,
      enableCam: false,
    });

    setClient(pipecatClient);

    // Cleanup on unmount
    return () => {
      if (pipecatClient) {
        pipecatClient.disconnect().catch(console.error);
      }
    };
  }, [agentName]);

  if (!client) {
    return null;
  }

  return (
    <PipecatClientProvider client={client}>{children}</PipecatClientProvider>
  );
}

