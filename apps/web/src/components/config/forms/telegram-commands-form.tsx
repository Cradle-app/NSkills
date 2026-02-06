'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
    formStyles,
    labelStyles,
} from './shared-styles';

interface Props {
    nodeId: string;
    config: Record<string, unknown>;
}

export function TelegramCommandsForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    const commandsList = [
        'start', 'help', 'balance', 'wallet',
        'subscribe', 'unsubscribe', 'settings', 'status'
    ];

    return (
        <div className={formStyles.container}>
            <div className={formStyles.section}>
                <label className={labelStyles.base}>Framework</label>
                <Select
                    value={(config.framework as string) ?? 'grammy'}
                    onValueChange={(v) => updateConfig('framework', v)}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="grammy">grammY (Modern)</SelectItem>
                        <SelectItem value="telegraf">Telegraf</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className={formStyles.section}>
                <label className={labelStyles.base}>Delivery Method</label>
                <Select
                    value={(config.deliveryMethod as string) ?? 'webhook'}
                    onValueChange={(v) => updateConfig('deliveryMethod', v)}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="webhook">Webhook (Production)</SelectItem>
                        <SelectItem value="polling">Polling (Local Dev)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[hsl(var(--color-text-primary))]">Rate Limiting</span>
                <Switch
                    checked={(config.rateLimitEnabled as boolean) ?? true}
                    onCheckedChange={(v) => updateConfig('rateLimitEnabled', v)}
                />
            </div>

            <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                    <span className="text-sm text-[hsl(var(--color-text-primary))]">Standard Chat Flow</span>
                    <p className="text-[10px] text-[hsl(var(--color-text-muted))]">Handle non-command messages</p>
                </div>
                <Switch
                    checked={(config.chatFlowEnabled as boolean) ?? false}
                    onCheckedChange={(v) => updateConfig('chatFlowEnabled', v)}
                />
            </div>

            <div className={formStyles.section}>
                <label className={labelStyles.base}>Commands</label>
                <div className="space-y-2">
                    {commandsList.map((cmd) => (
                        <div key={cmd} className="flex items-center justify-between py-1">
                            <span className="text-sm text-[hsl(var(--color-text-primary))] capitalize">{cmd}</span>
                            <Switch
                                checked={((config.commands as string[]) ?? ['start', 'help']).includes(cmd)}
                                onCheckedChange={(checked) => {
                                    const current = (config.commands as string[]) ?? ['start', 'help'];
                                    updateConfig('commands', checked ? [...current, cmd] : current.filter((c) => c !== cmd));
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
