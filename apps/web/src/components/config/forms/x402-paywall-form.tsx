'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatWei, cn } from '@/lib/utils';
import {
  formStyles,
  labelStyles,
  toggleRowStyles,
} from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const CURRENCIES = [
  { value: 'ETH', label: 'ETH' },
  { value: 'USDC', label: 'USDC' },
  { value: 'USDT', label: 'USDT' },
  { value: 'DAI', label: 'DAI' },
  { value: 'CUSTOM', label: 'Custom Token' },
];

export function X402PaywallForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  const resourcePath = (config.resourcePath as string) || '';
  const priceInWei = (config.priceInWei as string) || '';
  const paymentTimeout = (config.paymentTimeout as number) || 300;

  return (
    <div className={formStyles.container}>
      {/* Resource Path */}
      <div className={formStyles.section}>
        <Input
          label="Resource Path"
          value={resourcePath}
          onChange={(e) => handleChange('resourcePath', e.target.value)}
          placeholder="/api/premium/resource"
          required
          error={!resourcePath.trim() ? 'Required' : undefined}
        />
      </div>

      {/* Currency */}
      <div className={formStyles.section}>
        <Select
          value={(config.currency as string) || 'ETH'}
          onValueChange={(value) => handleChange('currency', value)}
        >
          <SelectTrigger label="Currency">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((currency) => (
              <SelectItem key={currency.value} value={currency.value}>
                {currency.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Custom Token Address */}
      {config.currency === 'CUSTOM' && (
        <div className={formStyles.section}>
          <Input
            label="Token Address"
            value={(config.customTokenAddress as string) || ''}
            onChange={(e) => handleChange('customTokenAddress', e.target.value)}
            placeholder="0x..."
          />
        </div>
      )}

      {/* Price */}
      <div className={formStyles.section}>
        <Input
          label="Price (wei)"
          value={priceInWei}
          onChange={(e) => handleChange('priceInWei', e.target.value)}
          placeholder="1000000000000000"
          required
          error={!priceInWei.trim() ? 'Required' : undefined}
        />
        {Boolean(priceInWei) && (
          <p className="text-xs text-[hsl(var(--color-text-muted))] mt-1">
            ≈ {formatWei(priceInWei)}
          </p>
        )}
      </div>

      {/* Payment Timeout */}
      <div className={formStyles.section}>
        <Input
          label="Payment Timeout (seconds)"
          type="number"
          value={paymentTimeout}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            handleChange('paymentTimeout', Number.isFinite(v) ? v : 0);
          }}
          placeholder="300"
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>Receipt Validation</p>
            <p className={toggleRowStyles.description}>Verify payments on-chain</p>
          </div>
          <Switch
            checked={(config.receiptValidation as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('receiptValidation', checked)}
          />
        </div>

        <div className={toggleRowStyles.row}>
          <div>
            <p className={toggleRowStyles.title}>OpenAPI Spec</p>
            <p className={toggleRowStyles.description}>Generate API documentation</p>
          </div>
          <Switch
            checked={(config.openApiSpec as boolean) ?? true}
            onCheckedChange={(checked) => handleChange('openApiSpec', checked)}
          />
        </div>
      </div>

      {/* Webhook URL */}
      <div className={formStyles.section}>
        <Input
          label="Webhook URL (optional)"
          value={(config.webhookUrl as string) || ''}
          onChange={(e) => handleChange('webhookUrl', e.target.value)}
          placeholder="https://your-app.com/webhook"
        />
      </div>
    </div>
  );
}
