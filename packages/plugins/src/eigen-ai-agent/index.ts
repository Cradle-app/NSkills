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
import { EigenAIConfig } from '@dapp-forge/blueprint-schema';

/**
 * EigenAI Agent Plugin
 *
 * LLM agent node that wires EigenAI usage and (optionally) signature
 * verification into generated projects.
 */
export class EigenAIAgentPlugin extends BasePlugin<z.infer<typeof EigenAIConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'eigen-ai-agent',
    name: 'EigenAI',
    version: '0.1.0',
    description: 'LLM agent powered by EigenAI with optional signature verification',
    category: 'agents',
    tags: ['ai', 'agent', 'eigenai', 'llm', 'signature-verification'],
  };

  readonly configSchema = EigenAIConfig as unknown as z.ZodType<z.infer<typeof EigenAIConfig>>;

  readonly componentPath = 'packages/components/eigen-ai-agent';
  readonly componentPackage = '@cradle/eigen-ai-agent';
  readonly componentPathMappings = {
    'src/api.ts': 'frontend-lib' as const,
    'src/types.ts': 'frontend-types' as const,
    'src/index.ts': 'frontend-lib' as const,
  };

  /**
   * Ports describe how the node connects in the canvas graph.
   */
  readonly ports: PluginPort[] = [
    {
      id: 'prompt-in',
      name: 'Prompt / Context',
      type: 'input',
      dataType: 'config',
      required: false,
    },
    {
      id: 'response-out',
      name: 'EigenAI Response',
      type: 'output',
      dataType: 'api',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof EigenAIConfig>> {
    return {
      baseUrl: 'https://eigenai.eigencloud.xyz/v1',
      model: 'gpt-oss-120b-f16',
      network: 'mainnet',
      temperature: 0.2,
      enableSignatureVerification: true,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const chainId = config.network === 'sepolia' ? '11155111' : '1';

    // Core EigenAI environment
    this.addEnvVar(
      output,
      'EIGENAI_BASE_URL',
      'Base URL for EigenAI API (OpenAI-compatible)',
      { required: true, defaultValue: config.baseUrl }
    );

    this.addEnvVar(
      output,
      'EIGENAI_MODEL',
      'Default EigenAI model identifier (for example "gpt-oss-120b-f16")',
      { required: true, defaultValue: config.model }
    );

    this.addEnvVar(
      output,
      'EIGENAI_API_KEY',
      'EigenAI API key used for authenticated requests',
      { required: true, secret: true }
    );

    // Chain ID used for signature verification
    this.addEnvVar(
      output,
      'EIGENAI_CHAIN_ID',
      'Chain ID used for EigenAI response signatures (1 = Mainnet, 11155111 = Sepolia)',
      {
        required: config.enableSignatureVerification,
        defaultValue: chainId,
      }
    );

    this.addEnvVar(
      output,
      'EIGENAI_ENABLE_SIGNATURE_VERIFICATION',
      'When set to "true", EigenAI helpers will verify response signatures by default',
      {
        required: false,
        defaultValue: config.enableSignatureVerification ? 'true' : 'false',
      }
    );

    context.logger.info('Configured EigenAI agent node', {
      nodeId: node.id,
      network: config.network,
      model: config.model,
      enableSignatureVerification: config.enableSignatureVerification,
    });

    return output;
  }
}
