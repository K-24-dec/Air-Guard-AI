export interface Pollutants {
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  co: number;
  so2: number;
}

export interface Weather {
  temp: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
}

export interface ForecastDay {
  day: string;
  aqi: number;
  temp: number;
  humidity: number;
}

export interface HealthAdvisor {
  general: string;
  children: string;
  elderly: string;
  pregnant: string;
  athletes: string;
  asthma: string;
}

export interface EmergencyMode {
  isSevere: boolean;
  warningBanner: string;
  precautions: string[];
}

export interface AIInsights {
  dailySummary: string;
  aqiExplainer: string;
  healthAdvisor: HealthAdvisor;
  weeklyReport: string;
  predictionExplanation: string;
  ecoTip: string;
  emergencyMode: EmergencyMode;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
}
