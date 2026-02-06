'use client';

import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { UniswapSwapConfig } from '@dapp-forge/blueprint-schema';

/**
 * Uniswap V3 Swap Plugin
 *
 * Wires Uniswap V3 exact-input swaps into generated projects.
 */
export class UniswapSwapPlugin extends BasePlugin<z.infer<typeof UniswapSwapConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'uniswap-swap',
    name: 'Uniswap Swap',
    version: '0.1.0',
    description: 'Swap tokens via Uniswap V3 (Arbitrum + Sepolia)',
    category: 'agents',
    tags: ['uniswap', 'swap', 'dex', 'defi', 'arbitrum', 'sepolia'],
  };

  readonly configSchema = UniswapSwapConfig as unknown as z.ZodType<z.infer<typeof UniswapSwapConfig>>;

  /**
   * Path to the pre-built component package (relative to project root)
   */
  readonly componentPath = 'packages/components/uniswap-swap';

  /**
   * Package name for the component
   */
  readonly componentPackage = '@cradle/uniswap-swap';

  /**
   * Path mappings for component files to enable intelligent routing
   */
  readonly componentPathMappings = {
    'src/api.ts': 'frontend-lib' as const,
    'src/constants.ts': 'frontend-lib' as const,
    'src/types.ts': 'frontend-types' as const,
    'src/index.ts': 'frontend-lib' as const,
  };

  readonly ports: PluginPort[] = [
    {
      id: 'wallet-in',
      name: 'Wallet Address',
      type: 'input',
      dataType: 'config',
      required: true,
    },
    {
      id: 'swap-out',
      name: 'Swap Output',
      type: 'output',
      dataType: 'config',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof UniswapSwapConfig>> {
    return {
      chain: 'arbitrum',
      defaultSlippageBps: 50,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    this.addEnvVar(
      output,
      'UNISWAP_CHAIN',
      'Chain for Uniswap V3 swaps (ARBITRUM, ARBITRUM_SEPOLIA, or ETHEREUM_SEPOLIA)',
      {
        required: true,
        defaultValue: config.chain.toUpperCase().replace(/-/g, '_'),
      }
    );

    this.addEnvVar(
      output,
      'UNISWAP_DEFAULT_SLIPPAGE_BPS',
      'Default Uniswap V3 slippage in basis points (e.g. 50 = 0.5%)',
      {
        required: false,
        defaultValue: String(config.defaultSlippageBps ?? 50),
      }
    );

    context.logger.info('Configured Uniswap V3 Swap', {
      nodeId: node.id,
      chain: config.chain,
      defaultSlippageBps: config.defaultSlippageBps,
      componentPackage: this.componentPackage,
    });

    return output;
  }
}

