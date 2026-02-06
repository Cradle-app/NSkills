'use client';

import { useState, useEffect } from 'react';
import { Check, Info } from 'lucide-react';
import { ERC721InteractionPanel } from '@/components/contract-interactions/ERC721InteractionPanel';
import { useBlueprintStore } from '@/store/blueprint';
import { getAvailableFunctions } from '@/lib/contract-instructions-generator';
import { cn } from '@/lib/utils';
import {
  formStyles,
  labelStyles,
  cardStyles,
  selectionStyles,
  badgeStyles,
} from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

// All available ERC721 functions
const ALL_FUNCTIONS = ['mint', 'mint_to', 'safe_mint', 'burn'];

export function ERC721StylusForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  // Get config values
  const contractAddress = config.contractAddress as string | undefined;
  const network = (config.network as 'arbitrum' | 'arbitrum-sepolia' | 'superposition' | 'superposition-testnet') || 'arbitrum-sepolia';
  const selectedFunctions = (config.selectedFunctions as string[]) || ALL_FUNCTIONS;

  // Local state for function selection
  const [localSelectedFunctions, setLocalSelectedFunctions] = useState<string[]>(selectedFunctions);

  // Get function metadata
  const functionMeta = getAvailableFunctions('erc721-stylus');

  // Sync local state with config when it changes
  useEffect(() => {
    setLocalSelectedFunctions(selectedFunctions);
  }, [selectedFunctions]);

  // Toggle function selection
  const toggleFunction = (funcName: string) => {
    const newSelection = localSelectedFunctions.includes(funcName)
      ? localSelectedFunctions.filter(f => f !== funcName)
      : [...localSelectedFunctions, funcName];

    setLocalSelectedFunctions(newSelection);
    updateNodeConfig(nodeId, {
      ...config,
      selectedFunctions: newSelection,
    });
  };

  // Select/deselect all
  const selectAll = () => {
    setLocalSelectedFunctions(ALL_FUNCTIONS);
    updateNodeConfig(nodeId, {
      ...config,
      selectedFunctions: ALL_FUNCTIONS,
    });
  };

  const deselectAll = () => {
    setLocalSelectedFunctions([]);
    updateNodeConfig(nodeId, {
      ...config,
      selectedFunctions: [],
    });
  };

  return (
    <div className="space-y-0 -mx-4 -mt-2">
      {/* Function Selection Section */}
      <div className="px-4 py-4 bg-[hsl(var(--color-bg-base)/0.5)] border-b border-[hsl(var(--color-border-subtle))]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-[hsl(var(--color-text-primary))]">Contract Functions</h4>
            <span className={badgeStyles.primary}>
              {localSelectedFunctions.length}/{ALL_FUNCTIONS.length} selected
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={selectAll}
              className={cn(
                'text-[10px] px-2 py-1 rounded-md',
                'bg-[hsl(var(--color-border-default)/0.5)]',
                'text-[hsl(var(--color-text-muted))]',
                'hover:bg-[hsl(var(--color-border-default))]',
                'hover:text-[hsl(var(--color-text-primary))]',
                'transition-colors duration-150'
              )}
            >
              All
            </button>
            <button
              onClick={deselectAll}
              className={cn(
                'text-[10px] px-2 py-1 rounded-md',
                'bg-[hsl(var(--color-border-default)/0.5)]',
                'text-[hsl(var(--color-text-muted))]',
                'hover:bg-[hsl(var(--color-border-default))]',
                'hover:text-[hsl(var(--color-text-primary))]',
                'transition-colors duration-150'
              )}
            >
              None
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {functionMeta.map((func) => {
            const isSelected = localSelectedFunctions.includes(func.name);
            return (
              <div
                key={func.name}
                onClick={() => toggleFunction(func.name)}
                className={isSelected ? selectionStyles.itemSelected : selectionStyles.item}
              >
                <div className={cn(
                  selectionStyles.checkbox,
                  isSelected ? selectionStyles.checkboxChecked : selectionStyles.checkboxUnchecked
                )}>
                  <Check className={selectionStyles.checkIcon} strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className={cn(
                      selectionStyles.itemTitle,
                      isSelected
                        ? 'text-[hsl(var(--color-success))]'
                        : 'text-[hsl(var(--color-text-muted))]'
                    )}>
                      {func.name}
                    </code>
                  </div>
                  <p className={selectionStyles.itemDescription}>
                    {func.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info about markdown generation */}
        <div className={cn(cardStyles.info, 'mt-3')}>
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-[hsl(var(--color-info))] flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-[hsl(var(--color-info))] leading-relaxed">
              Function selections will generate a markdown file with instructions for your LLM to modify the contract code.
            </p>
          </div>
        </div>
      </div>

      {/* Existing interaction panel */}
      <ERC721InteractionPanel
        contractAddress={contractAddress}
        network={network}
      />
    </div>
  );
}
