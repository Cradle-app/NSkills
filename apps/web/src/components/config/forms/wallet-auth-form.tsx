'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import {
  formStyles,
  labelStyles,
  cardStyles,
  linkStyles,
  statusStyles,
  actionStyles,
  codeStyles,
  FormHeader,
} from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

export function WalletAuthForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();
  const { address, isConnected, chain } = useAccount();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  const provider = (config.provider as string) ?? 'rainbowkit';
  const appName = (config.appName as string) ?? '';

  return (
    <div className={formStyles.container}>
      {/* Connection Status */}
      <div className={isConnected ? statusStyles.connected : statusStyles.disconnected}>
        <div className={statusStyles.statusHeader}>
          <Wallet className={cn(
            statusStyles.statusIcon,
            isConnected ? statusStyles.statusIconConnected : statusStyles.statusIconPrimary
          )} />
          <span className={statusStyles.statusTitle}>Wallet Connection</span>
          {isConnected && (
            <span className={cn(
              'text-[10px] px-1.5 py-0.5 rounded font-medium',
              'bg-[hsl(var(--color-success)/0.15)] text-[hsl(var(--color-success))]'
            )}>
              CONNECTED
            </span>
          )}
        </div>
        {isConnected ? (
          <div className="space-y-1">
            <p className={statusStyles.statusDetail}>
              <span className={statusStyles.statusValue}>Address:</span>{' '}
              <code className={statusStyles.statusCode}>{address?.slice(0, 6)}...{address?.slice(-4)}</code>
            </p>
            <p className={statusStyles.statusDetail}>
              <span className={statusStyles.statusValue}>Network:</span> {chain?.name}
            </p>
          </div>
        ) : (
          <p className={cn(statusStyles.statusDetail, 'mb-3')}>
            Connect your wallet to test the authentication flow.
          </p>
        )}
        <div className="mt-3">
          <ConnectButton.Custom>
            {({ openConnectModal, openAccountModal, mounted }) => {
              if (!mounted) return null;

              if (isConnected) {
                return (
                  <button
                    onClick={openAccountModal}
                    className={actionStyles.secondary}
                  >
                    Manage Wallet
                  </button>
                );
              }

              return (
                <button
                  onClick={openConnectModal}
                  className={actionStyles.primary}
                >
                  Connect Wallet
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>

      {/* Provider Selection */}
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Provider</label>
        <Select
          value={provider}
          onValueChange={(v) => updateConfig('provider', v)}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="rainbowkit">RainbowKit (Recommended)</SelectItem>
            <SelectItem value="privy" disabled>Privy (Coming Soon)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* App Name */}
      <div className={formStyles.section}>
        <label className={labelStyles.base}>App Name</label>
        <Input
          value={appName}
          onChange={(e) => updateConfig('appName', e.target.value)}
          placeholder="My DApp"
        />
        <p className={labelStyles.helper}>
          Displayed in wallet connection dialogs
        </p>
      </div>

      {/* Setup Instructions */}
      <div className={cardStyles.info}>
        <div className={cardStyles.cardHeader}>
          <Info className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-info))]')} />
          <span className={cardStyles.cardTitle}>Setup Required</span>
        </div>
        <p className={cardStyles.cardBody}>
          To enable mobile wallet connections, you need a Project ID from WalletConnect Cloud:
        </p>
        <a
          href="https://dashboard.reown.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(linkStyles.inline, 'mt-2')}
        >
          <ExternalLink className="w-3 h-3" />
          Get WalletConnect Project ID
        </a>
        <div className={cn(codeStyles.block, 'mt-2')}>
          <code>NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-id</code>
        </div>
      </div>

      {/* What's Included */}
      {isConnected && (
        <div className={cardStyles.success}>
          <div className={cardStyles.cardHeader}>
            <CheckCircle2 className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-success))]')} />
            <span className={cardStyles.cardTitle}>Ready for Code Generation</span>
          </div>
          <p className={cardStyles.cardBody}>
            The <code className={codeStyles.inline}>@cradle/wallet-auth</code> component will be included in your generated project with RainbowKit pre-configured.
          </p>
        </div>
      )}
    </div>
  );
}
