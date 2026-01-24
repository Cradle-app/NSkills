'use client';

import { useState, useCallback } from 'react';
import { encodeFunctionData } from 'viem';
import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

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

// Punk Domains Resolver Contract on Superposition (verified)
// Source: https://docs.punk.domains/how-to-integrate/
// The getDomainHolder function is on the Resolver contract, not the TLD contract
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
      // Encode the function call: getDomainHolder(string,string)
      // According to Punk Domains docs: getDomainHolder(domainName, tld)
      // Use viem to properly encode the function call with ABI
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

      // Parse the result - it should be an address (20 bytes, padded to 32)
      const result = data.result;
      
      if (!result || result === '0x' || result === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        setResolveStatus({ status: 'not-found' });
        return;
      }

      // Extract address from result (last 40 hex chars)
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
    <div className="space-y-4">
      {/* Features */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-white mb-2">Features</p>
        {FEATURES.map((feature) => (
          <div
            key={feature.value}
            className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border"
          >
            <div>
              <p className="text-sm font-medium text-white">{feature.label}</p>
              <p className="text-xs text-forge-muted">{feature.description}</p>
            </div>
            <Switch
              checked={features.includes(feature.value)}
              onCheckedChange={() => handleFeatureToggle(feature.value)}
            />
          </div>
        ))}
      </div>

      {/* Generate Resolver Hook */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Resolver Hook</p>
          <p className="text-xs text-forge-muted">Generate useMeowDomain hook</p>
        </div>
        <Switch
          checked={(config.generateResolverHook as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateResolverHook', checked)}
        />
      </div>

      {/* Generate Registration Hook */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Registration Hook</p>
          <p className="text-xs text-forge-muted">Generate useRegisterMeowDomain hook</p>
        </div>
        <Switch
          checked={(config.generateRegistrationHook as boolean) ?? false}
          onCheckedChange={(checked) => handleChange('generateRegistrationHook', checked)}
        />
      </div>

      {/* Generate Domain Display */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border">
        <div>
          <p className="text-sm font-medium text-white">Domain Display</p>
          <p className="text-xs text-forge-muted">Generate MeowDomainDisplay component</p>
        </div>
        <Switch
          checked={(config.generateDomainDisplay as boolean) ?? true}
          onCheckedChange={(checked) => handleChange('generateDomainDisplay', checked)}
        />
      </div>

      {/* Supported Metadata Fields */}
      {features.includes('metadata') && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-white mb-2">Metadata Fields</p>
          {METADATA_FIELDS.map((field) => (
            <div
              key={field.value}
              className="flex items-center justify-between p-3 rounded-lg bg-forge-bg border border-forge-border"
            >
              <div>
                <p className="text-sm font-medium text-white">{field.label}</p>
                <p className="text-xs text-forge-muted">{field.description}</p>
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
      <div className="p-3 rounded-lg bg-forge-bg border border-forge-border space-y-3">
        <div>
          <p className="text-sm font-medium text-white">Test Domain Resolution</p>
          <p className="text-xs text-forge-muted mb-2">Try resolving a .meow domain to verify the hook works</p>
        </div>
        
        <div className="flex gap-2">
          <Input
            value={testDomain}
            onChange={(e) => setTestDomain(e.target.value)}
            placeholder="vitalik.meow"
            className="flex-1"
          />
          <button
            onClick={testResolution}
            disabled={!testDomain.trim() || resolveStatus.status === 'resolving'}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {resolveStatus.status === 'resolving' ? 'Resolving...' : 'Resolve'}
          </button>
        </div>

        {/* Resolution Result */}
        {resolveStatus.status === 'resolved' && resolveStatus.address && (
          <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-400">Domain Found</span>
            </div>
            <p className="text-xs text-green-300/80 font-mono break-all">
              {resolveStatus.address}
            </p>
          </div>
        )}

        {resolveStatus.status === 'not-found' && (
          <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs font-medium text-yellow-400">Domain Not Registered</span>
            </div>
            <p className="text-xs text-yellow-300/80 mt-1">
              This domain is available for registration at{' '}
              <a
                href="https://meow.domains"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-yellow-200"
              >
                meow.domains
              </a>
            </p>
          </div>
        )}

        {resolveStatus.status === 'error' && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-400">Resolution Failed</span>
            </div>
            <p className="text-xs text-red-300/80">{resolveStatus.error}</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
        <p className="text-xs text-accent-cyan">
          Meow Domains (.meow) provide Web3 identity on Superposition. Built on the
          Punk Domains protocol for decentralized naming.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href="https://meow.domains"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-cyan/80 hover:text-accent-cyan underline"
          >
            meow.domains
          </a>
          <a
            href="https://docs.punk.domains"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-accent-cyan/80 hover:text-accent-cyan underline"
          >
            Punk Domains Docs
          </a>
        </div>
      </div>
    </div>
  );
}
