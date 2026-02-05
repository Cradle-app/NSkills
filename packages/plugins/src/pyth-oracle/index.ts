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

/**
 * Pyth Price Oracle Plugin
 *
 * This plugin wires Pyth Network price feeds into generated projects.
 * For now it focuses on configuration and environment variables; you can
 * use the generated docs to integrate Pyth in your own code.
 */

const PythOracleSchema = z.object({
  chain: z.enum(['arbitrum', 'arbitrum-sepolia']).default('arbitrum'),
  priceFeedId: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  staleAfterSeconds: z.number().int().min(30).max(86400).optional(),
});

export class PythOraclePlugin extends BasePlugin<z.infer<typeof PythOracleSchema>> {
  readonly metadata: PluginMetadata = {
    id: 'pyth-oracle',
    name: 'Pyth Price Oracle',
    version: '0.1.0',
    description: 'Fetch on-chain price feeds from Pyth Network on Arbitrum',
    category: 'analytics',
    tags: ['pyth', 'oracle', 'prices', 'feeds', 'analytics'],
  };

  readonly configSchema = PythOracleSchema as unknown as z.ZodType<z.infer<typeof PythOracleSchema>>;

  /**
   * Path to the pre-built component package (relative to project root)
   * The orchestrator will copy this entire directory to the output
   */
  readonly componentPath = 'packages/components/pyth-oracle';

  /**
   * Package name for the component
   */
  readonly componentPackage = '@cradle/pyth-oracle';

  /**
   * Path mappings for component files to enable intelligent routing
   * When frontend-scaffold is present, files are routed to apps/web/src/
   */
  readonly componentPathMappings = {
    'src/hooks/**': 'frontend-hooks' as const,
    'src/api.ts': 'frontend-lib' as const,
    'src/types.ts': 'frontend-types' as const,
    'src/index.ts': 'frontend-lib' as const,
  };

  readonly ports: PluginPort[] = [
    {
      id: 'price-out',
      name: 'Price Feed Output',
      type: 'output',
      dataType: 'types',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof PythOracleSchema>> {
    return {
      chain: 'arbitrum',
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    // Environment variables for Pyth integration
    this.addEnvVar(
      output,
      'PYTH_PRICE_FEED_ID',
      'Pyth price feed ID (32-byte hex string)',
      {
        required: true,
        defaultValue: config.priceFeedId,
      }
    );

    this.addEnvVar(
      output,
      'PYTH_CHAIN',
      'Chain for Pyth oracle (e.g. ARBITRUM or ARBITRUM_SEPOLIA)',
      {
        required: true,
        defaultValue: config.chain.toUpperCase(),
      }
    );

    if (config.staleAfterSeconds !== undefined) {
      this.addEnvVar(
        output,
        'PYTH_STALE_AFTER_SECONDS',
        'Max age in seconds before a Pyth price is considered stale',
        {
          required: false,
          defaultValue: String(config.staleAfterSeconds),
        }
      );
    }

    // Simple docs to guide integration
    const docs = this.generateDocs(config);
    this.addFile(
      output,
      'pyth-oracle.md',
      docs,
      'docs'
    );

    context.logger.info('Configured Pyth Price Oracle', {
      nodeId: node.id,
      chain: config.chain,
      priceFeedId: config.priceFeedId,
    });

    return output;
  }

  private generateDocs(config: z.infer<typeof PythOracleSchema>): string {
    return `# Pyth Price Oracle

This project is configured to use **Pyth Network** price feeds on \`${config.chain}\`.

## Environment Variables

- \`PYTH_PRICE_FEED_ID\` – Pyth price feed ID (32-byte hex string)
- \`PYTH_CHAIN\` – Chain identifier, e.g. \`ARBITRUM\` or \`ARBITRUM_SEPOLIA\`
${config.staleAfterSeconds ? `- \`PYTH_STALE_AFTER_SECONDS\` – prices older than ${config.staleAfterSeconds}s are considered stale` : ''}

## Example Usage (backend or serverless)

You can follow the reference implementation from FlowForge's Pyth oracle processor and adapt it to this project.

High level steps:

1. Use your preferred RPC provider for the configured chain.
2. Instantiate the Pyth contract with the appropriate ABI and address.
3. Call \`getPriceUnsafe(priceFeedId)\` or \`getPrice(priceFeedId)\`.
4. Apply staleness checks using \`publishTime\` and \`PYTH_STALE_AFTER_SECONDS\`.

> Note: This plugin focuses on configuration and wiring; you are free to implement the runtime fetch logic in the environment that best fits your app (server, edge, or client-side with care).
`;
  }
}

