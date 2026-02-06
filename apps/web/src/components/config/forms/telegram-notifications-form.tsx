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

export function TelegramNotificationsForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    const notificationTypes = [
        'transaction', 'price-alert', 'whale-alert',
        'nft-activity', 'defi-position', 'governance',
        'contract-event', 'custom'
    ];

    return (
        <div className={formStyles.container}>
            <div className={formStyles.section}>
                <label className={labelStyles.base}>Template Format</label>
                <Select
                    value={(config.templateFormat as string) ?? 'HTML'}
                    onValueChange={(v) => updateConfig('templateFormat', v)}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="HTML">HTML</SelectItem>
                        <SelectItem value="Markdown">Markdown</SelectItem>
                        <SelectItem value="MarkdownV2">MarkdownV2</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className={formStyles.section}>
                <label className={labelStyles.base}>Notification Types</label>
                <div className="space-y-2">
                    {notificationTypes.map((type) => (
                        <div key={type} className="flex items-center justify-between py-1">
                            <span className="text-sm text-[hsl(var(--color-text-primary))] capitalize">{type.replace('-', ' ')}</span>
                            <Switch
                                checked={((config.notificationTypes as string[]) ?? ['transaction']).includes(type)}
                                onCheckedChange={(checked) => {
                                    const current = (config.notificationTypes as string[]) ?? ['transaction'];
                                    updateConfig('notificationTypes', checked ? [...current, type] : current.filter((t) => t !== type));
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
