import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { AsterDexConfig } from '@dapp-forge/blueprint-schema';

/**
 * Aster DEX Plugin
 *
 * Guidance-only block that ships a reference component package and
 * the Python API service scaffold for Aster DEX integrations.
 */
export class AsterDexPlugin extends BasePlugin<z.infer<typeof AsterDexConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'aster-dex',
    name: 'Aster DEX',
    version: '0.1.0',
    description: 'Guidance block for Aster DEX integration',
    category: 'agents',
    tags: ['aster', 'dex', 'perpetuals', 'trading', 'guidance'],
  };

  readonly configSchema = AsterDexConfig as unknown as z.ZodType<z.infer<typeof AsterDexConfig>>;

  readonly componentPath = 'packages/components/aster-dex';

  readonly componentPackage = '@cradle/aster-dex';

  readonly componentPathMappings = {
    'src/index.ts': 'frontend-lib' as const,
    'src/example.tsx': 'frontend-components' as const,
    'src/aster-service.py': 'frontend-lib' as const,
  };

  readonly ports: PluginPort[] = [
    {
      id: 'aster-guide-in',
      name: 'Aster Guidance',
      type: 'input',
      dataType: 'config',
      required: false,
    },
    {
      id: 'aster-guide-out',
      name: 'Aster Integration Context',
      type: 'output',
      dataType: 'config',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof AsterDexConfig>> {
    return {};
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    this.addFile(
      output,
      'aster-dex-guidance.md',
      this.buildAsterDexGuidanceDoc(),
      'docs'
    );

    this.addScript(
      output,
      'aster:guide',
      'echo "See packages/aster-dex/README.md and docs/aster-dex-guidance.md"',
      'Aster DEX integration guidance'
    );

    context.logger.info('Generated Aster DEX guidance block', {
      nodeId: node.id,
      componentPackage: this.componentPackage,
    });

    return output;
  }

  private buildAsterDexGuidanceDoc(): string {
    return `# Aster DEX Guidance

This node adds a guidance-first Aster DEX integration scaffold to your generated app.

## What gets generated

- A component package: \`packages/aster-dex\`
- A Python API reference service: \`src/aster-service.py\` inside that package
- Documentation and guidance for adapting the service to your own backend

## Notes

- This block does not execute trading actions by itself.
- Treat the service file as a reference implementation and validate it for your stack.
- Add authentication, rate limiting, and production safeguards before going live.`;
  }
}

