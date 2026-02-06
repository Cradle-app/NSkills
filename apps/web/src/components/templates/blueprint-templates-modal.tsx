'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Image,
    Coins,
    Bot,
    Layout,
    Wallet,
    HardDrive,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBlueprintStore } from '@/store/blueprint';

interface Template {
    id: string;
    name: string;
    description: string;
    icon: typeof Image;
    colorClass: string;
    tags: string[];
    nodes: Array<{
        type: string;
        position: { x: number; y: number };
    }>;
    edges: Array<{
        source: number; // index into nodes array
        target: number;
    }>;
}

const TEMPLATES: Template[] = [
    {
        id: 'nft-collection',
        name: 'NFT Collection',
        description: 'ERC-721 contract with frontend scaffold and IPFS storage for metadata',
        icon: Image,
        colorClass: 'accent-secondary',
        tags: ['NFT', 'Stylus', 'IPFS'],
        nodes: [
            { type: 'erc721-stylus', position: { x: 250, y: 150 } },
            { type: 'frontend-scaffold', position: { x: 500, y: 100 } },
            { type: 'ipfs-storage', position: { x: 500, y: 250 } },
            { type: 'wallet-auth', position: { x: 750, y: 150 } },
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 0, target: 2 },
            { source: 1, target: 3 },
        ],
    },
    {
        id: 'token-launch',
        name: 'Token Launch',
        description: 'ERC-20 token with wallet auth and frontend for token interactions',
        icon: Coins,
        colorClass: 'warning',
        tags: ['Token', 'DeFi', 'Stylus'],
        nodes: [
            { type: 'erc20-stylus', position: { x: 250, y: 150 } },
            { type: 'frontend-scaffold', position: { x: 500, y: 100 } },
            { type: 'wallet-auth', position: { x: 500, y: 250 } },
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 0, target: 2 },
        ],
    },
    {
        id: 'ai-agent',
        name: 'AI Agent + Telegram',
        description: 'ERC-8004 autonomous agent with Telegram bot integration',
        icon: Bot,
        colorClass: 'accent-primary',
        tags: ['AI', 'Telegram', 'Agent'],
        nodes: [
            { type: 'erc8004-agent-runtime', position: { x: 250, y: 150 } },
            { type: 'telegram-ai-agent', position: { x: 500, y: 100 } },
            { type: 'wallet-auth', position: { x: 500, y: 250 } },
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 0, target: 2 },
        ],
    },
    {
        id: 'full-stack-dapp',
        name: 'Full Stack dApp',
        description: 'Complete setup with smart contract, frontend, auth, and RPC',
        icon: Layout,
        colorClass: 'success',
        tags: ['Full Stack', 'Production'],
        nodes: [
            { type: 'stylus-contract', position: { x: 200, y: 150 } },
            { type: 'frontend-scaffold', position: { x: 450, y: 100 } },
            { type: 'wallet-auth', position: { x: 450, y: 200 } },
            { type: 'rpc-provider', position: { x: 450, y: 300 } },
            { type: 'repo-quality-gates', position: { x: 700, y: 150 } },
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 0, target: 2 },
            { source: 0, target: 3 },
            { source: 1, target: 4 },
        ],
    },
];

interface BlueprintTemplatesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Helper function to get color CSS variable for each template
function getColorVar(colorClass: string): string {
    const colorMap: Record<string, string> = {
        'accent-primary': 'var(--color-accent-primary)',
        'accent-secondary': 'var(--color-accent-secondary)',
        'success': 'var(--color-success)',
        'warning': 'var(--color-warning)',
        'info': 'var(--color-info)',
        'error': 'var(--color-error)',
    };
    return colorMap[colorClass] || colorMap['accent-primary'];
}

