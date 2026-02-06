import { CategoryDefinition, PluginCategory } from './types';

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
    {
        id: 'contracts',
        name: 'Smart Contracts',
        icon: 'Box', 
        color: 'accent-cyan'
    },
    {
        id: 'payments',
        name: 'Payments',
        icon: 'CreditCard',
        color: 'accent-green'
    },
    {
        id: 'agents',
        name: 'AI Agents',
        icon: 'Bot',
        color: 'accent-purple'
    },
    {
        id: 'app',
        name: 'Application',
        icon: 'Layout',
        color: 'accent-blue'
    },
    {
        id: 'quality',
        name: 'Quality Assurance',
        icon: 'ShieldCheck',
        color: 'accent-orange'
    },
    {
        id: 'telegram',
        name: 'Telegram',
        icon: 'Globe',
        color: 'accent-sky'
    },
    {
        id: 'intelligence',
        name: 'Intelligence',
        icon: 'Sparkles',
        color: 'accent-pink'
    },
    {
        id: 'superposition',
        name: 'Superposition',
        icon: 'Layers',
        color: 'accent-indigo'
    },
    {
        id: 'analytics',
        name: 'Analytics',
        icon: 'TrendingUp',
        color: 'accent-yellow'
    }
];

export const getCategoryById = (id: PluginCategory): CategoryDefinition | undefined => {
    return CATEGORY_DEFINITIONS.find(category => category.id === id);
};

export const getCategoryIds = (): PluginCategory[] => {
    return CATEGORY_DEFINITIONS.map(category => category.id);
};
