'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    formStyles,
    labelStyles,
    inputStyles,
} from './shared-styles';

interface Props {
    nodeId: string;
    config: Record<string, unknown>;
}

export function TelegramAIAgentForm({ nodeId, config }: Props) {
    const { updateNodeConfig } = useBlueprintStore();

    const updateConfig = (key: string, value: unknown) => {
        updateNodeConfig(nodeId, { ...config, [key]: value });
    };

    return (
        <div className={formStyles.container}>
            <div className={formStyles.section}>
                <label className={labelStyles.base}>AI Provider</label>
                <Select
                    value={(config.provider as string) ?? 'openai'}
                    onValueChange={(v) => updateConfig('provider', v)}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="openai">OpenAI (GPT-4/3.5)</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                        <SelectItem value="local">Local (Ollama/LlamaEdge)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className={formStyles.section}>
                <label className={labelStyles.base}>Model</label>
                <Input
                    value={(config.model as string) ?? 'gpt-4-turbo'}
                    onChange={(e) => updateConfig('model', e.target.value)}
                    placeholder="e.g. gpt-4-turbo or claude-3-opus"
                />
            </div>

            <div className={formStyles.section}>
                <label className={labelStyles.base}>System Prompt</label>
                <textarea
                    className={inputStyles.textarea}
                    value={(config.systemPrompt as string) ?? ''}
                    onChange={(e) => updateConfig('systemPrompt', e.target.value)}
                    placeholder="You are a helpful Web3 assistant..."
                />
            </div>

            <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[hsl(var(--color-text-primary))]">Conversation Memory</span>
                <Switch
                    checked={(config.memoryEnabled as boolean) ?? true}
                    onCheckedChange={(v) => updateConfig('memoryEnabled', v)}
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(var(--color-text-muted))]">Temperature</span>
                    <span className="text-xs text-[hsl(var(--color-text-primary))] font-mono">{(config.temperature as number) ?? 0.7}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    className={cn(
                        'w-full h-1.5 rounded-lg appearance-none cursor-pointer',
                        'bg-[hsl(var(--color-border-default))]',
                        'accent-[hsl(var(--color-accent-primary))]'
                    )}
                    value={(config.temperature as number) ?? 0.7}
                    onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                />
            </div>
        </div>
    );
}
