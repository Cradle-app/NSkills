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
 * Aave V3 Lending Plugin
 *
 * Wires Aave V3 supply/borrow/withdraw/repay into generated projects.
 */

const AaveLendingSchema = z.object({
  chain: z.enum(['arbitrum', 'arbitrum-sepolia', 'ethereum-sepolia']).default('arbitrum-sepolia'),
  poolAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
  poolDataProviderAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
});

export class AaveLendingPlugin extends BasePlugin<z.infer<typeof AaveLendingSchema>> {
  readonly metadata: PluginMetadata = {
    id: 'aave-lending',
    name: 'Aave Lending',
    version: '0.1.0',
    description: 'Supply, borrow, withdraw, and repay on Aave V3 (Arbitrum, Ethereum Sepolia)',
    category: 'agents',
    tags: ['aave', 'lending', 'borrow', 'supply', 'defi', 'arbitrum'],
  };

  readonly configSchema = AaveLendingSchema as unknown as z.ZodType<z.infer<typeof AaveLendingSchema>>;

  readonly componentPath = 'packages/components/aave-lending';
  readonly componentPackage = '@cradle/aave-lending';
  readonly componentPathMappings = {
    'src/hooks/**': 'frontend-hooks' as const,
    'src/api.ts': 'frontend-lib' as const,
    'src/constants.ts': 'frontend-lib' as const,
    'src/types.ts': 'frontend-types' as const,
    'src/index.ts': 'frontend-lib' as const,
  };

  readonly ports: PluginPort[] = [
    { id: 'lending-out', name: 'Lending Output', type: 'output', dataType: 'types' },
  ];

  getDefaultConfig(): Partial<z.infer<typeof AaveLendingSchema>> {
    return { chain: 'arbitrum' };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    this.addEnvVar(
      output,
      'AAVE_CHAIN',
      'Chain for Aave V3 (ARBITRUM, ARBITRUM_SEPOLIA, or ETHEREUM_SEPOLIA)',
      { required: true, defaultValue: config.chain.toUpperCase().replace(/-/g, '_') }
    );

    if (config.poolAddress) {
      this.addEnvVar(
        output,
        'AAVE_POOL_ADDRESS',
        'Aave V3 Pool contract address',
        { required: false, defaultValue: config.poolAddress }
      );
    }

    if (config.poolDataProviderAddress) {
      this.addEnvVar(
        output,
        'AAVE_POOL_DATA_PROVIDER_ADDRESS',
        'Aave V3 Pool Data Provider contract address',
        { required: false, defaultValue: config.poolDataProviderAddress }
      );
    }

    const docs = this.generateDocs(config);
    this.addFile(output, 'aave-lending.md', docs, 'docs');

    context.logger.info('Configured Aave Lending', {
      nodeId: node.id,
      chain: config.chain,
    });

    return output;
  }

  private generateDocs(config: z.infer<typeof AaveLendingSchema>): string {
    return `# Aave V3 Lending

This project is configured to use **Aave V3** on \`${config.chain}\`.

## Environment Variables

- \`AAVE_CHAIN\` – Chain identifier (e.g. \`ARBITRUM\`, \`ARBITRUM_SEPOLIA\`, \`ETHEREUM_SEPOLIA\`)
${config.poolAddress ? `- \`AAVE_POOL_ADDRESS\` – Aave V3 Pool contract (optional override)` : ''}
${config.poolDataProviderAddress ? `- \`AAVE_POOL_DATA_PROVIDER_ADDRESS\` – Pool Data Provider (optional override)` : ''}

## Usage

Use \`useAaveLending\` and \`useAavePosition\` from \`@cradle/aave-lending\` to supply, borrow, withdraw, and repay.
Operations: supply, withdraw, borrow, repay, enable/disable collateral.

## Reference

- [Aave V3 Docs](https://docs.aave.com/developers/getting-started/readme)
`;
  }
}
