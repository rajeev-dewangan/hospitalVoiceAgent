export enum AgentType {
  ALLERGY = 'ALLERGY',
  DERMATOLOGIST = 'DERMATOLOGIST',
  GENERAL_PHYSICIAN = 'GENERAL_PHYSICIAN',
  NEUROLOGY = 'NEUROLOGY',
  UROLOGY = 'UROLOGY',
  PHYSICAL_THERAPIST = 'PHYSICAL_THERAPIST',
  CARDIOVASCULAR = 'CARDIOVASCULAR'
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
  phoneNumber?: string; // User's phone number from form
  userName?: string; // User's name from form
}

export type AudioBlob = {
  data: string;
  mimeType: string;
};

