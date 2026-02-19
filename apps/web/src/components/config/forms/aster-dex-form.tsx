'use client';

import { ExternalLink, TrendingUp, FileCode, Server, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormHeader, cardStyles, formStyles, labelStyles, linkStyles, codeStyles } from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

type EndpointMethod = 'GET' | 'POST';

type EndpointReference = {
  path: string;
  method: EndpointMethod;
  description: string;
  requiredFields?: string[];
};

const SERVICE_AND_MARKET_ENDPOINTS: EndpointReference[] = [
  { path: '/health', method: 'GET', description: 'Service status and Aster API reachability.' },
  { path: '/symbols', method: 'GET', description: 'Available tradable symbols and metadata.' },
  { path: '/market-data', method: 'GET', description: 'Ticker data for all markets or one symbol.' },
  { path: '/price', method: 'GET', description: 'Price lookup for token-to-symbol mapping.', requiredFields: ['token'] },
];

const ACCOUNT_ENDPOINTS: EndpointReference[] = [
  {
    path: '/balance',
    method: 'POST',
    description: 'Fetch signed account margin and wallet state.',
    requiredFields: ['userAddress'],
  },
  {
    path: '/positions',
    method: 'POST',
    description: 'Fetch open positions (optional symbol filter).',
    requiredFields: ['userAddress'],
  },
];

const TRADING_ENDPOINTS: EndpointReference[] = [
  {
    path: '/open-position',
    method: 'POST',
    description: 'Open long/short perpetual position.',
    requiredFields: ['userAddress', 'symbol', 'side', 'quantity'],
  },
  {
    path: '/close-position',
    method: 'POST',
    description: 'Close full or partial position.',
    requiredFields: ['userAddress', 'symbol'],
  },
  {
    path: '/set-take-profit',
    method: 'POST',
    description: 'Configure take-profit trigger.',
    requiredFields: ['userAddress', 'symbol'],
  },
  {
    path: '/set-stop-loss',
    method: 'POST',
    description: 'Configure stop-loss trigger.',
    requiredFields: ['userAddress', 'symbol'],
  },
  {
    path: '/change-leverage',
    method: 'POST',
    description: 'Update leverage per symbol.',
    requiredFields: ['userAddress', 'symbol', 'leverage'],
  },
  {
    path: '/cancel-order',
    method: 'POST',
    description: 'Cancel pending order by order identifier.',
    requiredFields: ['userAddress', 'symbol'],
  },
  {
    path: '/all-orders',
    method: 'POST',
    description: 'Order history and execution log.',
    requiredFields: ['userAddress', 'symbol'],
  },
];

const ASTER_WORKFLOWS = [
  'Open flow: symbols -> market-data/price -> optional leverage -> open-position.',
  'Risk flow: positions -> set-take-profit + set-stop-loss -> monitor order state.',
  'Exit flow: positions -> close-position -> all-orders reconciliation.',
];

function renderEndpointBadges(endpoints: EndpointReference[]) {
  return endpoints.map((endpoint) => (
    <div key={`${endpoint.method}-${endpoint.path}`} className="rounded-md border border-border/70 bg-muted/30 p-2">
      <p className={cardStyles.cardBody}>
        <span className={codeStyles.inline}>{endpoint.method}</span>{' '}
        <span className={codeStyles.inline}>{endpoint.path}</span>
      </p>
      <p className={labelStyles.helper}>{endpoint.description}</p>
      {endpoint.requiredFields?.length ? (
        <p className={labelStyles.helper}>
          Required:{' '}
          <span className={codeStyles.inline}>{endpoint.requiredFields.join(', ')}</span>
        </p>
      ) : null}
    </div>
  ));
}

