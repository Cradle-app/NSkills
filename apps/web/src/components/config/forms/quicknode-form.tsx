'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Info, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import QuicknodeLogo from '@/assets/blocks/Quicknode.svg';
import { cn } from '@/lib/utils';
import {
  formStyles,
  labelStyles,
  cardStyles,
} from './shared-styles';

type QuicknodeServiceId =
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

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const QUICKNODE_SERVICES: { id: QuicknodeServiceId; name: string }[] = [
  { id: 'core-rpc', name: 'Core RPC API' },
  { id: 'webhooks', name: 'Webhooks' },
  { id: 'streams', name: 'Streams' },
  { id: 'ipfs', name: 'IPFS' },
  { id: 'key-value-store', name: 'Key-Value Store' },
  { id: 'custom-rpc', name: 'Custom RPC Options' },
  { id: 'token-api', name: 'Token API' },
  { id: 'nft-api', name: 'NFT API' },
  { id: 'marketplace', name: 'Marketplace' },
  { id: 'sdk', name: 'Quicknode SDK' },
  { id: 'console-api', name: 'Console API' },
];

const QUICKNODE_SERVICE_INSTRUCTIONS: Record<
  QuicknodeServiceId,
  { title: string; steps: string[]; security?: string }
> = {
  'core-rpc': {
    title: 'Core RPC API Setup',
    steps: [
      'Go to dashboard.quicknode.com/endpoints and sign in.',
      'Click "Create Endpoint" and select your chain (e.g., Ethereum, Arbitrum, Base).',
      'Copy your endpoint URL: https://{name}.quiknode.pro/{token}/',
      'Use with ethers: new ethers.JsonRpcProvider(endpointUrl)',
      'Or use the Quicknode SDK: import { Core } from "@quicknode/sdk"; const core = new Core({ endpointUrl });',
    ],
  },
  webhooks: {
    title: 'Webhooks Setup',
    steps: [
      'Go to dashboard.quicknode.com/webhooks and click "Create Webhook".',
      'Select the blockchain network you want to monitor.',
      'Define your filter (Wallet transfers, Contract events, or custom template).',
      'Test the filter with a block number to verify events.',
      'Set your webhook URL where Quicknode will POST events.',
      'Enable HMAC verification for security (recommended).',
      'Optional: IP allowlist 141.148.40.227 for additional security.',
    ],
    security: 'Pricing: 30 API credits per payload delivered.',
  },
  streams: {
    title: 'Streams Setup',
    steps: [
      'Access dashboard.quicknode.com/streams in Quicknode Developer Portal.',
      'Create a new stream and select your chain and dataset (blocks, receipts, traces).',
      'Configure JavaScript filters to process data server-side before delivery.',
      'Set your destination (storage, webhook, or indexing system).',
      'Choose batch size for historical backfill or real-time tip streaming.',
      'Stream lifecycle: Active, Paused, Completed, or Terminated.',
    ],
  },
  ipfs: {
    title: 'IPFS Setup',
    steps: [
      'REST API endpoint: https://api.quicknode.com/ipfs/rest',
      'Generate an API key from dashboard.quicknode.com/api-keys.',
      'Include x-api-key header in all requests.',
      'Use Account API for usage metrics, Pinning API for content, Gateway API for retrieval.',
    ],
  },
  'key-value-store': {
    title: 'Key-Value Store Setup',
    steps: [
      '1. Manage large-scale datasets (e.g., wallet addresses) via REST API.',
      '2. Integrate with Streams filters for real-time data updates.',
      '3. Access via Quicknode API with your API key.',
    ],
  },
  'custom-rpc': {
    title: 'Custom RPC Options',
    steps: [
      '1. Contact Quicknode for Fully Dedicated or Hybrid Dedicated gRPC setups.',
      '2. Enterprise solutions for latency-sensitive workloads.',
      '3. Unmatched performance and isolation for high-volume applications.',
    ],
  },
  'token-api': {
    title: 'Token API Setup',
    steps: [
      '1. Fetch token metadata and balances via Quicknode add-ons.',
      '2. Use marketplace or REST APIs for token data.',
      '3. Requires Quicknode endpoint and optional API key.',
    ],
  },
  'nft-api': {
    title: 'NFT API Setup',
    steps: [
      '1. Fetch NFT metadata and ownership via Quicknode add-ons.',
      '2. Use marketplace or REST APIs for NFT data.',
      '3. Requires Quicknode endpoint and optional API key.',
    ],
  },
  marketplace: {
    title: 'Marketplace Setup',
    steps: [
      '1. Browse [Quicknode Marketplace](https://www.quicknode.com/docs/marketplace) for add-ons.',
      '2. Add-ons extend Quicknode services (e.g., Token API, NFT API).',
      '3. Enable add-ons from your endpoint dashboard.',
    ],
  },
  sdk: {
    title: 'Quicknode SDK Setup',
    steps: [
      '1. Install: npm install @quicknode/sdk',
      '2. import { Core } from "@quicknode/sdk"',
      '3. const core = new Core({ endpointUrl: "https://{name}.quiknode.pro/{token}/" });',
      '4. core.client.getBlockNumber() - supports Core RPC and add-on methods.',
    ],
  },
  'console-api': {
    title: 'Console API Setup',
    steps: [
      '1. Manage your account and endpoints programmatically.',
      '2. Use REST API with your API key for account operations.',
      '3. Create, update, and manage endpoints via API.',
    ],
  },
};

