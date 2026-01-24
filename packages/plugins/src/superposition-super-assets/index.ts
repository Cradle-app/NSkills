import { z } from 'zod';
import {
  BasePlugin,
  type PluginMetadata,
  type PluginPort,
  type CodegenOutput,
  type BlueprintNode,
  type ExecutionContext,
} from '@dapp-forge/plugin-sdk';
import { SuperpositionSuperAssetsConfig } from '@dapp-forge/blueprint-schema';
import {
  generateSuperAssetsTypes,
  generateSuperAssetsABIs,
  generateSuperAssetHook,
  generateYieldTrackingHook,
  generateBalanceHook,
  generateSuperAssetsConfig,
  generateBalanceUI,
  generateSuperAssetsDocs,
} from './templates';

/**
 * Superposition Super Assets Plugin
 * Generates integration for yield-bearing Super Assets
 */
export class SuperpositionSuperAssetsPlugin extends BasePlugin<z.infer<typeof SuperpositionSuperAssetsConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'superposition-super-assets',
    name: 'Super Assets',
    version: '0.1.0',
    description: 'Yield-bearing wrapped token integration for Superposition',
    category: 'app',
    tags: ['superposition', 'super-assets', 'yield', 'defi', 'wrapped-tokens'],
  };

  readonly configSchema = SuperpositionSuperAssetsConfig as unknown as z.ZodType<z.infer<typeof SuperpositionSuperAssetsConfig>>;

  readonly ports: PluginPort[] = [
    {
      id: 'network-in',
      name: 'Network Config',
      type: 'input',
      dataType: 'config',
      required: false,
    },
    {
      id: 'super-assets-out',
      name: 'Super Assets Hooks',
      type: 'output',
      dataType: 'api',
    },
  ];

  readonly dependencies = [
    {
      pluginId: 'superposition-network',
      required: false,
      dataMapping: {
        chainConfig: 'chainConfig',
      },
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof SuperpositionSuperAssetsConfig>> {
    return {
      assets: ['sUSDC', 'sETH'],
      generateWrapUnwrap: true,
      generateYieldTracking: true,
      generateBalanceDisplay: true,
      generateHooks: true,
      autoCompound: false,
    };
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const typesDir = 'src/types';
    const abiDir = 'src/abi';
    const hooksDir = 'src/hooks';
    const configDir = 'src/config';
    const componentsDir = 'src/components/super-assets';

    // Generate types
    this.addFile(
      output,
      `${typesDir}/super-assets.ts`,
      generateSuperAssetsTypes(config)
    );

    // Generate ABIs
    this.addFile(
      output,
      `${abiDir}/super-assets.ts`,
      generateSuperAssetsABIs()
    );

    // Generate config
    this.addFile(
      output,
      `${configDir}/super-assets-config.ts`,
      generateSuperAssetsConfig(config)
    );

    // Generate hooks
    if (config.generateHooks) {
      // Main Super Asset hook (wrap/unwrap)
      if (config.generateWrapUnwrap) {
        this.addFile(
          output,
          `${hooksDir}/useSuperAsset.ts`,
          generateSuperAssetHook(config)
        );
      }

      // Yield tracking hook
      if (config.generateYieldTracking) {
        const yieldHook = generateYieldTrackingHook(config);
        if (yieldHook) {
          this.addFile(
            output,
            `${hooksDir}/useSuperAssetYield.ts`,
            yieldHook
          );
        }
      }

      // Balance hook
      if (config.generateBalanceDisplay) {
        const balanceHook = generateBalanceHook(config);
        if (balanceHook) {
          this.addFile(
            output,
            `${hooksDir}/useSuperAssetBalance.ts`,
            balanceHook
          );
        }
      }
    }

    // Generate UI components
    if (config.generateBalanceDisplay) {
      const balanceUI = generateBalanceUI(config);
      if (balanceUI) {
        this.addFile(
          output,
          `${componentsDir}/SuperAssetBalanceDisplay.tsx`,
          balanceUI
        );
      }
    }

    // Generate index file
    this.addFile(
      output,
      `${hooksDir}/super-assets.ts`,
      generateIndexFile(config)
    );

    // Add documentation
    this.addDoc(
      output,
      'docs/superposition/super-assets.md',
      'Super Assets Integration',
      generateSuperAssetsDocs(config)
    );

    context.logger.info('Generated Super Assets integration', {
      nodeId: node.id,
      assets: config.assets,
    });

    return output;
  }
}

/**
 * Generate index file for Super Assets exports
 */
function generateIndexFile(config: z.infer<typeof SuperpositionSuperAssetsConfig>): string {
  const exports: string[] = [
    "export * from '../types/super-assets';",
    "export * from '../abi/super-assets';",
    "export * from '../config/super-assets-config';",
  ];

  if (config.generateWrapUnwrap) {
    exports.push("export * from './useSuperAsset';");
  }
  if (config.generateYieldTracking) {
    exports.push("export * from './useSuperAssetYield';");
  }
  if (config.generateBalanceDisplay) {
    exports.push("export * from './useSuperAssetBalance';");
  }

  return `// Super Assets Exports
// Generated by Cradle - https://cradle.dev

${exports.join('\n')}
`;
}
