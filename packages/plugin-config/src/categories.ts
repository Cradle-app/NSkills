import type { CategoryDefinition } from './types';

/**
 * Category definitions for the plugin palette
 * This defines how categories are displayed in the UI
 */
export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
    {
        id: 'contracts',
        name: 'Contracts',
        icon: 'Box',
        color: 'node-contracts',
    },
    {
        id: 'payments',
        name: 'Payments',
        icon: 'CreditCard',
        color: 'node-payments',
    },
    {
        id: 'agents',
        name: 'Agents',
        icon: 'Bot',
        color: 'node-agents',
    },
    {
        id: 'app',
        name: 'App',
        icon: 'Layout',
        color: 'node-app',
    },
    {
        id: 'telegram',
        name: 'Telegram',
        icon: 'Bot',
        color: 'node-telegram',
    },
    {
        id: 'quality',
        name: 'Quality',
        icon: 'ShieldCheck',
        color: 'node-quality',
    },
    {
        id: 'intelligence',
        name: 'Intelligence',
        icon: 'Sparkles',
        color: 'node-intelligence',
    },
    {
        id: 'superposition',
        name: 'Superposition',
        icon: 'Layers',
        color: 'accent-cyan',
    },
    {
        id: 'analytics',
        name: 'Analytics',
        icon: 'Database',
        color: 'accent-purple',
    },
];

/**
 * Get category definition by ID
 */
export function getCategoryById(id: string): CategoryDefinition | undefined {
    return CATEGORY_DEFINITIONS.find((cat) => cat.id === id);
}

/**
 * Get all category IDs
 */
export function getCategoryIds(): string[] {
    return CATEGORY_DEFINITIONS.map((cat) => cat.id);
}
