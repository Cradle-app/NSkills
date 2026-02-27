import { createPublicClient, http } from 'viem';
import type {
  QuicknodeProviderOptions,
  QuicknodeIpfsPinOptions,
  QuicknodeIpfsPinResult,
  QuicknodeWebhookVerifyOptions,
  QuicknodeKeyValueOptions,
} from './types';
import { QUICKNODE_IPFS_BASE, QUICKNODE_API_BASE } from './constants';

const DEFAULT_ENDPOINT =
  typeof process !== 'undefined' && process.env?.QUICKNODE_ENDPOINT_URL
    ? process.env.QUICKNODE_ENDPOINT_URL
    : '';

const DEFAULT_API_KEY =
  typeof process !== 'undefined' && process.env?.QUICKNODE_API_KEY
    ? process.env.QUICKNODE_API_KEY
    : '';

export function getQuicknodeProvider(options?: QuicknodeProviderOptions) {
  const endpointUrl = options?.endpointUrl ?? DEFAULT_ENDPOINT;
  if (!endpointUrl) {
    throw new Error(
      'QUICKNODE_ENDPOINT_URL is not set. Add it to your environment or pass endpointUrl to getQuicknodeProvider().'
    );
  }
  return createPublicClient({
    transport: http(endpointUrl),
  });
}

export async function quicknodeIpfsPin(
  options: QuicknodeIpfsPinOptions
): Promise<QuicknodeIpfsPinResult> {
  const apiKey = options.apiKey ?? DEFAULT_API_KEY;
  if (!apiKey) {
    throw new Error(
      'QUICKNODE_API_KEY is not set. Add it for IPFS operations or pass apiKey to quicknodeIpfsPin().'
    );
  }

  const content =
    typeof options.content === 'string'
      ? new TextEncoder().encode(options.content)
      : new Uint8Array(options.content);

  const formData = new FormData();
  formData.append('file', new Blob([content]), 'content');

  const response = await fetch(`${QUICKNODE_IPFS_BASE}/v1/account/pins`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Quicknode IPFS pin failed: ${response.status} ${errText}`);
  }

  const data = (await response.json()) as { cid?: string; size?: number };
  return { cid: data.cid ?? '', size: data.size };
}

export function verifyQuicknodeWebhookSignature(
  options: QuicknodeWebhookVerifyOptions
): boolean {
  const { payload, signature, nonce, timestamp, secretKey } = options;
  if (!nonce || !timestamp || !signature || !secretKey) return false;

  const signatureData = nonce + timestamp + payload;
  try {
    const nodeCrypto = require('crypto');
    const hmac = nodeCrypto.createHmac('sha256', Buffer.from(secretKey, 'utf8'));
    hmac.update(Buffer.from(signatureData, 'utf8'));
    const computed = hmac.digest('hex');
    return (
      signature.length === computed.length &&
      nodeCrypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(computed, 'hex')
      )
    );
  } catch {
    return false;
  }
}

export async function verifyQuicknodeWebhookSignatureAsync(
  options: QuicknodeWebhookVerifyOptions
): Promise<boolean> {
  const { payload, signature, nonce, timestamp, secretKey } = options;
  if (!nonce || !timestamp || !signature || !secretKey) return false;

  const signatureData = nonce + timestamp + payload;
  try {
    const nodeCrypto = require('crypto');
    const hmac = nodeCrypto.createHmac('sha256', Buffer.from(secretKey, 'utf8'));
    hmac.update(Buffer.from(signatureData, 'utf8'));
    const computed = hmac.digest('hex');
    return (
      signature.length === computed.length &&
      nodeCrypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(computed, 'hex')
      )
    );
  } catch {
    return false;
  }
}

export async function quicknodeKeyValueGet(
  key: string,
  options?: QuicknodeKeyValueOptions
): Promise<unknown> {
  const apiKey = options?.apiKey ?? DEFAULT_API_KEY;
  const baseUrl = options?.baseUrl ?? QUICKNODE_API_BASE;
  if (!apiKey) {
    throw new Error(
      'QUICKNODE_API_KEY is required for Key-Value Store. Add it to your environment.'
    );
  }

  const res = await fetch(`${baseUrl}/storage/v1/keys/${encodeURIComponent(key)}`, {
    headers: { 'x-api-key': apiKey },
  });
  if (!res.ok) {
    if (res.status === 404) return null;
    const err = await res.text().catch(() => '');
    throw new Error(`Quicknode KV get failed: ${res.status} ${err}`);
  }
  return res.json();
}

export async function quicknodeKeyValueSet(
  key: string,
  value: unknown,
  options?: QuicknodeKeyValueOptions
): Promise<void> {
  const apiKey = options?.apiKey ?? DEFAULT_API_KEY;
  const baseUrl = options?.baseUrl ?? QUICKNODE_API_BASE;
  if (!apiKey) {
    throw new Error(
      'QUICKNODE_API_KEY is required for Key-Value Store. Add it to your environment.'
    );
  }

  const res = await fetch(`${baseUrl}/storage/v1/keys/${encodeURIComponent(key)}`, {
    method: 'PUT',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Quicknode KV set failed: ${res.status} ${err}`);
  }
}