export function QuicknodeForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const selectedService = (config.selectedService as QuicknodeServiceId) || 'core-rpc';
  const instructions = QUICKNODE_SERVICE_INSTRUCTIONS[selectedService];

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  return (
    <div className={formStyles.container}>
      <div
        className={cn(
          'flex items-start gap-3 p-3.5 rounded-xl',
          'bg-gradient-to-r from-[hsl(var(--color-accent-primary)/0.08)] via-[hsl(var(--color-bg-muted)/0.5)] to-transparent',
          'border border-[hsl(var(--color-accent-primary)/0.15)]'
        )}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-[hsl(var(--color-accent-primary)/0.12)] border border-[hsl(var(--color-accent-primary)/0.2)]">
          <Image src={QuicknodeLogo} alt="Quicknode" width={24} height={24} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--color-text-primary))]">Quicknode</h3>
          <p className="text-[11px] text-[hsl(var(--color-text-muted))] mt-0.5 leading-relaxed">
            Multi-chain API for 77+ blockchains: RPC, Webhooks, Streams, IPFS, and more.
          </p>
        </div>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>
          <Globe className={labelStyles.icon} /> Service
        </label>
        <Select
          value={selectedService}
          onValueChange={(v) => updateConfig('selectedService', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                <Image src={QuicknodeLogo} alt="" width={16} height={16} className="rounded" />
                <span>{QUICKNODE_SERVICES.find((s) => s.id === selectedService)?.name ?? selectedService}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {QUICKNODE_SERVICES.map((svc) => (
              <SelectItem key={svc.id} value={svc.id}>
                <div className="flex items-center gap-2">
                  <Image src={QuicknodeLogo} alt="" width={16} height={16} className="rounded" />
                  <span>{svc.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={cn(cardStyles.base, 'space-y-3')}>
        <h4 className="text-xs font-semibold text-[hsl(var(--color-text-primary))]">
          {instructions.title}
        </h4>
        <ol className="space-y-2 text-[11px] text-[hsl(var(--color-text-muted))] leading-relaxed list-decimal list-inside">
          {instructions.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        {instructions.security && (
          <p className="text-[10px] text-[hsl(var(--color-text-disabled))]">
            {instructions.security}
          </p>
        )}
      </div>

      <div className={cn(cardStyles.info)}>
        <div className="flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[hsl(var(--color-info))] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[10px] text-[hsl(var(--color-info))] leading-relaxed">
              When you click Build, your generated repo will include the @cradle/quicknode package with getQuicknodeProvider, quicknodeIpfsPin, verifyQuicknodeWebhookSignature, and quicknodeKeyValueGet/Set helpers, plus QUICKNODE_ENDPOINT_URL and QUICKNODE_API_KEY environment variables.
            </p>
            <a
              href="https://www.quicknode.com/docs/welcome"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline flex items-center gap-1"
            >
              Quicknode Docs <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
