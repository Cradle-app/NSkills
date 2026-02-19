'use client';

import { useState } from 'react';
import { ExternalLink, Bot, Info, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormHeader, cardStyles, formStyles, labelStyles, linkStyles, codeStyles } from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

type TabId = 'intro' | 'maxxit';

export function OpenClawAgentForm({ nodeId, config }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('intro');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'intro', label: 'Introduction' },
    { id: 'maxxit', label: 'Setup on Maxxit' },
  ];

  return (
    <div className={formStyles.container}>
      <FormHeader
        icon={Bot}
        title="OpenClaw Agent"
        description="Personal AI assistant you run on your own devices, now wired into your Nskills app as an agent node."
        variant="primary"
      />

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-[hsl(var(--color-border-subtle))] mb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-3 py-1.5 text-[11px] font-medium rounded-t-md border-b-2 transition-colors',
              activeTab === tab.id
                ? 'text-[hsl(var(--color-accent-primary))] border-[hsl(var(--color-accent-primary))]'
                : 'text-[hsl(var(--color-text-muted))] border-transparent hover:text-[hsl(var(--color-text-primary))]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'intro' && (
        <div className={cn(cardStyles.base, 'space-y-3')}>
          <div className={cardStyles.cardHeader}>
            <Info className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-accent-primary))]')} />
            <h3 className={cardStyles.cardTitle}>What is OpenClaw?</h3>
          </div>
          <p className={cardStyles.cardBody}>
            <span className="font-semibold">OpenClaw</span> is a personal AI assistant you run on your own devices. It connects to the
            channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat and more),
            speaks and listens on macOS/iOS/Android, and can drive a live Canvas you control. The Gateway is just the control plane — the
            product is the assistant that actually does work for you.
          </p>
          <p className={cardStyles.cardBody}>
            In your Nskills app, the <span className="font-mono">openclaw-agent</span> node is a prompt-driven block that describes how
            OpenClaw should behave and what role it plays in the architecture. The shared AI Prompt section above is included in the generated
            repo as a markdown doc, so you can hand that context directly to OpenClaw or other agents.
          </p>

          <div className={cardStyles.cardList}>
            <div className={cardStyles.cardListItem}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-success))]" />
              <p className={cardStyles.cardBody}>
                <span className="font-semibold">Runs on your machines</span> — Mac, Windows, or Linux with your own API keys and data. No hosted
                SaaS by default.
              </p>
            </div>
            <div className={cardStyles.cardListItem}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-success))]" />
              <p className={cardStyles.cardBody}>
                <span className="font-semibold">Multi‑channel inbox</span> — route conversations from WhatsApp, Telegram, Slack, Discord, and
                more into a single assistant.
              </p>
            </div>
            <div className={cardStyles.cardListItem}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-success))]" />
              <p className={cardStyles.cardBody}>
                <span className="font-semibold">Tools & skills</span> — browser control, cron jobs, file access, custom skills and workflows
                managed from your own workspace.
              </p>
            </div>
          </div>

          <div className={cardStyles.cardList}>
            <p className={labelStyles.helper}>
              To install OpenClaw locally, run the wizard on a machine with Node&nbsp;≥&nbsp;22:
            </p>
            <pre className={codeStyles.block}>
{`npm install -g openclaw@latest
openclaw onboard --install-daemon`}
            </pre>
          </div>

          <div className="pt-2 flex flex-wrap gap-2">
            <a
              href="https://openclaw.ai/"
              target="_blank"
              rel="noreferrer"
              className={linkStyles.external}
            >
              <ExternalLink className={linkStyles.linkIcon} />
              <span>OpenClaw Website</span>
            </a>
            <a
              href="https://github.com/openclaw/openclaw"
              target="_blank"
              rel="noreferrer"
              className={linkStyles.external}
            >
              <ExternalLink className={linkStyles.linkIcon} />
              <span>OpenClaw GitHub</span>
            </a>
          </div>
        </div>
      )}

      {activeTab === 'maxxit' && (
        <div className={cn(cardStyles.base, 'space-y-3')}>
          <div className={cardStyles.cardHeader}>
            <Settings className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-accent-primary))]')} />
            <h3 className={cardStyles.cardTitle}>Setup your OpenClaw on Maxxit</h3>
          </div>
          <p className={cardStyles.cardBody}>
            Maxxit provides a managed OpenClaw instance for DeFi traders. Instead of running everything yourself, you get a dedicated
            OpenClaw runtime that is wired to your wallet, model, and trading skills — accessible directly from Telegram.
          </p>

          <div className={cardStyles.cardList}>
            <div className={cardStyles.cardListItem}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-accent-primary))]" />
              <p className={cardStyles.cardBody}>
                <span className="font-semibold">Connect your wallet</span> — authenticate with the wallet you want Maxxit/OpenClaw to use.
              </p>
            </div>
            <div className={cardStyles.cardListItem}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-accent-primary))]" />
              <p className={cardStyles.cardBody}>
                <span className="font-semibold">Choose a plan</span> — pick between <span className="font-mono">starter</span> and{' '}
                <span className="font-mono">pro</span> depending on your usage and budget.
              </p>
            </div>
            <div className={cardStyles.cardListItem}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-accent-primary))]" />
              <p className={cardStyles.cardBody}>
                <span className="font-semibold">Select an AI model</span> — choose which model powers your OpenClaw instance.
              </p>
            </div>
            <div className={cardStyles.cardListItem}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-accent-primary))]" />
              <p className={cardStyles.cardBody}>
                <span className="font-semibold">Connect your Telegram bot</span> — provide your Telegram bot token so OpenClaw can talk to you
                from Telegram.
              </p>
            </div>
            <div className={cardStyles.cardListItem}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-accent-primary))]" />
              <p className={cardStyles.cardBody}>
                <span className="font-semibold">Managed OpenAI key</span> — Maxxit provisions the OpenAI key for you and manages usage under
                your chosen plan.
              </p>
            </div>
            <div className={cardStyles.cardListItem}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--color-accent-primary))]" />
              <p className={cardStyles.cardBody}>
                <span className="font-semibold">Optional Maxxit trading skill</span> — you can attach Maxxit&apos;s trading skill so that your
                OpenClaw bot can take and manage trades on your behalf.
              </p>
            </div>
          </div>

          <p className={labelStyles.helper}>
            When you click <span className="font-semibold">Build</span> in Nskills, your blueprint will include OpenClaw documentation files
            that mirror this setup, so you (or your team) can follow the same steps directly in the generated repo.
          </p>

          <div className="pt-2">
            <a
              href="https://www.maxxit.ai/openclaw"
              target="_blank"
              rel="noreferrer"
              className={linkStyles.external}
            >
              <ExternalLink className={linkStyles.linkIcon} />
              <span>OpenClaw on Maxxit</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

