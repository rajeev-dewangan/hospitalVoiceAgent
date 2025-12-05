export enum AgentType {
  TRACKING = 'TRACKING',
  SUPPORT = 'SUPPORT',
  SCHEDULING = 'SCHEDULING'
}

export type VoiceAgentName = AgentType;

export interface AgentProfile {
  id: AgentType;
  name: string;
  role: string;
  description: string;
  avatarUrl: string;
  systemInstruction: string;
  voiceName: string;
}

export type AudioBlob = {
  data: string;
  mimeType: string;
};
