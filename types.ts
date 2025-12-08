export enum SectionType {
  FREE = 'FREE',
  VIP = 'VIP'
}

export interface Prediction {
  homeTeam: string;
  awayTeam: string;
  league: string;
  prediction: string;
  odds: number;
  confidence: number; // 0 to 100
  analysis: string;
  kickoffTime: string;
  riskLevel: 'Low' | 'Medium' | 'High';
}

export interface Source {
  title: string;
  url: string;
}

export interface PredictionResponse {
  predictions: Prediction[];
  sources: Source[];
}

export interface VipCode {
  code: string;
  predictions: number;
  active: boolean;
  assignedTo: string | null;
  usedPredictions: number;
  createdAt: number;
}

export interface UserPremiumStatus {
  role: 'free' | 'vip' | 'admin';
  unlockedAt?: number;
  code?: string;
  predictionsLeft?: number;
}