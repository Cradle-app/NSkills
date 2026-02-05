'use client';

import { useCallback, useMemo, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type EdgeTypes,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Trash2, Undo2, Redo2 } from 'lucide-react';
import { nodeTypeToColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { useAuthStore } from '@/store/auth';
import { useBlueprintStore } from '@/store/blueprint';
import { ForgeNode } from './forge-node';
import { ForgeEdge } from './forge-edge';
import { CanvasSuggestions } from './canvas-suggestions';
import { getPluginIds } from '@cradle/plugin-config';
import { useSessionMonitor, useAuthState } from '@/hooks/useSessionMonitor';
import { AuthStatusBadge } from '@/components/auth/auth-guard';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Convert blueprint nodes to ReactFlow nodes
  const blueprintNodes: Node[] = useMemo(() =>
    blueprint.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      selected: node.id === selectedNodeId, // Enable keyboard delete
      data: {
        ...node.config,
        nodeType: node.type,
        label: node.config.label || node.config.contractName || node.config.agentName || node.type,
      },
    })), [blueprint.nodes, selectedNodeId]);

  // Convert blueprint edges to ReactFlow edges
  const blueprintEdges: Edge[] = useMemo(() =>
    blueprint.edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'default',
      animated: true,
    })), [blueprint.edges]);

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
        const newEdge = storeAddEdge(connection.source, connection.target);
        if (newEdge) {
          setEdges((eds) => addEdge({
            ...connection,
            id: newEdge.id,
            type: 'default',
            animated: true,
          }, eds));
        }
      }
    },
    [storeAddEdge, setEdges]
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

      const position = {
        x: event.clientX - 280, // Offset for sidebar
        y: event.clientY - 56,   // Offset for header
      };

      const newNode = addNode(type, position);

      if (newNode) {
        setNodes((nds) => [
          ...nds,
          {
            id: newNode.id,
            type: newNode.type,
            position: newNode.position,
            data: {
              ...newNode.config,
              nodeType: newNode.type,
              label: (newNode.config as Record<string, unknown>).contractName ||
                (newNode.config as Record<string, unknown>).agentName ||
                newNode.type,
            },
          },
        ]);
      }
    },
    [addNode, setNodes, isConnected, isWalletConnected, isFullyAuthenticated, openAuthModal]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const walletConnected = isConnected || isWalletConnected;
      if (!walletConnected) {
        openAuthModal(() => selectNode(node.id));
        return;
      }
      selectNode(node.id);
    },
    [isConnected, isWalletConnected, openAuthModal, selectNode]
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
    <div className="relative h-full w-full">
      {/* Canvas container with overflow hidden */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-forge-border/60 bg-gradient-to-b from-black/70 via-black/80 to-black/95">
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
                    ? 'bg-black/50 text-forge-muted ring-1 ring-white/5 hover:bg-black/70 hover:text-white/80'
                    : 'bg-black/30 text-forge-muted/30 cursor-not-allowed'
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
                    ? 'bg-black/50 text-forge-muted ring-1 ring-white/5 hover:bg-black/70 hover:text-white/80'
                    : 'bg-black/30 text-forge-muted/30 cursor-not-allowed'
                )}
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Subtle canvas hint - centered */}
          <div className="pointer-events-none inline-flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-forge-muted ring-1 ring-white/5 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan/80" />
            <span>Drag to pan · Scroll to zoom · Ctrl+Z undo</span>
          </div>

          {/* Delete All button - only show when there are nodes */}
          {nodes.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium',
                'transition-all duration-200 backdrop-blur',
                showDeleteConfirm
                  ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40 hover:bg-red-500/30'
                  : 'bg-black/50 text-forge-muted ring-1 ring-white/5 hover:bg-black/70 hover:text-white/80'
              )}
            >
              <Trash2 className="h-3 w-3" />
              <span>{showDeleteConfirm ? 'Click to confirm' : 'Delete All'}</span>
              {showDeleteConfirm && (
                <span className="ml-1 text-[9px] text-red-400/70">({nodes.length})</span>
              )}
            </button>
          )}

          {/* Right spacer when no nodes */}
          {nodes.length === 0 && <div className="w-24" />}
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
          className="z-10 rounded-2xl bg-black/60 backdrop-blur-sm"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="rgba(255,255,255, 0.15)"
          />
          <Controls className="!bg-forge-surface/95 !border-forge-border !rounded-xl !shadow-sm !text-forge-muted" />
          <MiniMap
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
            className="!bg-forge-surface/90 !border-forge-border !rounded-xl !shadow-sm"
          />
        </ReactFlow>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="max-w-xs text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-forge-border/60 bg-black/60">
                <svg
                  className="h-6 w-6 text-forge-muted"
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
              <h3 className="mb-1 text-sm font-semibold text-white">
                Drop your first component
              </h3>
              <p className="text-xs text-forge-muted">
                Drag a node from the left palette into the canvas to begin your blueprint.
              </p>

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