export function AsterDexForm({ nodeId: _nodeId, config: _config }: Props) {
  return (
    <div className={formStyles.container}>
      <FormHeader
        icon={TrendingUp}
        title="Aster DEX"
        description="Guidance-first block for integrating Aster DEX perpetual trading in your app."
        variant="primary"
      />

      <div className={cn(cardStyles.base, 'space-y-3')}>
        <div className={cardStyles.cardHeader}>
          <Activity className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-accent-primary))]')} />
          <h3 className={cardStyles.cardTitle}>What is Aster DEX?</h3>
        </div>
        <p className={cardStyles.cardBody}>
          <span className="font-semibold">Aster DEX</span> is a perpetual futures exchange on BNB Chain.
          It enables leveraged long/short trading with symbol discovery, market data, position management,
          and risk controls like take-profit and stop-loss.
        </p>
        <p className={cardStyles.cardBody}>
          In this workflow, the Aster block provides implementation guidance and API references so your
          OpenClaw skill or backend service can execute trading operations safely with explicit user intent.
        </p>
      </div>

      <div className={cn(cardStyles.base, 'space-y-3')}>
        <div className={cardStyles.cardHeader}>
          <Server className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-accent-primary))]')} />
          <h3 className={cardStyles.cardTitle}>What the API service provides</h3>
        </div>

        <div>
          <p className={labelStyles.helper}>Service + market endpoints:</p>
          <div className="grid gap-2 mt-2">
            {renderEndpointBadges(SERVICE_AND_MARKET_ENDPOINTS)}
          </div>
        </div>

        <div>
          <p className={labelStyles.helper}>Account endpoints (signed):</p>
          <div className="grid gap-2 mt-2">
            {renderEndpointBadges(ACCOUNT_ENDPOINTS)}
          </div>
        </div>

        <div>
          <p className={labelStyles.helper}>Trading endpoints (signed):</p>
          <div className="grid gap-2 mt-2">
            {renderEndpointBadges(TRADING_ENDPOINTS)}
          </div>
        </div>

        <p className={cardStyles.cardBody}>
          The reference service includes an EIP-712 signing flow, symbol resolution, precision helpers,
          and endpoint scaffolds for opening/closing positions, setting TP/SL, updating leverage, and
          retrieving order history.
        </p>
      </div>

      <div className={cn(cardStyles.base, 'space-y-2')}>
        <div className={cardStyles.cardHeader}>
          <Activity className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-accent-primary))]')} />
          <h3 className={cardStyles.cardTitle}>Suggested integration workflow</h3>
        </div>
        <ul className={cardStyles.cardList}>
          {ASTER_WORKFLOWS.map((workflow) => (
            <li key={workflow} className={cardStyles.cardListItem}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-success))]" />
              <p className={cardStyles.cardBody}>{workflow}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className={cn(cardStyles.base, 'space-y-2')}>
        <div className={cardStyles.cardHeader}>
          <FileCode className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-accent-primary))]')} />
          <h3 className={cardStyles.cardTitle}>Generated artifacts</h3>
        </div>
        <ul className={cardStyles.cardList}>
          <li className={cardStyles.cardListItem}>
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-success))]" />
            <p className={cardStyles.cardBody}>
              <span className={cardStyles.cardCode}>packages/aster-dex/src/aster-service.py</span> reference API service
            </p>
          </li>
          <li className={cardStyles.cardListItem}>
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-success))]" />
            <p className={cardStyles.cardBody}>
              <span className={cardStyles.cardCode}>packages/aster-dex/src/index.ts</span> package entry and guidance exports
            </p>
          </li>
          <li className={cardStyles.cardListItem}>
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-success))]" />
            <p className={cardStyles.cardBody}>
              <span className={cardStyles.cardCode}>docs/aster-dex-guidance.md</span> setup notes in generated repo
            </p>
          </li>
        </ul>
      </div>

      <div className={cn(cardStyles.info, 'space-y-2')}>
        <p className={cardStyles.cardBody}>
          Use this block when your workflow needs Aster DEX integration.
        </p>
        <a
          href="https://www.asterdex.com/"
          target="_blank"
          rel="noreferrer"
          className={linkStyles.external}
        >
          <ExternalLink className={linkStyles.linkIcon} />
          <span>Aster DEX</span>
        </a>
      </div>
    </div>
  );
}

