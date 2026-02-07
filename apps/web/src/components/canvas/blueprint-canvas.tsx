'use client';

import { useCallback, useMemo, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Trash2, Undo2, Redo2, Maximize2, ZoomOut, ZoomIn } from 'lucide-react';
import { nodeTypeToColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { useAuthStore } from '@/store/auth';
import { useBlueprintStore } from '@/store/blueprint';
import { ForgeNode } from './forge-node';
import { ForgeEdge } from './forge-edge';
import { CanvasSuggestions } from './canvas-suggestions';
import { NodeSearchModal, useNodeSearchModal } from './node-search-modal';
import { AIChatbot } from './ai-chatbot';
import { getPluginIds } from '@cradle/plugin-config';
import { useSessionMonitor, useAuthState } from '@/hooks/useSessionMonitor';
import { AuthStatusBadge } from '@/components/auth/auth-guard';
import { motion, AnimatePresence } from 'framer-motion';
import type { BlueprintNode as BPNode, BlueprintEdge as BPEdge } from '@dapp-forge/blueprint-schema';

// Dynamically build node types from plugin registry
const nodeTypes: NodeTypes = getPluginIds().reduce(
  (acc, pluginId) => {
    acc[pluginId] = ForgeNode;
    return acc;
  },
  {} as NodeTypes
);

// Custom edge types
const edgeTypes: EdgeTypes = {
  default: ForgeEdge,
};

function BlueprintCanvasInner() {
  const {
    blueprint,
    addNode,
    addEdge: storeAddEdge,
    selectNode,
    updateNode,
    removeEdge,
    removeNode,
    selectedNodeId,
    undo,
    redo,
    canUndo,
    canRedo,
    ghostNodes,
    ghostEdges,
    activateGhostNode,
  } = useBlueprintStore();
  const { isConnected, address } = useAccount();
  const {
    isWalletConnected,
    isFullyAuthenticated,
    showAuthModal,
    openAuthModal,
    closeAuthModal,
    walletError,
    githubError,
    getConnectionState,
  } = useAuthStore();

  // Use session monitor for automatic session handling
  const { checkSession } = useSessionMonitor({
    showModalOnExpiry: true,
    onWalletDisconnect: () => {
      console.log('Wallet disconnected');
    },
    onGitHubExpiry: () => {
      console.log('GitHub session expired');
    },
    onAccountChange: (newAddress, oldAddress) => {
      console.log(`Account changed from ${oldAddress} to ${newAddress}`);
    },
  });

  // Get comprehensive auth state
  const authState = useAuthState();
  const connectionState = getConnectionState();

  // Node search modal
  const { isOpen: showNodeSearch, close: closeNodeSearch } = useNodeSearchModal();

  // Zoom controls
  const { fitView, zoomIn, zoomOut, screenToFlowPosition } = useReactFlow();
  const { zoom } = useViewport();
  const zoomPercentage = Math.round(zoom * 100);

  // Convert blueprint nodes to ReactFlow nodes (including ghost nodes)
  const blueprintNodes: Node[] = useMemo(() => {
    const real = blueprint.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      selected: node.id === selectedNodeId,
      data: {
        ...node.config,
        nodeType: node.type,
        label: node.config.label || node.config.contractName || node.config.agentName || node.type,
        isGhost: false,
      },
    }));
    const ghosts = ghostNodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      selected: false,
      draggable: false,
      selectable: false,
      data: {
        ...node.config,
        nodeType: node.type,
        label: node.config.label || node.config.contractName || node.config.agentName || node.type,
        isGhost: true,
      },
    }));
    return [...real, ...ghosts];
  }, [blueprint.nodes, ghostNodes, selectedNodeId]);

  // Convert blueprint edges to ReactFlow edges (including ghost edges)
  const blueprintEdges: Edge[] = useMemo(() => {
    const real = blueprint.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      animated: true,
      data: { isGhost: false },
    }));
    const ghosts = ghostEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      animated: false,
      data: { isGhost: true },
    }));
    return [...real, ...ghosts];
  }, [blueprint.edges, ghostEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(blueprintNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(blueprintEdges);

  // Sync blueprint store changes to local ReactFlow state
  useEffect(() => {
    setNodes(blueprintNodes);
  }, [blueprintNodes, setNodes]);

  useEffect(() => {
    setEdges(blueprintEdges);
  }, [blueprintEdges, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        // Redundant setEdges removed as store update triggers effect
        storeAddEdge(connection.source, connection.target);
      }
    },
    [storeAddEdge]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      // Check wallet connection - use isConnected from wagmi for real-time status
      const walletConnected = isConnected || isWalletConnected;
      if (!walletConnected) {
        openAuthModal();
        return;
      }

      // Check GitHub authentication
      if (!isFullyAuthenticated) {
        openAuthModal();
        return;
      }

      // Use screenToFlowPosition for accurate drop location
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Redundant setNodes removed as store update triggers effect
      addNode(type, position);
    },
    [addNode, isConnected, isWalletConnected, isFullyAuthenticated, openAuthModal, screenToFlowPosition]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      // If this is a ghost node, activate it instead of selecting
      if (node.data?.isGhost) {
        activateGhostNode(node.id);
        return;
      }
      const walletConnected = isConnected || isWalletConnected;
      if (!walletConnected) {
        openAuthModal(() => selectNode(node.id));
        return;
      }
      selectNode(node.id);
    },
    [isConnected, isWalletConnected, openAuthModal, selectNode, activateGhostNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateNode(node.id, { position: node.position });
    },
    [updateNode]
  );

  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      deletedEdges.forEach(edge => {
        removeEdge(edge.id);
      });
    },
    [removeEdge]
  );

  const onNodesDelete = useCallback(
    (deletedNodes: Node[]) => {
      deletedNodes.forEach(node => {
        removeNode(node.id);
      });
      // Close config panel if deleted node was selected
      if (deletedNodes.some(n => n.id === selectedNodeId)) {
        selectNode(null);
      }
    },
    [removeNode, selectedNodeId, selectNode]
  );

  // State for delete all confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Delete all nodes handler
  const handleDeleteAll = useCallback(() => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
      return;
    }

    // Actually delete all nodes
    blueprint.nodes.forEach(node => {
      removeNode(node.id);
    });
    selectNode(null);
    setShowDeleteConfirm(false);
  }, [showDeleteConfirm, blueprint.nodes, removeNode, selectNode]);

  // Show auth error notification
  const hasAuthError = walletError || githubError;
  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + Z = Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z = Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div data-tour="canvas" className="relative h-full w-full">
      {/* Canvas container with overflow hidden */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-forge-border/80 bg-[hsl(var(--color-bg-base))]">
        {/* Top bar with hint and actions */}
        <div className="absolute inset-x-0 top-3 z-20 flex items-center justify-between px-3">
          {/* Auth status badge */}
          <div className="flex items-center gap-1">
            <AuthStatusBadge className="min-w-[120px]" />
            {/* Left side - Undo/Redo buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg',
                  'transition-all duration-200 backdrop-blur',
                  canUndo
                    ? 'bg-[hsl(var(--color-bg-elevated))] text-forge-muted ring-1 ring-[hsl(var(--color-border-subtle))] hover:bg-[hsl(var(--color-bg-hover))] hover:text-white'
                    : 'bg-[hsl(var(--color-bg-subtle))] text-forge-border cursor-not-allowed'
                )}
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg',
                  'transition-all duration-200 backdrop-blur',
                  canRedo
                    ? 'bg-[hsl(var(--color-bg-elevated))] text-forge-muted ring-1 ring-[hsl(var(--color-border-subtle))] hover:bg-[hsl(var(--color-bg-hover))] hover:text-white'
                    : 'bg-[hsl(var(--color-bg-subtle))] text-forge-border ring-1 cursor-not-allowed'
                )}
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Subtle canvas hint - centered */}
          <div className="pointer-events-none inline-flex items-center gap-2 rounded-full bg-[hsl(var(--color-bg-elevated))/0.8] px-3 py-1 text-[11px] font-medium text-forge-muted ring-1 ring-[hsl(var(--color-border-subtle))] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan/80" />
            <span>Drag to pan · Scroll to zoom · ? shortcuts</span>
          </div>

          {/* Right side controls: Delete All + Zoom Controls */}
          <div className="flex items-center gap-2">
            {/* Delete All button - only show when there are nodes */}
            {nodes.length > 0 && (
              <button
                onClick={handleDeleteAll}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium',
                  'transition-all duration-200 backdrop-blur',
                  showDeleteConfirm
                    ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40 hover:bg-red-500/30'
                    : 'bg-[hsl(var(--color-bg-elevated))] text-forge-muted ring-1 ring-[hsl(var(--color-border-subtle))] hover:bg-[hsl(var(--color-bg-hover))] hover:text-white'
                )}
              >
                <Trash2 className="h-3 w-3" />
                <span>{showDeleteConfirm ? 'Click to confirm' : 'Delete All'}</span>
                {showDeleteConfirm && (
                  <span className="ml-1 text-[9px] text-red-400/70">({nodes.length})</span>
                )}
              </button>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 rounded-lg bg-[hsl(var(--color-bg-elevated))] p-1 ring-1 ring-[hsl(var(--color-border-subtle))] backdrop-blur">
              <button
                onClick={() => zoomOut()}
                className="p-1.5 rounded hover:bg-[hsl(var(--color-bg-hover))] text-forge-muted hover:text-white transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[11px] font-mono text-forge-muted min-w-[40px] text-center">
                {zoomPercentage}%
              </span>
              <button
                onClick={() => zoomIn()}
                className="p-1.5 rounded hover:bg-[hsl(var(--color-bg-hover))] text-forge-muted hover:text-white transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <div className="w-px h-4 bg-forge-border/50 mx-0.5" />
              <button
                onClick={() => fitView({ padding: 0.2 })}
                className="p-1.5 rounded hover:bg-[hsl(var(--color-bg-hover))] text-forge-muted hover:text-white transition-colors"
                title="Fit to view"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onNodeDragStop={onNodeDragStop}
          onEdgesDelete={onEdgesDelete}
          onNodesDelete={onNodesDelete}
          deleteKeyCode={['Delete', 'Backspace']}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[20, 20]}
          defaultEdgeOptions={{
            animated: true,
            style: { strokeWidth: 2 },
          }}
          className="z-10 rounded-2xl bg-transparent backdrop-blur-sm"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(255,255,255, 0.15)"
          />
          {/* Minimap - positioned to left-bottom */}
          <MiniMap
            position="bottom-left"
            pannable
            zoomable
            nodeColor={(node) => {
              const color = nodeTypeToColor(node.type || '');
              const colorMap: Record<string, string> = {
                'node-contracts': '#00d4ff',
                'node-payments': '#ffaa00',
                'node-agents': '#ff00ff',
                'node-app': '#00ff88',
                'node-quality': '#ff6b6b',
                'node-telegram': '#0088cc',
                'node-intelligence': '#a855f7',
                'accent-cyan': '#00d4ff',
                'accent-purple': '#8b5cf6',
              };
              return colorMap[color] || '#666';
            }}
            maskColor="rgba(0, 0, 0, 0.85)"
            className="!bg-forge-surface/90 !border-forge-border !rounded-xl !shadow-sm cursor-pointer"
            style={{ left: 12, right: 'auto' }}
          />
        </ReactFlow>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="max-w-md text-center">
              {/* Animated rings */}
              <div className="relative mx-auto mb-6 w-24 h-24">
                <div className="absolute inset-0 rounded-full border border-dashed border-accent-cyan/30 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-2 rounded-full border border-dashed border-accent-purple/20 animate-[spin_15s_linear_infinite_reverse]" />
                <div className="absolute inset-4 rounded-full border border-forge-border/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/10 border border-accent-cyan/30 flex items-center justify-center backdrop-blur-sm">
                    <svg
                      className="w-6 h-6 text-accent-cyan"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-white">
                Compose [N] skills for your project
              </h3>
              <p className="text-sm text-forge-muted mb-6 max-w-xs mx-auto">
                Drag components from the palette, connect them, then build a skills repo that Claude Code can use to scaffold your project.
              </p>

              {/* Quick hints */}
              <div className="flex items-center justify-center gap-4 text-xs text-forge-muted">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-forge-elevated/30 border border-forge-border/30">
                  <span className="text-accent-cyan">←</span>
                  <span>Drag from palette</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-forge-elevated/30 border border-forge-border/30">
                  <kbd className="px-1 py-0.5 text-[10px] bg-forge-bg rounded font-mono">?</kbd>
                  <span>Shortcuts</span>
                </div>
              </div>

              {/* Auth hint */}
              {!isFullyAuthenticated && (
                <button
                  onClick={() => openAuthModal()}
                  className="mt-4 text-xs text-accent-cyan hover:underline pointer-events-auto"
                >
                  {connectionState === 'none_connected'
                    ? 'Connect wallet & GitHub to get started'
                    : connectionState === 'wallet_only'
                      ? 'Connect GitHub to unlock all features'
                      : 'Connect wallet to get started'
                  }
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Canvas-based suggestions - rendered OUTSIDE overflow-hidden container */}
      <CanvasSuggestions />

      {/* AI Chatbot - Right bottom corner with genie animation */}
      <AIChatbot
        onApplyWorkflow={(blueprintNodes: BPNode[], blueprintEdges: BPEdge[]) => {
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
        }}
      />

      {/* Node Search Modal (Cmd+K) */}
      <NodeSearchModal open={showNodeSearch} onClose={closeNodeSearch} />
    </div>
  );
}

// Wrap with ReactFlowProvider so suggestions can access viewport hooks
export function BlueprintCanvas() {
  // Avoid hydration mismatches by only rendering on the client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <ReactFlowProvider>
      <BlueprintCanvasInner />
    </ReactFlowProvider>
  );
}
