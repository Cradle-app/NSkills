import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { RobinhoodDeploymentConfig } from '@dapp-forge/blueprint-schema';
import {
  generateDeploymentGuide,
  generateHardhatConfig,
  generateDeployScript,
} from './templates';

/**
 * Robinhood Deployment Plugin
 * Generates deployment guides and scripts for Robinhood Chain
 */
export class RobinhoodDeploymentPlugin extends BasePlugin<z.infer<typeof RobinhoodDeploymentConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'robinhood-deployment',
    name: 'Robinhood Deployment',
    version: '0.1.0',
    description: 'Deployment guide and scripts for Robinhood Chain smart contracts',
    category: 'app',
    tags: ['robinhood', 'orbit', 'arbitrum', 'deployment', 'hardhat', 'foundry'],
  };

  readonly configSchema = RobinhoodDeploymentConfig as unknown as z.ZodType<z.infer<typeof RobinhoodDeploymentConfig>>;

  readonly ports: PluginPort[] = [
    { id: 'deploy-guide-out', name: 'Deployment Guide', type: 'output', dataType: 'config' },
    { id: 'scripts-out', name: 'Deploy Scripts', type: 'output', dataType: 'code' },
  ];

  getDefaultConfig(): Partial<z.infer<typeof RobinhoodDeploymentConfig>> {
    return {
      framework: 'hardhat',
      includeExampleContract: true,
      includeVerificationSteps: true,
      includeScripts: true,
      outputPath: 'robinhood',
    };
  }

  async generate(node: BlueprintNode, context: ExecutionContext): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();
    const basePath = config.outputPath || 'robinhood';

    this.addDoc(
      output,
      `docs/${basePath}/deployment-guide.md`,
      'Robinhood Chain Deployment Guide',
      generateDeploymentGuide(config)
    );

    if (config.framework === 'hardhat') {
      const hardhatConfig = generateHardhatConfig(config);
      if (hardhatConfig) {
        this.addFile(output, 'robinhood-network.config.ts', hardhatConfig, 'contract-scripts');
      }

      const deployScript = generateDeployScript(config);
      if (deployScript) {
        this.addFile(output, 'scripts/deploy-robinhood.ts', deployScript, 'contract-scripts');
      }
    }

    this.addEnvVar(output, 'PRIVATE_KEY', 'Private key for deployment (never commit!)', {
      required: true,
      secret: true,
    });

    context.logger.info('Generated Robinhood deployment guide', { nodeId: node.id });

    return output;
  }
}
