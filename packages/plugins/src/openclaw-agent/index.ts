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

    this.addFile(
      output,
      'skills/README.md',
      this.buildSkillsReadme(),
      'root'
    );

    this.addFile(
      output,
      'skills/SKILL.md',
      this.buildSkillTemplate(),
      'root'
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

In your Nskills app, the \`openclaw-agent\` node is a prompt‑driven block.
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

  private buildSkillsReadme(): string {
    return `# OpenClaw App Skill

Use this skill scaffold to let your OpenClaw bot interact with the app generated
from your Nskills workflow.

## Installation

### Manual Installation

Copy this \`skills\` folder to one of these locations:

- Global: \`~/.openclaw/skills/\`
- Workspace: \`<your-project>/skills/\`

## Files

- \`SKILL.md\`: Main skill definition and execution rules for your app.

## Configuration

1. Open \`SKILL.md\`.
2. Replace all placeholders (for app name, endpoints, auth, and examples).
3. Set required environment variables in your OpenClaw environment.
4. Validate all API examples against your generated app routes.

## Quick Start

1. Fill in app metadata and endpoint sections in \`SKILL.md\`.
2. Add explicit dependency rules for IDs, addresses, or tokens.
3. Add guardrails for sensitive and high-impact actions.
4. Load the skill in OpenClaw and test with real user prompts.

## Publish on ClawHub

After your \`README.md\` and \`SKILL.md\` are ready, publish the skill on ClawHub:

1. Open [https://clawhub.ai/](https://clawhub.ai/) and go to **Upload**.
2. Drop your skill folder (must include \`README.md\` and \`SKILL.md\`).
3. Review slug, display name, version, and changelog.
4. Click **Publish skill**.
5. Wait for the security scan to complete.

### Upload screen

![Upload skill screen](/apps/web/public/assets/upload-skill.png)

### Publish form

![Publish skill form](/apps/web/public/assets/publish-skill.png)

### Published skill page

![Published skill page](/apps/web/public/assets/published-skill.png)

## Install from ClawHub

Once published, install the skill in OpenClaw with:

\`\`\`bash
npx clawhub@latest install SKILL_NAME
\`\`\`

## Example Prompts

\`\`\`
"Check my app status and explain what is configured"

"Create a new record with these details: ..."

"Run this workflow step and show me the result"
\`\`\``;
  }

  private buildSkillTemplate(): string {
    return `---
emoji: 🤖
name: ${'{{SKILL_SLUG}}'}
version: 0.1.0
author: ${'{{AUTHOR_NAME}}'}
description: ${'{{SHORT_DESCRIPTION}}'}
homepage: ${'{{HOMEPAGE_URL}}'}
repository: ${'{{REPOSITORY_URL}}'}
disableModelInvocation: true
requires:
  env:
    - ${'{{ENV_VAR_1}}'}
    - ${'{{ENV_VAR_2}}'}
metadata:
  openclaw:
    requiredEnv:
      - ${'{{ENV_VAR_1}}'}
      - ${'{{ENV_VAR_2}}'}
    bins:
      - curl
    primaryCredential: ${'{{ENV_VAR_1}}'}
---

# ${'{{SKILL_NAME}}'}

${'{{SKILL_OVERVIEW}}'}

## When to Use This Skill

- ${'{{WHEN_TO_USE_1}}'}
- ${'{{WHEN_TO_USE_2}}'}
- ${'{{WHEN_TO_USE_3}}'}
- ${'{{WHEN_TO_USE_4}}'}

---

## Critical API Rules

> Never guess required request values. Every required parameter must come from:
> 1) explicit user input, or 2) a prior trusted endpoint response.

### Parameter Dependency Map

| Parameter | Source | How to resolve |
|-----------|--------|----------------|
| ${'{{PARAM_1}}'} | ${'{{SOURCE_1}}'} | ${'{{RESOLUTION_1}}'} |
| ${'{{PARAM_2}}'} | ${'{{SOURCE_2}}'} | ${'{{RESOLUTION_2}}'} |
| ${'{{PARAM_3}}'} | ${'{{SOURCE_3}}'} | ${'{{RESOLUTION_3}}'} |
| ${'{{PARAM_4}}'} | ${'{{SOURCE_4}}'} | ${'{{RESOLUTION_4}}'} |

### Mandatory Workflow Rules

1. Call prerequisite endpoints first to resolve IDs, addresses, or session state.
2. Ask the user for any business-critical parameter not yet provided.
3. Validate allowed values before calling write endpoints.
4. Confirm high-impact or irreversible operations before execution.
5. If a dependency is missing, stop and resolve it before proceeding.

### Pre-Flight Checklist

\`\`\`
[] Do I have all required auth/context values?
[] Did every request parameter come from user input or trusted API response?
[] Did I validate endpoint-specific constraints and enums?
[] Is this action high-impact, and if yes, did I ask for confirmation?
[] Do I have a clear error fallback if the call fails?
\`\`\`

---

## Authentication

${'{{AUTH_DESCRIPTION}}'}

Example headers:

\`\`\`bash
curl -L -X GET "${'${API_BASE_URL}'}${'{{HEALTH_PATH}}'}" \\
  -H "Authorization: Bearer ${'${API_KEY}'}"
\`\`\`

## API Endpoints

### ${'{{ENDPOINT_NAME_1}}'}

${'{{ENDPOINT_PURPOSE_1}}'}

\`\`\`bash
curl -L -X ${'{{HTTP_METHOD_1}}'} "${'${API_BASE_URL}'}${'{{PATH_1}}'}" \\
  -H "Authorization: Bearer ${'${API_KEY}'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "${'{{REQ_KEY_1}}'}": "${'{{REQ_VALUE_1}}'}",
    "${'{{REQ_KEY_2}}'}": "${'{{REQ_VALUE_2}}'}"
  }'
\`\`\`

Expected response shape:

\`\`\`json
{
  "success": true,
  "${'{{RESP_KEY_1}}'}": "${'{{RESP_VALUE_1}}'}"
}
\`\`\`

### ${'{{ENDPOINT_NAME_2}}'}

${'{{ENDPOINT_PURPOSE_2}}'}

\`\`\`bash
curl -L -X ${'{{HTTP_METHOD_2}}'} "${'${API_BASE_URL}'}${'{{PATH_2}}'}" \\
  -H "Authorization: Bearer ${'${API_KEY}'}"
\`\`\`

Expected response shape:

\`\`\`json
{
  "success": true,
  "${'{{RESP_KEY_2}}'}": "${'{{RESP_VALUE_2}}'}"
}
\`\`\`

---

## End-to-End Workflows

### Workflow 1: ${'{{WORKFLOW_NAME_1}}'}

1. ${'{{WORKFLOW_1_STEP_1}}'}
2. ${'{{WORKFLOW_1_STEP_2}}'}
3. ${'{{WORKFLOW_1_STEP_3}}'}

### Workflow 2: ${'{{WORKFLOW_NAME_2}}'}

1. ${'{{WORKFLOW_2_STEP_1}}'}
2. ${'{{WORKFLOW_2_STEP_2}}'}
3. ${'{{WORKFLOW_2_STEP_3}}'}

## Environment Variables

- ${'{{ENV_VAR_1}}'}: ${'{{ENV_VAR_1_DESC}}'}
- ${'{{ENV_VAR_2}}'}: ${'{{ENV_VAR_2_DESC}}'}

## Error Handling

- If API returns 4xx, explain missing/invalid input and ask for correction.
- If API returns 5xx, retry with backoff and provide status to user.
- If dependency lookup fails, stop execution and ask user how to proceed.

## Security Notes

- Never reveal secrets, raw tokens, or private keys.
- Avoid destructive actions without explicit confirmation.
- Prefer read-only actions if user intent is unclear.
- Log minimal sensitive information only when needed.

## Getting Started

1. Replace all placeholders in this file.
2. Test every endpoint example against your generated app.
3. Validate dependency resolution for high-impact actions.
4. Install under \`~/.openclaw/skills/\` or project \`skills/\` and run.`;
  }
}

