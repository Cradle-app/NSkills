import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { RobinhoodContractsConfig } from '@dapp-forge/blueprint-schema';
import { generateContractConstants, generateContractDocs } from './templates';

/**
 * Robinhood Contracts Plugin
 * Generates contract address constants from official Robinhood Chain documentation
 */
export class RobinhoodContractsPlugin extends BasePlugin<z.infer<typeof RobinhoodContractsConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'robinhood-contracts',
    name: 'Robinhood Contracts',
    version: '0.1.0',
    description: 'Contract address constants for Robinhood Chain (tokens, bridge, precompiles)',
    category: 'app',
    tags: ['robinhood', 'orbit', 'arbitrum', 'contracts', 'addresses', 'constants'],
  };

  readonly configSchema = RobinhoodContractsConfig as unknown as z.ZodType<z.infer<typeof RobinhoodContractsConfig>>;

  readonly ports: PluginPort[] = [
    { id: 'constants-out', name: 'Contract Constants', type: 'output', dataType: 'config' },
    { id: 'types-out', name: 'Types', type: 'output', dataType: 'types' },
  ];

  getDefaultConfig(): Partial<z.infer<typeof RobinhoodContractsConfig>> {
    return {
      includeTokenContracts: true,
      includeCoreContracts: true,
      includeBridgeContracts: true,
      includePrecompiles: true,
      includeMiscContracts: true,
      generateTypes: true,
      generateDocs: true,
    };
  }

  async generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    this.addFile(
      output,
      'robinhood-contracts.ts',
      generateContractConstants(config),
      'frontend-lib'
    );

    if (config.generateDocs) {
      this.addDoc(
        output,
        'docs/robinhood/contracts.md',
        'Robinhood Chain Contract Addresses',
        generateContractDocs(config)
      );
    }

    context.logger.info('Generated Robinhood contract constants', { nodeId: node.id });

    return output;
  }
}
