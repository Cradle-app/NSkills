'use client';

import { useState } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardDrive, Info, ExternalLink, Eye, EyeOff, Key, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { IPFSUploadPanel } from '@/components/ipfs/ipfs-upload-panel';
import { cn } from '@/lib/utils';
import {
  formStyles,
  labelStyles,
  cardStyles,
  codeStyles,
  inputStyles,
} from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function IPFSStorageForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showUploader, setShowUploader] = useState(true);

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  const provider = (config.provider as string) ?? 'pinata';
  const pinataApiKey = (config.pinataApiKey as string) ?? '';
  const pinataSecretKey = (config.pinataSecretKey as string) ?? '';
  const hasApiKeys = pinataApiKey.length > 0 && pinataSecretKey.length > 0;

  return (
    <div className={formStyles.container}>
      {/* Info callout */}
      <div className={cardStyles.info}>
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-[hsl(var(--color-info))] shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="text-[hsl(var(--color-info))] font-medium mb-1">IPFS Storage</p>
            <p className="text-[hsl(var(--color-text-muted))]">Upload files directly to IPFS via Pinata. Files are pinned and permanently available.</p>
          </div>
        </div>
      </div>

      <div className={formStyles.section}>
        <label className={labelStyles.base}>Storage Provider</label>
        <Select
          value={provider}
          onValueChange={(v) => updateConfig('provider', v)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pinata">
              <div className="flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Pinata</span>
              </div>
            </SelectItem>
            <SelectItem value="web3storage">
              <div className="flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Web3.Storage</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pinata API Keys */}
      {provider === 'pinata' && (
        <div className={cardStyles.base}>
          <div className="flex items-center gap-2 mb-3">
            <Key className="w-3.5 h-3.5 text-[hsl(var(--color-accent-primary))]" />
            <span className="text-xs font-semibold text-[hsl(var(--color-text-primary))]">Pinata API Keys</span>
            <a
              href="https://app.pinata.cloud/developers/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-[10px] text-[hsl(var(--color-accent-primary))] hover:underline"
            >
              Get keys <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-[hsl(var(--color-text-muted))] mb-1 block">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={pinataApiKey}
                  onChange={(e) => updateConfig('pinataApiKey', e.target.value)}
                  placeholder="Enter your Pinata API key"
                  className={cn(
                    inputStyles.base,
                    'h-8 pr-8'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))]"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[hsl(var(--color-text-muted))] mb-1 block">Secret Key</label>
              <div className="relative">
                <input
                  type={showSecretKey ? 'text' : 'password'}
                  value={pinataSecretKey}
                  onChange={(e) => updateConfig('pinataSecretKey', e.target.value)}
                  placeholder="Enter your Pinata secret key"
                  className={cn(
                    inputStyles.base,
                    'h-8 pr-8'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowSecretKey(!showSecretKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))]"
                >
                  {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {hasApiKeys && (
              <div className="flex items-center gap-1.5 text-[10px] text-[hsl(var(--color-success))]">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-success))]" />
                API keys configured
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Section */}
      {provider === 'pinata' && (
        <div className="border-t border-[hsl(var(--color-border-subtle))] pt-4">
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <span className="text-xs font-semibold text-[hsl(var(--color-text-primary))]">Upload to IPFS</span>
            {showUploader ? (
              <ChevronUp className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[hsl(var(--color-text-muted))]" />
            )}
          </button>

          {showUploader && (
            <IPFSUploadPanel
              pinataApiKey={pinataApiKey}
              pinataSecretKey={pinataSecretKey}
            />
          )}
        </div>
      )}

      {/* Code Generation Options */}
      <div className="border-t border-[hsl(var(--color-border-subtle))] pt-4 space-y-3">
        <p className="text-[10px] text-[hsl(var(--color-text-muted))] uppercase tracking-wider font-medium">Code Generation</p>

        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-[hsl(var(--color-text-primary))]">Generate Metadata Schemas</span>
          <Switch
            checked={(config.generateMetadataSchemas as boolean) ?? true}
            onCheckedChange={(v) => updateConfig('generateMetadataSchemas', v)}
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-[hsl(var(--color-text-primary))]">Generate Upload UI</span>
          <Switch
            checked={(config.generateUI as boolean) ?? true}
            onCheckedChange={(v) => updateConfig('generateUI', v)}
          />
        </div>
      </div>

      {/* What will be generated */}
      <div className="pt-2 border-t border-[hsl(var(--color-border-subtle))]">
        <p className="text-[10px] text-[hsl(var(--color-text-muted))] mb-2 uppercase tracking-wider font-medium">Generated Files</p>
        <ul className="space-y-1.5 text-xs text-[hsl(var(--color-text-secondary))]">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-success))]" />
            <code className={codeStyles.inline}>storage-client.ts</code>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-success))]" />
            <code className={codeStyles.inline}>useIPFS.ts</code>
          </li>
          {(config.generateUI as boolean) !== false && (
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-success))]" />
              <code className={codeStyles.inline}>FileUpload.tsx</code>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
