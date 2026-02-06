'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Upload,
  Play,
  Settings,
  Hexagon,
  Sparkles,
  Wand2,
  LayoutTemplate,
  Keyboard,
  Clock,
} from 'lucide-react';
import { useBlueprintStore } from '@/store/blueprint';
import { Button } from '@/components/ui/button';
import { GenerateDialog } from '@/components/dialogs/generate-dialog';
import { ProjectSettingsDialog } from '@/components/dialogs/project-settings-dialog';
import { GitHubConnect } from '@/components/auth/github-connect';
import { WalletConnectButton } from '@/components/auth/wallet-connect-button';
import { AuthGuard } from '@/components/auth/auth-guard';
import { AIChatModal } from '@/components/dialogs/ai-chat-modal';
import { BlueprintTemplatesModal } from '@/components/templates/blueprint-templates-modal';
import { KeyboardShortcutsModal, useKeyboardShortcutsModal } from '@/components/dialogs/keyboard-shortcuts-modal';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { RecentBlueprintsDropdown, useRecentBlueprints } from '@/components/ui/recent-blueprints-dropdown';
import type { BlueprintNode, BlueprintEdge } from '@dapp-forge/blueprint-schema';
import { AuthFlowModal } from '../auth/auth-flow-modal';

export function Header() {
  const [showGenerate, setShowGenerate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const { isOpen: showShortcuts, open: openShortcuts, close: closeShortcuts } = useKeyboardShortcutsModal();
  const {
    blueprint,
    exportBlueprint,
    importBlueprint,
  } = useBlueprintStore();
  const { addRecent } = useRecentBlueprints();

  // Handle applying AI-generated workflow to canvas
  const handleApplyWorkflow = useCallback((
    blueprintNodes: BlueprintNode[],
    blueprintEdges: BlueprintEdge[]
  ) => {
    // Get current state and update the blueprint directly
    const currentState = useBlueprintStore.getState();

    // Update blueprint with new nodes and edges (append to existing)
    useBlueprintStore.setState({
      ...currentState,
      blueprint: {
        ...currentState.blueprint,
        nodes: [...currentState.blueprint.nodes, ...blueprintNodes],
        edges: [...currentState.blueprint.edges, ...blueprintEdges],
        updatedAt: new Date().toISOString(),
      },
    });
  }, []);

  // Persist current blueprint into "Recent Blueprints"
  useEffect(() => {
    try {
      const json = exportBlueprint();
      addRecent({
        id: blueprint.id,
        name: blueprint.config.project.name || 'Untitled',
        updatedAt: new Date(blueprint.updatedAt || Date.now()),
        nodeCount: blueprint.nodes.length,
        json,
      });
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprint.updatedAt]);

  const handleExport = () => {
    const json = exportBlueprint();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${blueprint.config.project.name || 'blueprint'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        try {
          importBlueprint(text);
        } catch (error) {
          console.error('Failed to import blueprint:', error);
        }
      }
    };
    input.click();
  };

  return (
    <header className="h-14 border-b border-forge-border/50 bg-forge-surface/80 backdrop-blur-xl flex items-center justify-between px-4 z-50 relative">
      {/* Subtle gradient line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/20 to-transparent" />

      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-accent-cyan to-accent-cyan/60 p-[1.5px]">
            <div className="w-full h-full rounded-[6px] bg-forge-bg flex items-center justify-center">
              <Hexagon className="w-4 h-4 text-accent-cyan" strokeWidth={2} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-white leading-tight">
              Cradle
            </span>
            {/* <span className="text-[9px] uppercase tracking-wider text-forge-muted -mt-0.5">
              Web3 Foundation Builder
            </span> */}
          </div>
        </motion.div>

        <div className="h-6 w-px bg-forge-border/40 mx-2" />

        <RecentBlueprintsDropdown
          currentBlueprintName={blueprint.config.project.name || 'Untitled'}
          onSelect={(bp) => {
            if (bp.json) {
              importBlueprint(bp.json);
            } else {
              setShowSettings(true);
            }
          }}
        />
      </div>

      {/* Center - Stats */}
      <motion.div
        className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-forge-elevated/40 border border-forge-border/30"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
          <span className="text-xs font-mono text-forge-text">
            <span className="text-accent-cyan font-medium">{blueprint.nodes.length}</span>
            <span className="text-forge-muted ml-1">nodes</span>
          </span>
        </div>
        <div className="w-px h-3 bg-forge-border/40" />
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
          <span className="text-xs font-mono text-forge-text">
            <span className="text-accent-purple font-medium">{blueprint.edges.length}</span>
            <span className="text-forge-muted ml-1">edges</span>
          </span>
        </div>
        <div className="w-px h-3 bg-forge-border/40" />
        {/* <div className="flex items-center gap-1.5" title="Last saved">
          <Clock className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400/80" suppressHydrationWarning>
            {blueprint.updatedAt
              ? new Date(blueprint.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Not saved'}
          </span>
        </div> */}
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex items-center gap-1"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTemplates(true)}
          className="h-8 px-2.5 text-accent-cyan hover:text-white hover:bg-accent-cyan/10"
        >
          <LayoutTemplate className="w-3.5 h-3.5 mr-1.5" />
          Templates
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleImport}
          className="h-8 px-2.5 text-forge-muted hover:text-white hover:bg-forge-elevated/50"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Import
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          className="h-8 px-2.5 text-forge-muted hover:text-white hover:bg-forge-elevated/50"
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          Export
        </Button>

        <div className="w-px h-5 bg-forge-border/40 mx-1" />

        <AuthGuard onClick={() => setShowAI(true)}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-forge-muted hover:text-white hover:bg-forge-elevated/50"
          >
            <Wand2 className="w-3.5 h-3.5 mr-1.5" />
            AI Assist
          </Button>
        </AuthGuard>

        <div className="w-px h-5 bg-forge-border/40 mx-1" />

        {/* Wallet Connect Button */}
        <WalletConnectButton variant="default" />

        <div className="w-px h-5 bg-forge-border/40 mx-1" />

        <GitHubConnect />

        {/* <ThemeToggle /> */}

        {/* <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(true)}
          className="h-8 w-8 p-0 text-forge-muted hover:text-white hover:bg-forge-elevated/50"
        >
          <Settings className="w-3.5 h-3.5" />
        </Button> */}

        <AuthGuard onClick={() => setShowGenerate(true)} requireGitHub={true}>
          <Button
            size="sm"
            data-tour="generate"
            className="h-8 ml-1 bg-accent-cyan hover:bg-accent-cyan/90 text-black font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            Generate
            <Play className="w-2.5 h-2.5 ml-1 fill-current" />
          </Button>
        </AuthGuard>
      </motion.div>

      {/* Dialogs */}
      <GenerateDialog open={showGenerate} onOpenChange={setShowGenerate} />
      <ProjectSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
      <AIChatModal
        open={showAI}
        onOpenChange={setShowAI}
        onApplyWorkflow={handleApplyWorkflow}
      />
      <BlueprintTemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
      />
      <KeyboardShortcutsModal
        open={showShortcuts}
        onClose={closeShortcuts}
      />
      {/* <AuthFlowModal
        open={showAuthModal}
        onOpenChange={closeAuthModal}
        requireGitHub={true}
      /> */}
    </header>
  );
}
