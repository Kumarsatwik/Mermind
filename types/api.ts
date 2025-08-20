export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: Date;
    processingTime: number;
    requestId: string;
  };
}

export interface AIModelConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey?: string;
  baseUrl?: string;
}

export interface GroqConfig extends AIModelConfig {
  model: "llama-3.1-8b-instant";
}

export interface DeepSeekConfig extends AIModelConfig {
  model: "deepseek-chat";
  baseUrl: "https://api.deepseek.com";
}