export function BlueprintTemplatesModal({ isOpen, onClose }: BlueprintTemplatesModalProps) {
    const { addNode, addEdge, resetBlueprint } = useBlueprintStore();
    const [loading, setLoading] = useState<string | null>(null);

    const applyTemplate = async (template: Template) => {
        setLoading(template.id);

        // Reset first
        resetBlueprint();

        // Small delay for animation
        await new Promise(r => setTimeout(r, 200));

        // Add nodes and keep track of their IDs
        const nodeIds: string[] = [];
        for (const nodeConfig of template.nodes) {
            const node = addNode(nodeConfig.type, nodeConfig.position);
            nodeIds.push(node.id);
        }

        // Add edges using the created node IDs
        for (const edge of template.edges) {
            addEdge(nodeIds[edge.source], nodeIds[edge.target]);
        }

        setLoading(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
                    >
                        <div className="bg-gradient-to-b from-[hsl(var(--color-bg-elevated))] to-[hsl(var(--color-bg-base))] border border-[hsl(var(--color-border-default)/0.6)] rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--color-border-default)/0.5)]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-[hsl(var(--color-accent-primary)/0.1)]">
                                        <Sparkles className="w-5 h-5 text-[hsl(var(--color-accent-primary))]" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-[hsl(var(--color-text-primary))]">Blueprint Templates</h2>
                                        <p className="text-xs text-[hsl(var(--color-text-muted))]">Start with a pre-built foundation</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-[hsl(var(--color-bg-elevated)/0.5)] text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Templates grid */}
                            <div className="p-4 grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                                {TEMPLATES.map((template) => {
                                    const Icon = template.icon;
                                    const isLoading = loading === template.id;
                                    const colorVar = getColorVar(template.colorClass);

                                    return (
                                        <motion.button
                                            key={template.id}
                                            onClick={() => applyTemplate(template)}
                                            disabled={!!loading}
                                            className={cn(
                                                'group relative p-4 rounded-xl text-left',
                                                'bg-[hsl(var(--color-bg-elevated)/0.3)] border border-[hsl(var(--color-border-default)/0.5)]',
                                                'hover:bg-[hsl(var(--color-bg-elevated)/0.5)] hover:border-[hsl(var(--color-text-primary)/0.2)]',
                                                'transition-all duration-200',
                                                isLoading && 'opacity-50 pointer-events-none'
                                            )}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {/* Icon */}
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                                                style={{
                                                    backgroundColor: `hsl(${colorVar} / 0.1)`,
                                                    borderWidth: '1px',
                                                    borderColor: `hsl(${colorVar} / 0.2)`,
                                                }}
                                            >
                                                <Icon
                                                    className="w-5 h-5"
                                                    style={{ color: `hsl(${colorVar})` }}
                                                />
                                            </div>

                                            {/* Content */}
                                            <h3 className="font-medium text-[hsl(var(--color-text-primary))] mb-1 group-hover:text-[hsl(var(--color-accent-primary))] transition-colors">
                                                {template.name}
                                            </h3>
                                            <p className="text-xs text-[hsl(var(--color-text-muted))] line-clamp-2 mb-3">
                                                {template.description}
                                            </p>

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-1">
                                                {template.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-[10px] px-1.5 py-0.5 rounded bg-[hsl(var(--color-bg-base)/0.5)] text-[hsl(var(--color-text-muted))]"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Arrow indicator */}
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="w-4 h-4 text-[hsl(var(--color-accent-primary))]" />
                                            </div>

                                            {/* Loading state */}
                                            {isLoading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--color-bg-base)/0.5)] rounded-xl">
                                                    <div className="w-6 h-6 border-2 border-[hsl(var(--color-accent-primary)/0.3)] border-t-[hsl(var(--color-accent-primary))] rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-[hsl(var(--color-border-default)/0.5)] bg-[hsl(var(--color-bg-base)/0.3)]">
                                <p className="text-xs text-[hsl(var(--color-text-muted))] text-center">
                                    Templates will replace your current canvas. Make sure to save first!
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
