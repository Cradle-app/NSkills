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
import { OpenClawConfig } from '@dapp-forge/blueprint-schema';

/**
 * OpenClaw Agent Plugin
 *
 * Lightweight agent node that is primarily driven by the shared AI Prompt
 * on the canvas. It does not copy any frontend components today, but is
 * wired as a first-class plugin so it can participate in blueprints and
 * future codegen.
 */
export class OpenClawAgentPlugin extends BasePlugin<z.infer<typeof OpenClawConfig>> {
  readonly metadata: PluginMetadata = {
    id: 'openclaw-agent',
    name: 'OpenClaw',
    version: '0.1.0',
    description: 'Prompt-driven OpenClaw agent block',
    category: 'agents',
    tags: ['ai', 'agent', 'openclaw', 'prompt'],
  };

  readonly configSchema = OpenClawConfig as unknown as z.ZodType<z.infer<typeof OpenClawConfig>>;

  /**
   * No componentPath/componentPackage yet – this block is prompt-only for now.
   * It can be extended later to wire a concrete component package.
   */

  readonly ports: PluginPort[] = [
    {
      id: 'prompt-in',
      name: 'Agent Prompt',
      type: 'input',
      dataType: 'config',
      required: false,
    },
    {
      id: 'agent-out',
      name: 'Agent Context',
      type: 'output',
      dataType: 'config',
    },
  ];

  getDefaultConfig(): Partial<z.infer<typeof OpenClawConfig>> {
    return {};
  }

  async generate(
    node: BlueprintNode,
    context: ExecutionContext
  ): Promise<CodegenOutput> {
    const config = this.configSchema.parse(node.config);
    const output = this.createEmptyOutput();

    const prompt = (config.prompt as string | undefined) ?? '';

    if (prompt.trim().length > 0) {
      const doc = this.buildPromptDoc(prompt);
      this.addFile(
        output,
        'openclaw-agent.md',
        doc,
        'docs'
      );
    }

    context.logger.info('Configured OpenClaw agent node', {
      nodeId: node.id,
      hasPrompt: Boolean(prompt && prompt.trim().length > 0),
    });

    return output;
  }

  private buildPromptDoc(prompt: string): string {
    return `# OpenClaw Agent Prompt

This document captures the design prompt for the **OpenClaw** agent node.

## Prompt

${prompt}

## Notes

- This block is currently prompt-only and is intended to feed agentic or UI workflows.
- You can safely customize or extend this document in your generated repository.`;
  }
}

