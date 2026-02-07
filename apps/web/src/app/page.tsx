'use client';

import { useState } from 'react';
import { Panel, Group as PanelGroup, Separator } from 'react-resizable-panels';
import { motion } from 'framer-motion';
import { BlueprintCanvas } from '@/components/canvas/blueprint-canvas';
import { NodePalette } from '@/components/palette/node-palette';
import { ConfigPanel } from '@/components/config/config-panel';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { AIChatModal } from '@/components/dialogs/ai-chat-modal';
import { GripVertical } from 'lucide-react';
import { useBlueprintStore } from '@/store/blueprint';
import type { BlueprintNode, BlueprintEdge } from '@dapp-forge/blueprint-schema';

function ResizeHandle({ className = '' }: { className?: string }) {
  return (
    <Separator
      className={`group relative flex w-1.5 items-center justify-center bg-transparent hover:bg-accent-cyan/10 active:bg-accent-cyan/20 transition-all duration-200 ${className}`}
    >
      <div className="z-10 flex h-12 w-5 items-center justify-center rounded-full border border-forge-border/50 bg-forge-surface/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all duration-200 shadow-lg">
        <GripVertical className="h-3.5 w-3.5 text-forge-muted" />
      </div>
    </Separator>
  );
}

export default function HomePage() {
  const { selectedNodeId } = useBlueprintStore();
  const hasSelection = selectedNodeId !== null;
  const [showAI, setShowAI] = useState(false);

  const handleApplyWorkflow = (blueprintNodes: BlueprintNode[], blueprintEdges: BlueprintEdge[]) => {
    const currentState = useBlueprintStore.getState();
    useBlueprintStore.setState({
      ...currentState,
      blueprint: {
        ...currentState.blueprint,
        nodes: [...currentState.blueprint.nodes, ...blueprintNodes],
        edges: [...currentState.blueprint.edges, ...blueprintEdges],
        updatedAt: new Date().toISOString(),
      },
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">
      {/* Animated background */}
      <div className="absolute inset-0 bg-forge-bg">
        {/* Mesh gradient background */}

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <Header showAI={showAI} setShowAI={setShowAI} />

        {/* Main content with resizable panels */}
        <PanelGroup orientation="horizontal" className="flex-1">
          {/* Left sidebar - Node palette */}
          <Panel
            defaultSize="30%" 
            minSize="300px" 
            maxSize="35%"
          >
            <div data-tour="palette" className="h-full">
              <NodePalette />
            </div>
          </Panel>

          <ResizeHandle />

          {/* Main canvas - expands when no selection */}
          <Panel
            defaultSize={hasSelection ? "54%" : "82%"}
            minSize="30%"
          >
            <main className="h-full relative">
              <div data-tour="canvas" className="h-full">
                <BlueprintCanvas />
              </div>
            </main>
          </Panel>

          {/* Config panel - only shown when node is selected */}
          {hasSelection && (
            <>
              <ResizeHandle />

              <Panel
                defaultSize="28%" 
                minSize="200px" 
                maxSize="45%"
              >
                <motion.div
                  className="h-full"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div data-tour="config" className="h-full">
                    <ConfigPanel />
                  </div>
                </motion.div>
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* Toast notifications */}
      <Toaster />

      {/* AI Chat Modal - rendered at page level so state survives Header remounts (Fast Refresh) */}
      <AIChatModal
        open={showAI}
        onOpenChange={setShowAI}
        onApplyWorkflow={handleApplyWorkflow}
      />
    </div>
  );
}
