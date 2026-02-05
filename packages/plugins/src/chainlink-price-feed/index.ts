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
 * Chainlink Price Feed Plugin
 *
 * Wires Chainlink Data Feeds (AggregatorV3Interface) into generated projects.
 * Uses contract addresses per chain; the component package reads latestRoundData.
 */

const ChainlinkPriceFeedSchema = z.object({
  chain: z.enum(['arbitrum', 'arbitrum-sepolia']).default('arbitrum'),
  feedAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  staleAfterSeconds: z.number().int().min(30).max(86400).optional(),
});

export class ChainlinkPriceFeedPlugin extends BasePlugin<z.infer<typeof ChainlinkPriceFeedSchema>> {
  readonly metadata: PluginMetadata = {
    id: 'chainlink-price-feed',
    name: 'Chainlink Price Feed',
    version: '0.1.0',
    description: 'Fetch on-chain price feeds from Chainlink Data Feeds on Arbitrum',
    category: 'analytics',
    tags: ['chainlink', 'oracle', 'prices', 'feeds', 'analytics', 'aggregator'],
  };

  readonly configSchema = ChainlinkPriceFeedSchema as unknown as z.ZodType<z.infer<typeof ChainlinkPriceFeedSchema>>;

  readonly componentPath = 'packages/components/chainlink-price-feed';
  readonly componentPackage = '@cradle/chainlink-price-feed';
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

  getDefaultConfig(): Partial<z.infer<typeof ChainlinkPriceFeedSchema>> {
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

    this.addEnvVar(
      output,
      'CHAINLINK_FEED_ADDRESS',
      'Chainlink Data Feed contract address (AggregatorV3Interface)',
      { required: true, defaultValue: config.feedAddress }
    );

    this.addEnvVar(
      output,
      'CHAINLINK_CHAIN',
      'Chain for Chainlink feed (e.g. ARBITRUM or ARBITRUM_SEPOLIA)',
      { required: true, defaultValue: config.chain.toUpperCase().replace('-', '_') }
    );

    if (config.staleAfterSeconds !== undefined) {
      this.addEnvVar(
        output,
        'CHAINLINK_STALE_AFTER_SECONDS',
        'Max age in seconds before price is considered stale',
        { required: false, defaultValue: String(config.staleAfterSeconds) }
      );
    }

    const docs = this.generateDocs(config);
    this.addFile(output, 'chainlink-price-feed.md', docs, 'docs');

    context.logger.info('Configured Chainlink Price Feed', {
      nodeId: node.id,
      chain: config.chain,
      feedAddress: config.feedAddress,
    });

    return output;
  }

  private generateDocs(config: z.infer<typeof ChainlinkPriceFeedSchema>): string {
    return `# Chainlink Price Feed

This project is configured to use **Chainlink Data Feeds** on \`${config.chain}\`.

## Environment Variables

- \`CHAINLINK_FEED_ADDRESS\` – AggregatorV3Interface contract address
- \`CHAINLINK_CHAIN\` – Chain identifier (e.g. \`ARBITRUM\`, \`ARBITRUM_SEPOLIA\`)
${config.staleAfterSeconds ? `- \`CHAINLINK_STALE_AFTER_SECONDS\` – prices older than ${config.staleAfterSeconds}s are considered stale` : ''}

## Usage

Use \`useChainlinkPrice\` from \`@cradle/chainlink-price-feed\` with your feed address and chain.
The hook reads \`latestRoundData()\` from the aggregator contract and formats the price using the feed's decimals (usually 8).
`;
  }
}
