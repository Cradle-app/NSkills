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
    iconColor: string;
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
        iconColor: 'accent-purple',
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
        iconColor: 'accent-yellow',
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
        iconColor: 'accent-cyan',
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
        iconColor: 'emerald',
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
                        <div className="bg-gradient-to-b from-forge-surface to-forge-bg border border-forge-border/60 rounded-2xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-forge-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-accent-cyan/10">
                                        <Sparkles className="w-5 h-5 text-accent-cyan" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-white">Blueprint Templates</h2>
                                        <p className="text-xs text-forge-muted">Start with a pre-built foundation</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg hover:bg-forge-elevated/50 text-forge-muted hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Templates grid */}
                            <div className="p-4 grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                                {TEMPLATES.map((template) => {
                                    const Icon = template.icon;
                                    const isLoading = loading === template.id;

                                    return (
                                        <motion.button
                                            key={template.id}
                                            onClick={() => applyTemplate(template)}
                                            disabled={!!loading}
                                            className={cn(
                                                'group relative p-4 rounded-xl text-left',
                                                'bg-forge-elevated/30 border border-forge-border/50',
                                                'hover:bg-forge-elevated/50 hover:border-white/20',
                                                'transition-all duration-200',
                                                isLoading && 'opacity-50 pointer-events-none'
                                            )}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            {/* Icon */}
                                            <div className={cn(
                                                'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                                                `bg-${template.iconColor}/10 border border-${template.iconColor}/20`
                                            )}>
                                                <Icon className={cn('w-5 h-5', `text-${template.iconColor}`)} />
                                            </div>

                                            {/* Content */}
                                            <h3 className="font-medium text-white mb-1 group-hover:text-accent-cyan transition-colors">
                                                {template.name}
                                            </h3>
                                            <p className="text-xs text-forge-muted line-clamp-2 mb-3">
                                                {template.description}
                                            </p>

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-1">
                                                {template.tags.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className="text-[10px] px-1.5 py-0.5 rounded bg-forge-bg/50 text-forge-muted"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Arrow indicator */}
                                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="w-4 h-4 text-accent-cyan" />
                                            </div>

                                            {/* Loading state */}
                                            {isLoading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-forge-bg/50 rounded-xl">
                                                    <div className="w-6 h-6 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-forge-border/50 bg-forge-bg/30">
                                <p className="text-xs text-forge-muted text-center">
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
