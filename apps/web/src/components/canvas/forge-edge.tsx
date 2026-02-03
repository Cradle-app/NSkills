'use client';

import { memo, useState, useCallback } from 'react';
import { getBezierPath, EdgeLabelRenderer, type EdgeProps } from 'reactflow';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBlueprintStore } from '@/store/blueprint';

function ForgeEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const removeEdge = useBlueprintStore((state) => state.removeEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      removeEdge(id);
    },
    [id, removeEdge]
  );

  return (
    <>
      {/* Invisible wider path for easier hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Glow effect - removed transitions to prevent lag during node movement */}
      <path
        id={`${id}-glow`}
        d={edgePath}
        fill="none"
        stroke="url(#edge-gradient)"
        strokeWidth={isHovered ? 8 : 6}
        strokeOpacity={isHovered ? 0.5 : 0.3}
        filter="blur(4px)"
      />

      {/* Main edge - removed transitions to prevent lag during node movement */}
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        fill="none"
        stroke={isHovered ? '#ff4444' : 'url(#edge-gradient)'}
        strokeWidth={isHovered ? 3 : 2}
        markerEnd={markerEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Delete button at edge center */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={cn(
            'nodrag nopan transition-opacity duration-200',
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
          )}
        >
          <button
            onClick={handleDelete}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full',
              'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30',
              'text-white transition-transform duration-200 hover:scale-110',
              'border-2 border-forge-surface'
            )}
            title="Disconnect"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </EdgeLabelRenderer>

      {/* Gradient definition */}
      <defs>
        <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#ff00ff" />
        </linearGradient>
      </defs>
    </>
  );
}

export const ForgeEdge = memo(ForgeEdgeComponent);
