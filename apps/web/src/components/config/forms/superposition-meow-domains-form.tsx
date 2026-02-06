'use client';

import { useState, useCallback } from 'react';
import { encodeFunctionData } from 'viem';
import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { MousePointer2, AtSign, Loader2, Info, Search, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formStyles,
  labelStyles,
  toggleRowStyles,
  cardStyles,
  codeStyles,
  FormHeader
} from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const FEATURES = [
  { value: 'resolve', label: 'Domain Resolution', description: 'Resolve .meow to address' },
  { value: 'register', label: 'Domain Registration', description: 'Register new domains' },
  { value: 'metadata', label: 'Metadata Support', description: 'Read/write domain metadata' },
  { value: 'reverse-lookup', label: 'Reverse Lookup', description: 'Address to domain lookup' },
];

const METADATA_FIELDS = [
  { value: 'twitter', label: 'Twitter', description: 'Twitter/X handle' },
  { value: 'url', label: 'Website URL', description: 'Website link' },
  { value: 'email', label: 'Email', description: 'Email address' },
  { value: 'avatar', label: 'Avatar', description: 'Profile image URL' },
  { value: 'description', label: 'Description', description: 'Bio/description' },
];

const RESOLVER_CONTRACT_ADDRESS = '0xC6c17896fa051083324f2aD0Ed4555dC46D96E7f';
const RPC_URL = 'https://rpc.superposition.so';
const TLD = '.meow';

interface ResolveStatus {
  status: 'idle' | 'resolving' | 'resolved' | 'not-found' | 'error';
  address?: string;
  error?: string;
}

export function SuperpositionMeowDomainsForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const [testDomain, setTestDomain] = useState('');
  const [resolveStatus, setResolveStatus] = useState<ResolveStatus>({ status: 'idle' });

  // Test domain resolution
  const testResolution = useCallback(async () => {
    if (!testDomain.trim()) return;

    // Normalize domain name (remove .meow suffix if present)
    const normalizedDomain = testDomain.toLowerCase().replace('.meow', '').trim();

    setResolveStatus({ status: 'resolving' });

    try {
      const callData = encodeFunctionData({
        abi: [
          {
            name: 'getDomainHolder',
            type: 'function',
            stateMutability: 'view',
            inputs: [
              { name: 'domainName', type: 'string' },
              { name: 'tld', type: 'string' },
            ],
            outputs: [{ name: '', type: 'address' }],
          },
        ],
        functionName: 'getDomainHolder',
        args: [normalizedDomain, TLD],
      });

      const response = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: RESOLVER_CONTRACT_ADDRESS,
              data: callData,
            },
            'latest',
          ],
          id: 1,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Resolution failed');
      }

      const result = data.result;

      if (!result || result === '0x' || result === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        setResolveStatus({ status: 'not-found' });
        return;
      }

      const address = '0x' + result.slice(-40);

      if (address === '0x0000000000000000000000000000000000000000') {
        setResolveStatus({ status: 'not-found' });
      } else {
        setResolveStatus({ status: 'resolved', address });
      }
    } catch (err) {
      setResolveStatus({
        status: 'error',
        error: err instanceof Error ? err.message : 'Resolution failed',
      });
    }
  }, [testDomain]);

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  const features = (config.features as string[]) || ['resolve', 'metadata'];
  const supportedMetadata = (config.supportedMetadata as string[]) || ['twitter', 'url', 'avatar'];

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = features.includes(feature)
      ? features.filter((f) => f !== feature)
      : [...features, feature];
    handleChange('features', newFeatures);
  };

  const handleMetadataToggle = (field: string) => {
    const newFields = supportedMetadata.includes(field)
      ? supportedMetadata.filter((f) => f !== field)
      : [...supportedMetadata, field];
    handleChange('supportedMetadata', newFields);
  };

  return (
    <div className={formStyles.container}>
      <FormHeader
        icon={AtSign}
        title="Meow Domains"
        description="Integrate decentralized identity with .meow domains."
      />

      {/* Features */}
      <div className={formStyles.section}>
        <div className="flex items-center gap-2 mb-2">
          <MousePointer2 className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
          <span className="text-xs font-semibold text-[hsl(var(--color-text-secondary))] tracking-wide uppercase">Features</span>
        </div>

        {FEATURES.map((feature) => (
          <div
            key={feature.value}
            className={toggleRowStyles.row}
          >
            <div>
              <p className={toggleRowStyles.title}>{feature.label}</p>
              <p className={toggleRowStyles.description}>{feature.description}</p>
            </div>
            <Switch
              checked={features.includes(feature.value)}
              onCheckedChange={() => handleFeatureToggle(feature.value)}
            />
          </div>
        ))}
      </div>

      <div className={formStyles.section}>
        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Resolver Hook</p>
            <p className={toggleRowStyles.description}>Generate useMeowDomain hook</p>
          </div>
          <Switch
            checked={(config.generateResolverHook as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateResolverHook', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Registration Hook</p>
            <p className={toggleRowStyles.description}>Generate useRegisterMeowDomain hook</p>
          </div>
          <Switch
            checked={(config.generateRegistrationHook as boolean) ?? false}
            onCheckedChange={(checked) => handleChange('generateRegistrationHook', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Domain Display</p>
            <p className={toggleRowStyles.description}>Generate MeowDomainDisplay component</p>
          </div>
          <Switch
            checked={(config.generateDomainDisplay as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('generateDomainDisplay', checked)}
          />
        </div>
      </div>

      {/* Supported Metadata Fields */}
      {features.includes('metadata') && (
        <div className={formStyles.section}>
          <label className={labelStyles.base}>Metadata Fields</label>
          {METADATA_FIELDS.map((field) => (
            <div
              key={field.value}
              className={toggleRowStyles.row}
            >
              <div>
                <p className={toggleRowStyles.title}>{field.label}</p>
                <p className={toggleRowStyles.description}>{field.description}</p>
              </div>
              <Switch
                checked={supportedMetadata.includes(field.value)}
                onCheckedChange={() => handleMetadataToggle(field.value)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Test Domain Resolution */}
      <div className={cardStyles.base}>
        <div className={cardStyles.cardHeader}>
          <Search className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-text-muted))]')} />
          <span className={cardStyles.cardTitle}>Test Resolution</span>
        </div>

        <div className="space-y-3">
          <p className={cardStyles.cardBody}>Try resolving a .meow domain to verify the hook works</p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={testDomain}
                onChange={(e) => setTestDomain(e.target.value)}
                placeholder="vitalik.meow"
                className="w-full"
              />
              {/* Could add .meow suffix automatically if not present in placeholder */}
            </div>

            <button
              onClick={testResolution}
              disabled={!testDomain.trim() || resolveStatus.status === 'resolving'}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5",
                "bg-[hsl(var(--color-accent-primary)/0.15)] text-[hsl(var(--color-accent-primary))]",
                "hover:bg-[hsl(var(--color-accent-primary)/0.25)]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {resolveStatus.status === 'resolving' && <Loader2 className="w-3 h-3 animate-spin" />}
              {resolveStatus.status === 'resolving' ? 'Resolving...' : 'Resolve'}
            </button>
          </div>

          {/* Resolution Result */}
          {resolveStatus.status === 'resolved' && resolveStatus.address && (
            <div className={cardStyles.success}>
              <div className={cardStyles.cardHeader}>
                <CheckCircle2 className={cn(cardStyles.cardIcon, "text-[hsl(var(--color-success))]")} />
                <span className={cardStyles.cardTitle}>Domain Found</span>
              </div>
              <p className={cn(codeStyles.inline, "whitespace-nowrap overflow-hidden text-ellipsis block text-center")}>
                {resolveStatus.address}
              </p>
            </div>
          )}

          {resolveStatus.status === 'not-found' && (
            <div className={cardStyles.warning}>
              <div className={cardStyles.cardHeader}>
                <AlertTriangle className={cn(cardStyles.cardIcon, "text-[hsl(var(--color-warning))]")} />
                <span className={cardStyles.cardTitle}>Domain Not Registered</span>
              </div>
              <p className={cardStyles.cardBody}>
                This domain is available for registration at{' '}
                <a
                  href="https://meow.domains"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "text-[hsl(var(--color-warning))] hover:text-[hsl(var(--color-warning)/0.8)] underline",
                    "font-medium"
                  )}
                >
                  meow.domains
                </a>
              </p>
            </div>
          )}

          {resolveStatus.status === 'error' && (
            <div className={cn(cardStyles.base, "bg-[hsl(var(--color-error)/0.08)] border-[hsl(var(--color-error)/0.2)]")}>
              <div className={cardStyles.cardHeader}>
                <XCircle className={cn(cardStyles.cardIcon, "text-[hsl(var(--color-error))]")} />
                <span className={cn(cardStyles.cardTitle, "text-[hsl(var(--color-error))]")}>Resolution Failed</span>
              </div>
              <p className={cn(cardStyles.cardBody, "text-[hsl(var(--color-error)/0.8)]")}>{resolveStatus.error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className={cardStyles.info}>
        <div className={cardStyles.cardHeader}>
          <Info className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-info))]')} />
          <span className={cardStyles.cardTitle}>Documentation</span>
        </div>
        <p className={cardStyles.cardBody}>
          Meow Domains (.meow) provide Web3 identity on Superposition.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://meow.domains"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
          >
            meow.domains
          </a>
          <a
            href="https://docs.punk.domains"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
          >
            Punk Domains Docs
          </a>
        </div>
      </div>
    </div>
  );
}
