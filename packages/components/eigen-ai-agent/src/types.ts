export interface EigenAIChatOptions {
  model?: string;
  systemPrompt?: string;
  temperature?: number;
}

export interface EigenAIChatResult {
  content: string;
  signature?: string;
  rawOutput?: string;
  model?: string;
  chainId?: number;
}

