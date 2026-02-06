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
 * Compound V3 Lending Plugin
 *
 * Wires Compound V3 Comet (supply/borrow/withdraw/repay) into generated projects.
 */

const CompoundLendingSchema = z.object({
  chain: z.enum(['arbitrum']).default('arbitrum'),
  cometAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/).optional(),
});

export class CompoundLendingPlugin extends BasePlugin<z.infer<typeof CompoundLendingSchema>> {
  readonly metadata: PluginMetadata = {
    id: 'compound-lending',
    name: 'Compound Lending',
    version: '0.1.0',
    description: 'Supply, borrow, withdraw, and repay on Compound V3 (Arbitrum cUSDCv3)',
    category: 'agents',
    tags: ['compound', 'lending', 'borrow', 'supply', 'defi', 'arbitrum', 'comet'],
  };

  readonly configSchema = CompoundLendingSchema as unknown as z.ZodType<z.infer<typeof CompoundLendingSchema>>;

  readonly componentPath = 'packages/components/compound-lending';
  readonly componentPackage = '@cradle/compound-lending';
  readonly componentPathMappings = {
    'src/hooks/**': 'frontend-hooks' as const,
    'src/**': 'frontend-lib' as const,
  };

  readonly ports: PluginPort[] = [
    { id: 'lending-out', name: 'Lending Output', type: 'output', dataType: 'types' },
  ];

  getDefaultConfig(): Partial<z.infer<typeof CompoundLendingSchema>> {
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
      'COMPOUND_CHAIN',
      'Chain for Compound V3 (ARBITRUM)',
      { required: true, defaultValue: config.chain.toUpperCase() }
    );

    if (config.cometAddress) {
      this.addEnvVar(
        output,
        'COMPOUND_COMET_ADDRESS',
        'Compound V3 Comet contract address',
        { required: false, defaultValue: config.cometAddress }
      );
    }

    const docs = this.generateDocs(config);
    this.addFile(output, 'compound-lending.md', docs, 'docs');

    context.logger.info('Configured Compound Lending', {
      nodeId: node.id,
      chain: config.chain,
    });

    return output;
  }

  private generateDocs(config: z.infer<typeof CompoundLendingSchema>): string {
    return `# Compound V3 Lending

This project is configured to use **Compound V3 (Comet)** on \`${config.chain}\`.

## Environment Variables

- \`COMPOUND_CHAIN\` – Chain identifier (e.g. \`ARBITRUM\`)
${config.cometAddress ? `- \`COMPOUND_COMET_ADDRESS\` – Comet contract (optional override)` : ''}

## Usage

Use \`useCompoundAccountData\` from \`@cradle/compound-lending\` to read supply/borrow balances and rates.
Operations: supply, withdraw, borrow, repay (base asset USDC on Arbitrum).

## Reference

- [Compound V3 Docs](https://docs.compound.finance/)
`;
  }
}
