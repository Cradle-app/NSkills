export type QuicknodeServiceId =
  | 'core-rpc'
  | 'webhooks'
  | 'streams'
  | 'ipfs'
  | 'key-value-store'
  | 'custom-rpc'
  | 'token-api'
  | 'nft-api'
  | 'marketplace'
  | 'sdk'
  | 'console-api';

export interface QuicknodeProviderOptions {
  endpointUrl?: string;
}

export interface QuicknodeIpfsPinOptions {
  content: string | ArrayBuffer;
  apiKey?: string;
}

export interface QuicknodeIpfsPinResult {
  cid: string;
  size?: number;
}

export interface QuicknodeWebhookVerifyOptions {
  payload: string;
  signature: string;
  nonce: string;
  timestamp: string;
  secretKey: string;
}

export interface QuicknodeKeyValueOptions {
  apiKey?: string;
  baseUrl?: string;
}
