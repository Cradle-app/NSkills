import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { QuicknodeConfig } from '@dapp-forge/blueprint-schema';

/**
 * Quicknode Plugin
 *
 * Integrates Quicknode infrastructure (RPC, Webhooks, Streams, IPFS, etc.)
 * for blockchain data access across 77+ chains.
 */
export class QuicknodePlugin extends BasePlugin<z.infer<typeof QuicknodeConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'quicknode',
    name: 'Quicknode',
    version: '0.1.0',
    description: 'Multi-chain API: RPC, Webhooks, Streams, IPFS, Key-Value Store, and more',
    category: 'app',
    tags: ['rpc', 'webhooks', 'streams', 'ipfs', 'quicknode', 'blockchain-api'],
  };

  readonly configSchema = QuicknodeConfig as unknown as z.ZodType<z.infer<typeof QuicknodeConfig>>;

  readonly componentPath = 'packages/components/quicknode';
  readonly componentPackage = '@cradle/quicknode';
  readonly componentPathMappings = {
    'src/api.ts': 'frontend-lib' as const,
    'src/constants.ts': 'frontend-lib' as const,
    'src/types.ts': 'frontend-types' as const,
    'src/index.ts': 'frontend-lib' as const,
  };

  readonly ports: PluginPort[] = [
    {
      id: 'provider-out',
      name: 'Quicknode Config',
      type: 'output',
      dataType: 'config',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof QuicknodeConfig>> {
    return {
      selectedService: 'core-rpc',
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
      'QUICKNODE_ENDPOINT_URL',
      'Quicknode endpoint URL (e.g. https://{name}.quiknode.pro/{token}/)',
      { required: true }
    );

    this.addEnvVar(
      output,
      'QUICKNODE_API_KEY',
      'Quicknode API key (for REST APIs like IPFS, Key-Value Store)',
      { required: config.selectedService !== 'core-rpc', secret: true }
    );

    if (config.selectedService === 'webhooks' || config.selectedService === 'streams') {
      this.addEnvVar(
        output,
        'QUICKNODE_WEBHOOK_SECRET',
        'Webhook/Stream security token for HMAC signature verification',
        { required: false, secret: true }
      );
    }

    context.logger.info('Configured Quicknode node', {
      nodeId: node.id,
      selectedService: config.selectedService,
    });

    return output;
  }
}
