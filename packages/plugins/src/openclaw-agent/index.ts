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

    // Always include high-level docs so generated repos explain what OpenClaw is
    // and how to provision it via Maxxit.
    this.addFile(
      output,
      'openclaw-introduction.md',
      this.buildIntroductionDoc(),
      'docs'
    );

    this.addFile(
      output,
      'openclaw-maxxit-setup.md',
      this.buildMaxxitSetupDoc(),
      'docs'
    );

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

  private buildIntroductionDoc(): string {
    return `# OpenClaw — Personal AI Assistant

OpenClaw is a personal AI assistant you run on your own devices. It connects to the
channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal,
iMessage, Microsoft Teams, WebChat, and more), can speak and listen on macOS/iOS/Android,
and can drive a live Canvas you control. The Gateway is just the control plane — the
product is the assistant that actually does the work.

## Why use OpenClaw?

- **Runs on your own machines** (Mac, Windows, Linux) so your data and API keys stay
  under your control.
- **Multi‑channel inbox** across chat apps, with routing rules for groups, DMs, and
  different agents.
- **First‑class tools and skills** for browser automation, cron jobs, file access,
  nodes, and custom workflows you can extend yourself.
- **Persistent memory** so your assistant becomes uniquely yours over time.

## Quick start (local install)

Runtime requirement: Node \\u2265 22.

Install the CLI and run the onboarding wizard:

\\\`${'`'}bash
npm install -g openclaw@latest

openclaw onboard --install-daemon
\\\`${'`'}

Then start the gateway and send your first message:

\\\`${'`'}bash
openclaw gateway --port 18789 --verbose

openclaw message send --to +1234567890 --message "Hello from OpenClaw"
\\\`${'`'}

## Official links

- Website: https://openclaw.ai/
- GitHub: https://github.com/openclaw/openclaw

## Using this node

In your DappForge blueprint, the \`openclaw-agent\` node is a prompt‑driven block.
The prompt you provide in the canvas UI is written to \`openclaw-agent.md\` in this
repository so you can hand the same context to your OpenClaw setup or other agents.`;
  }

  private buildMaxxitSetupDoc(): string {
    return `# OpenClaw on Maxxit

Maxxit provides a managed OpenClaw instance for DeFi users. Instead of running the entire
stack yourself, you get a dedicated OpenClaw runtime wired to your wallet, model, and
trading skills — accessible directly from Telegram.

> Dashboard: https://www.maxxit.ai/openclaw

## Setup flow

When you onboard OpenClaw via Maxxit you will:

1. **Connect your wallet**  
   Authenticate with the wallet you want Maxxit/OpenClaw to use for identity and
   trading actions.

2. **Choose a plan (starter or pro)**  
   Select the plan that matches your expected usage and LLM budget.

3. **Choose an AI model**  
   Pick which model powers your OpenClaw instance (for example Anthropic, OpenAI, or
   other supported providers).

4. **Connect your Telegram bot**  
   Provide your Telegram bot token so that OpenClaw can talk to you from Telegram and
   other supported surfaces.

5. **Managed OpenAI key**  
   Maxxit provisions and manages the OpenAI key for you under your chosen plan, so you
   do not need to handle keys manually.

6. **Optional Maxxit trading skill**  
   You can enable Maxxit’s DeFi trading skill so that your OpenClaw bot can take and
   manage trades on your behalf, subject to the permissions and safeguards you configure.

## How this relates to your blueprint

The \`openclaw-agent\` node in this blueprint describes how you want OpenClaw to be used
in your architecture. Combine the instructions in this file with the prompt in
\`openclaw-agent.md\` and your Maxxit dashboard at:

> https://www.maxxit.ai/openclaw

to finish wiring your personal assistant into the generated application.`;
  }
}

