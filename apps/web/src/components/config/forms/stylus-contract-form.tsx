'use client';

import { useBlueprintStore } from '@/store/blueprint';
import { Input } from '@/components/ui/input';
import { Box, FileCode, ExternalLink, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formStyles,
  headerStyles,
  labelStyles,
  inputStyles,
  cardStyles,
  linkStyles,
  FormHeader,
} from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

const REFERENCE_LINKS = [
  { label: 'Stylus by Example', url: 'https://stylus-by-example.org/' },
  { label: 'Arbitrum Stylus Docs', url: 'https://docs.arbitrum.io/stylus/gentle-introduction' },
  { label: 'Arbitrum Discord', url: 'https://discord.com/channels/585084330037084172/1146789176939909251' },
  { label: 'Arbitrum Stylus Telegram', url: 'https://t.me/arbitrum_stylus' },
];

export function StylusContractForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { [key]: value });
  };

  const contractInstructions = (config.contractInstructions as string) || '';
  const contractName = (config.contractName as string) || 'my-contract';

  return (
    <div className={formStyles.container}>
      {/* Header */}
      <FormHeader
        icon={Box}
        title="Stylus Contract"
        description="Describe your contract logic. A markdown guide will be generated for LLM-assisted code generation."
      />

      {/* Contract Name */}
      <div className={formStyles.section}>
        <Input
          label="Project/Contract Name"
          value={contractName}
          onChange={(e) => handleChange('contractName', e.target.value)}
          placeholder="my-contract"
          required
          error={!contractName.trim() ? 'Required' : undefined}
        />
      </div>

      {/* Instruction Panel */}
      <div className={formStyles.section}>
        <label className={labelStyles.withIcon}>
          <FileCode className={labelStyles.icon} />
          Contract Logic Instructions
        </label>
        <textarea
          value={contractInstructions}
          onChange={(e) => handleChange('contractInstructions', e.target.value)}
          placeholder={`Describe how you want your Stylus Rust contract to work. For example:

- A vending machine that distributes tokens with a 5-second cooldown per user
- An ERC-20 token with minting, burning, and transfer capabilities
- A simple counter with increment, decrement, and set functions
- A voting contract where addresses can vote once per proposal

Be as specific as you like. This will be included in a markdown file that you can pass to any LLM (ChatGPT, Claude, etc.) to generate or modify your contract code.`}
          className={inputStyles.textarea}
          rows={8}
        />
        <p className={labelStyles.helper}>
          A comprehensive markdown guide with deployment steps, error troubleshooting, and your instructions will be pushed to your GitHub.
        </p>
      </div>

      {/* What gets generated */}
      <div className={cardStyles.primary}>
        <div className={cardStyles.cardHeader}>
          <Sparkles className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-accent-primary))]')} />
          <span className={cardStyles.cardTitle}>What gets generated</span>
        </div>
        <ul className={cardStyles.cardList}>
          <li className={cardStyles.cardListItem}>
            <span className="text-[hsl(var(--color-text-muted))]">•</span>
            <span>
              <code className={cardStyles.cardCode}>contracts/counter-contract/</code>
              <span className="text-[hsl(var(--color-text-muted))]"> – Full template (Cargo.toml, src/lib.rs, .cargo, etc.)</span>
            </span>
          </li>
          <li className={cardStyles.cardListItem}>
            <span className="text-[hsl(var(--color-text-muted))]">•</span>
            <span>
              <code className={cardStyles.cardCode}>docs/STYLUS_CONTRACT_GUIDE.md</code>
              <span className="text-[hsl(var(--color-text-muted))]"> – Your instructions + paste guide + troubleshooting</span>
            </span>
          </li>
          <li className={cardStyles.cardListItem}>
            <span className="text-[hsl(var(--color-text-muted))]">•</span>
            <span>
              <span className={cardStyles.cardCode}>LLM workflow</span>
              <span className="text-[hsl(var(--color-text-muted))]"> – Pass the markdown to any LLM, paste output into </span>
              <code className={cardStyles.cardCode}>counter-contract/src/lib.rs</code>
            </span>
          </li>
        </ul>
      </div>

      {/* Reference links */}
      <div className={formStyles.section}>
        <label className={labelStyles.base}>Reference Resources</label>
        <div className="flex flex-wrap gap-2">
          {REFERENCE_LINKS.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={linkStyles.external}
            >
              {link.label}
              <ExternalLink className={linkStyles.linkIcon} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
