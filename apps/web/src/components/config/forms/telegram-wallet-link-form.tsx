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

export function TelegramWalletLinkForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    return (
        <div className={formStyles.container}>
            <div className={formStyles.section}>
                <label className={labelStyles.base}>Persistence Type</label>
                <Select
                    value={(config.persistenceType as string) ?? 'prisma'}
                    onValueChange={(v) => updateConfig('persistenceType', v)}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="prisma">Prisma ORM</SelectItem>
                        <SelectItem value="drizzle">Drizzle ORM</SelectItem>
                        <SelectItem value="in-memory">In-Memory (Testing)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[hsl(var(--color-text-primary))]">Signature Verification</span>
                <Switch
                    checked={(config.verificationEnabled as boolean) ?? true}
                    onCheckedChange={(v) => updateConfig('verificationEnabled', v)}
                />
            </div>
        </div>
    );
}
