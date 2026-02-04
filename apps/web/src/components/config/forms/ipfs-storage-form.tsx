'use client';

import { useState } from 'react';
import { useBlueprintStore } from '@/store/blueprint';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HardDrive, Info, ExternalLink, Eye, EyeOff, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { IPFSUploadPanel } from '@/components/ipfs/ipfs-upload-panel';
import { cn } from '@/lib/utils';

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
    <div className="space-y-4">
      {/* Info callout */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20">
        <Info className="w-4 h-4 text-accent-cyan shrink-0 mt-0.5" />
        <div className="text-xs text-forge-muted">
          <p className="text-accent-cyan font-medium mb-1">IPFS Storage</p>
          <p>Upload files directly to IPFS via Pinata. Files are pinned and permanently available.</p>
        </div>
      </div>

      <div>
        <label className="text-xs text-forge-muted mb-1.5 block">Storage Provider</label>
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
        <div className="space-y-3 p-3 rounded-lg bg-forge-elevated/30 border border-forge-border/50">
          <div className="flex items-center gap-2">
            <Key className="w-3.5 h-3.5 text-accent-cyan" />
            <span className="text-xs font-medium text-white">Pinata API Keys</span>
            <a
              href="https://app.pinata.cloud/developers/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-[10px] text-accent-cyan hover:underline"
            >
              Get keys <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div>
            <label className="text-[10px] text-forge-muted mb-1 block">API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={pinataApiKey}
                onChange={(e) => updateConfig('pinataApiKey', e.target.value)}
                placeholder="Enter your Pinata API key"
                className="w-full h-8 px-2.5 pr-8 rounded-lg bg-forge-bg border border-forge-border/50 text-xs text-white placeholder:text-forge-muted/50 focus:outline-none focus:border-accent-cyan/50"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-forge-muted hover:text-white"
              >
                {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-forge-muted mb-1 block">Secret Key</label>
            <div className="relative">
              <input
                type={showSecretKey ? 'text' : 'password'}
                value={pinataSecretKey}
                onChange={(e) => updateConfig('pinataSecretKey', e.target.value)}
                placeholder="Enter your Pinata secret key"
                className="w-full h-8 px-2.5 pr-8 rounded-lg bg-forge-bg border border-forge-border/50 text-xs text-white placeholder:text-forge-muted/50 focus:outline-none focus:border-accent-cyan/50"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-forge-muted hover:text-white"
              >
                {showSecretKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {hasApiKeys && (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              API keys configured
            </div>
          )}
        </div>
      )}

      {/* Upload Section */}
      {provider === 'pinata' && (
        <div className="border-t border-forge-border/50 pt-4">
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="flex items-center justify-between w-full text-left mb-3"
          >
            <span className="text-xs font-medium text-white">Upload to IPFS</span>
            {showUploader ? (
              <ChevronUp className="w-4 h-4 text-forge-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-forge-muted" />
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
      <div className="border-t border-forge-border/50 pt-4 space-y-3">
        <p className="text-[10px] text-forge-muted uppercase tracking-wider">Code Generation</p>

        <div className="flex items-center justify-between">
          <span className="text-sm text-white">Generate Metadata Schemas</span>
          <Switch
            checked={(config.generateMetadataSchemas as boolean) ?? true}
            onCheckedChange={(v) => updateConfig('generateMetadataSchemas', v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-white">Generate Upload UI</span>
          <Switch
            checked={(config.generateUI as boolean) ?? true}
            onCheckedChange={(v) => updateConfig('generateUI', v)}
          />
        </div>
      </div>

      {/* What will be generated */}
      <div className="pt-2 border-t border-forge-border/50">
        <p className="text-[10px] text-forge-muted mb-2 uppercase tracking-wider">Generated Files</p>
        <ul className="space-y-1 text-xs text-white/70">
          <li className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
            <code className="text-[11px] bg-forge-elevated/50 px-1 rounded">storage-client.ts</code>
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full bg-emerald-500" />
            <code className="text-[11px] bg-forge-elevated/50 px-1 rounded">useIPFS.ts</code>
          </li>
          {(config.generateUI as boolean) !== false && (
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              <code className="text-[11px] bg-forge-elevated/50 px-1 rounded">FileUpload.tsx</code>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
