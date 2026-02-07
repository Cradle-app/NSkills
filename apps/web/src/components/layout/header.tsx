'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Upload,
  Hexagon,
  Sparkles,
  LayoutTemplate,
  Play,
  Clock,
} from 'lucide-react';
import { useBlueprintStore } from '@/store/blueprint';
import { Button } from '@/components/ui/button';
import { GenerateDialog } from '@/components/dialogs/generate-dialog';
import { ProjectSettingsDialog } from '@/components/dialogs/project-settings-dialog';
import { GitHubConnect } from '@/components/auth/github-connect';
import { WalletConnectButton } from '@/components/auth/wallet-connect-button';
import { AuthGuard } from '@/components/auth/auth-guard';
import { BlueprintTemplatesModal } from '@/components/templates/blueprint-templates-modal';
import { KeyboardShortcutsModal, useKeyboardShortcutsModal } from '@/components/dialogs/keyboard-shortcuts-modal';
import { RecentBlueprintsDropdown, useRecentBlueprints } from '@/components/ui/recent-blueprints-dropdown';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HeaderProps {
  showAI?: boolean;
  setShowAI?: (open: boolean) => void;
}

export function Header({ setShowAI }: HeaderProps = {}) {
  const [showGenerate, setShowGenerate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const { isOpen: showShortcuts, open: openShortcuts, close: closeShortcuts } = useKeyboardShortcutsModal();
  const {
    blueprint,
    exportBlueprint,
    importBlueprint,
  } = useBlueprintStore();
  const { addRecent } = useRecentBlueprints();

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
    <header className="h-14 border-b border-[hsl(var(--color-border-default))] bg-[hsl(var(--color-bg-subtle)/0.95)] backdrop-blur-xl flex items-center justify-between px-4 z-[200] relative">
      {/* Subtle gradient line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--color-accent-primary)/0.15)] to-transparent" />

      {/* LEFT: Identity & Project Selection */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--color-accent-primary))] to-[hsl(var(--color-accent-primary)/0.7)] p-[1.5px]">
            <div className="w-full h-full rounded-[6px] bg-[hsl(var(--color-bg-base))] flex items-center justify-center">
              <Hexagon className="w-4 h-4 text-[hsl(var(--color-accent-primary))]" strokeWidth={2} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold text-[hsl(var(--color-text-primary))] leading-tight">
              <span className="text-[hsl(var(--color-accent-primary))]">[N]</span>skills
            </span>
            {/* <span className="text-[9px] uppercase tracking-wider text-forge-muted -mt-0.5">
              Compose N skills for your Web3 project
            </span> */}
          </div>
        </motion.div>

        <div className="h-5 w-px bg-[hsl(var(--color-border-subtle))]" />

        {/* Project Selector */}
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

      {/* RIGHT: Tools, Stats, Auth, Actions */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Stats - Minimalist */}
        <div className="hidden lg:flex items-center gap-4 mr-2 px-3 py-1.5 rounded-lg border border-[hsl(var(--color-border-subtle)/0.5)] bg-[hsl(var(--color-bg-base)/0.5)]">
          <div className="flex items-center gap-2" title="Nodes">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-accent-primary))]" />
            <span className="text-xs font-medium text-[hsl(var(--color-text-secondary))]">
              {blueprint.nodes.length} <span className="text-[hsl(var(--color-text-muted))] font-normal">nodes</span>
            </span>
          </div>
          <div className="flex items-center gap-2" title="Edges">
            <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-accent-secondary))]" />
            <span className="text-xs font-medium text-[hsl(var(--color-text-secondary))]">
              {blueprint.edges.length} <span className="text-[hsl(var(--color-text-muted))] font-normal">edges</span>
            </span>
          </div>
          {blueprint.updatedAt && (
            <div className="flex items-center gap-1.5 ml-1 border-l border-[hsl(var(--color-border-subtle))] pl-3" title={`Last saved: ${new Date(blueprint.updatedAt).toLocaleTimeString()}`}>
              <Clock className="w-3 h-3 text-[hsl(var(--color-text-muted))]" />
              <span className="text-[10px] text-[hsl(var(--color-text-muted))]" suppressHydrationWarning>
                {new Date(blueprint.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>

        {/* Toolbar: Templates, Import, Export, AI */}
        <div className="flex items-center p-1 rounded-lg bg-[hsl(var(--color-bg-muted)/0.5)] border border-[hsl(var(--color-border-subtle))]">
          <SimpleTooltip content="Templates">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowTemplates(true)}
              className="text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))]"
            >
              <LayoutTemplate className="w-4 h-4" />
            </Button>
          </SimpleTooltip>

          <div className="w-px h-4 bg-[hsl(var(--color-border-subtle))] mx-0.5" />

          <SimpleTooltip content="Import Blueprint">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleImport}
              className="text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))]"
            >
              <Upload className="w-4 h-4" />
            </Button>
          </SimpleTooltip>

          <SimpleTooltip content="Export Blueprint">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleExport}
              className="text-[hsl(var(--color-text-muted))] hover:text-[hsl(var(--color-text-primary))]"
            >
              <Download className="w-4 h-4" />
            </Button>
          </SimpleTooltip>
        </div>

        {/* Auth Group */}
        <div className="flex items-center gap-2 ml-1">
          <WalletConnectButton variant="compact" className="h-9" />
          <GitHubConnect />
        </div>

        {/* Primary Action */}
        <AuthGuard onClick={() => setShowGenerate(true)} requireGitHub={true}>
          <Button
            type="button"
            size="sm"
            data-tour="generate"
            className={cn(
              "h-9 pl-3 pr-4 ml-1 shadow-md shadow-[hsl(var(--color-accent-primary)/0.2)]",
              "bg-gradient-to-r from-[hsl(var(--color-accent-primary))] to-[hsl(var(--color-accent-primary)/0.9)]",
              "hover:brightness-110 transition-all"
            )}
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
            Build
          </Button>
        </AuthGuard>
      </motion.div>

      {/* Dialogs - AIChatModal is rendered at page level for state stability */}
      <GenerateDialog open={showGenerate} onOpenChange={setShowGenerate} />
      <ProjectSettingsDialog open={showSettings} onOpenChange={setShowSettings} />
      <BlueprintTemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
      />
      <KeyboardShortcutsModal
        open={showShortcuts}
        onClose={closeShortcuts}
      />
    </header>
  );
}
