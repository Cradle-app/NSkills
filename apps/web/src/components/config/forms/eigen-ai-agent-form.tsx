'use client';

import { useState } from 'react';
import { Bot, Info, ShieldCheck, Sparkles, ExternalLink, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBlueprintStore } from '@/store/blueprint';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  FormHeader,
  cardStyles,
  formStyles,
  labelStyles,
  inputStyles,
  linkStyles,
} from './shared-styles';

interface Props {
  nodeId: string;
  config: Record<string, unknown>;
}

type TabId = 'integration' | 'signature';

export function EigenAIAgentForm({ nodeId, config }: Props) {
  const { updateNodeConfig } = useBlueprintStore();

  const updateConfig = (key: string, value: unknown) => {
    updateNodeConfig(nodeId, { ...config, [key]: value });
  };

  const [activeTab, setActiveTab] = useState<TabId>('integration');

  const tabs: { id: TabId; label: string }[] = [
    { id: 'integration', label: 'LLM Integration' },
    { id: 'signature', label: 'Signature Simulator' },
  ];

  const baseUrl = (config.baseUrl as string) ?? 'https://eigenai.eigencloud.xyz/v1';
  const model = (config.model as string) ?? 'gpt-oss-120b-f16';
  const network = (config.network as string) ?? 'mainnet';
  const systemPrompt = (config.systemPrompt as string) ?? '';
  const temperature = (config.temperature as number) ?? 0.2;
  const enableSignatureVerification = (config.enableSignatureVerification as boolean) ?? true;

  // Signature simulator state
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [llmSignature, setLlmSignature] = useState<string | null>(null);
  const [llmRawOutput, setLlmRawOutput] = useState<string | null>(null);
  const [llmModelUsed, setLlmModelUsed] = useState<string | null>(null);
  const [llmChainId, setLlmChainId] = useState<number | null>(null);
  const [llmFullPrompt, setLlmFullPrompt] = useState<string | null>(null);

  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    isValid: boolean;
    recoveredAddress?: string;
    expectedAddress?: string;
    message?: string;
    trace?: Record<string, unknown>;
  } | null>(null);

  const chainId = network === 'sepolia' ? 11155111 : 1;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setGenerateError('Enter a prompt to send to EigenAI.');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    setVerificationResult(null);

    try {
      const res = await fetch('/api/eigenai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          systemPrompt: systemPrompt || undefined,
          model,
          temperature,
          chainId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      const data = await res.json();

      setGeneratedContent(data.content ?? '');
      setLlmSignature(data.signature ?? null);
      setLlmRawOutput(data.rawOutput ?? null);
      setLlmModelUsed(data.model ?? null);
      setLlmChainId(typeof data.chainId === 'number' ? data.chainId : chainId);
      setLlmFullPrompt(data.fullPrompt ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to call EigenAI.';
      setGenerateError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerify = async () => {
    if (!llmSignature || !llmRawOutput || !llmModelUsed || llmChainId == null || !llmFullPrompt) {
      setVerifyError('Generate a response first so we have signature, prompt, and output to verify.');
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    setVerificationResult(null);

    try {
      const res = await fetch('/api/eigenai/verify-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          llm_signature: llmSignature,
          llm_raw_output: llmRawOutput,
          llm_model_used: llmModelUsed,
          llm_chain_id: llmChainId,
          llm_full_prompt: llmFullPrompt,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Verification failed with status ${res.status}`);
      }

      const data = await res.json();
      setVerificationResult({
        success: Boolean(data.success),
        isValid: Boolean(data.isValid),
        recoveredAddress: data.recoveredAddress,
        expectedAddress: data.expectedAddress,
        message: data.message,
        trace: data.trace,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify signature.';
      setVerifyError(message);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className={formStyles.container}>
      <FormHeader
        icon={Bot}
        title="EigenAI Agent"
        description="Configure EigenAI as an LLM for your app and experiment with on-chain signature verification."
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

      {activeTab === 'integration' && (
        <>
          <div className={cn(cardStyles.base, 'space-y-3')}>
            <div className={cardStyles.cardHeader}>
              <Info className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-accent-primary))]')} />
              <h3 className={cardStyles.cardTitle}>How EigenAI fits into your app</h3>
            </div>
            <p className={cardStyles.cardBody}>
              <span className="font-semibold">EigenAI</span> is an LLM service with cryptographically signed responses.
              This node configures how your generated code will call EigenAI (via a <code className="font-mono">callEigenAI</code> helper)
              and, if enabled, how it will verify signatures on-chain.
            </p>
            <p className={cardStyles.cardBody}>
              When you click <span className="font-semibold">Build</span>, the generated repository will include the{' '}
              <code className="font-mono">@cradle/eigen-ai-agent</code> helper package that wraps the{' '}
              <code className="font-mono">/chat/completions</code> endpoint and exposes a{' '}
              <code className="font-mono">callEigenAI(prompt, options)</code> function.
            </p>
            <div className="pt-2 flex flex-wrap gap-2">
              <a
                href="https://docs.eigencloud.xyz/eigenai/howto/use-eigenai"
                target="_blank"
                rel="noreferrer"
                className={linkStyles.external}
              >
                <ExternalLink className={linkStyles.linkIcon} />
                <span>EigenAI Docs</span>
              </a>
              <a
                href="https://docs.eigencloud.xyz/eigenai/howto/verify-signature"
                target="_blank"
                rel="noreferrer"
                className={linkStyles.external}
              >
                <ExternalLink className={linkStyles.linkIcon} />
                <span>Verify Signature Docs</span>
              </a>
            </div>
          </div>

          {/* Core settings */}
          <div className={cardStyles.base}>
            <div className={cardStyles.cardHeader}>
              <ShieldCheck className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-success))]')} />
              <h3 className={cardStyles.cardTitle}>LLM & Network Settings</h3>
            </div>

            <div className="space-y-3 mt-2">
              <div className={formStyles.section}>
                <label className={labelStyles.base}>
                  Base URL
                </label>
                <Input
                  value={baseUrl}
                  onChange={(e) => updateConfig('baseUrl', e.target.value)}
                  placeholder="https://eigenai.eigencloud.xyz/v1"
                />
                <p className={labelStyles.helper}>
                  OpenAI-compatible base URL for EigenAI. You can point this at a self-hosted gateway if needed.
                </p>
              </div>

              <div className={formStyles.section}>
                <label className={labelStyles.base}>Model ID</label>
                <Select
                  value={model}
                  onValueChange={(v) => updateConfig('model', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-oss-120b-f16">gpt-oss-120b-f16 (default)</SelectItem>
                    <SelectItem value="qwen3-32b-128k-bf16">qwen3-32b-128k-bf16</SelectItem>
                  </SelectContent>
                </Select>
                <p className={labelStyles.helper}>
                  The <code className="font-mono text-[10px]">model</code> field passed to EigenAI. See the docs for supported models.
                </p>
              </div>

              <div className={formStyles.section}>
                <label className={labelStyles.base}>Network</label>
                <Select
                  value={network}
                  onValueChange={(v) => updateConfig('network', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mainnet">Mainnet (chainId = 1)</SelectItem>
                    <SelectItem value="sepolia">Sepolia Testnet (chainId = 11155111)</SelectItem>
                  </SelectContent>
                </Select>
                <p className={labelStyles.helper}>
                  Used when constructing the signed message for verification. Must match the network EigenAI is using.
                </p>
              </div>

              <div className={formStyles.section}>
                <label className={labelStyles.base}>System Prompt</label>
                <textarea
                  className={inputStyles.textarea}
                  value={systemPrompt}
                  onChange={(e) => updateConfig('systemPrompt', e.target.value)}
                  placeholder="You are a helpful Web3 assistant..."
                />
                <p className={labelStyles.helper}>
                  Optional system prompt applied to every <code className="font-mono text-[10px]">callEigenAI</code> request from your app.
                </p>
              </div>

              <div className={formStyles.section}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[hsl(var(--color-text-secondary))]">Temperature</span>
                  <span className="text-[10px] font-mono text-[hsl(var(--color-text-primary))]">
                    {temperature.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => updateConfig('temperature', parseFloat(e.target.value))}
                  className={cn(
                    'w-full h-1.5 rounded-lg appearance-none cursor-pointer',
                    'bg-[hsl(var(--color-border-default))]',
                    'accent-[hsl(var(--color-accent-primary))]'
                  )}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-xs font-medium text-[hsl(var(--color-text-primary))]">Enable Signature Verification</p>
                  <p className="text-[10px] text-[hsl(var(--color-text-muted))]">
                    When enabled, generated code will include helpers and routes to verify EigenAI response signatures.
                  </p>
                </div>
                <Switch
                  checked={enableSignatureVerification}
                  onCheckedChange={(v) => updateConfig('enableSignatureVerification', v)}
                />
              </div>
            </div>
          </div>

          <div className={cardStyles.base}>
            <div className={cardStyles.cardHeader}>
              <Sparkles className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-accent-primary))]')} />
              <h3 className={cardStyles.cardTitle}>Example usage (generated helper)</h3>
            </div>
            <pre className={cn(inputStyles.textarea, 'min-h-[140px] text-[11px] leading-relaxed')}>
              {`import { callEigenAI } from '@cradle/eigen-ai-agent';

export async function askEigenAI(question: string) {
  const result = await callEigenAI(question, {
    // model, systemPrompt, and temperature default from env/config
  });

  console.log('EigenAI content:', result.content);
  console.log('EigenAI signature:', result.signature);

  return result;
}`}
            </pre>
          </div>
        </>
      )}

      {activeTab === 'signature' && (
        <>
          <div className={cn(cardStyles.base, 'space-y-3')}>
            <div className={cardStyles.cardHeader}>
              <ShieldCheck className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-success))]')} />
              <h3 className={cardStyles.cardTitle}>Signature verification simulator</h3>
            </div>
            <p className={cardStyles.cardBody}>
              Use this sandbox to send a prompt to EigenAI, inspect the returned{' '}
              <span className="font-mono">signature</span>, and verify it using the same flow you&apos;ll get in the generated repo.
            </p>
          </div>

          <div className={cardStyles.base}>
            <label className={labelStyles.base}>
              Prompt to EigenAI
            </label>
            <textarea
              className={inputStyles.textarea}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask EigenAI something about your dapp or protocol..."
            />
            <p className={labelStyles.helper}>
              The simulator uses your base URL, model, system prompt, temperature, and network selection from the Integration tab.
            </p>

            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                Generate with EigenAI
              </Button>
            </div>

            {generateError && (
              <div className="mt-3 flex items-start gap-2 p-2 rounded bg-[hsl(var(--color-error)/0.08)] border border-[hsl(var(--color-error)/0.3)]">
                <AlertCircle className="w-3.5 h-3.5 text-[hsl(var(--color-error))] mt-0.5" />
                <p className="text-[10px] text-[hsl(var(--color-error))]">{generateError}</p>
              </div>
            )}
          </div>

          {(generatedContent || llmSignature) && (
            <div className={cardStyles.base}>
              <div className={cardStyles.cardHeader}>
                <Info className={cn(cardStyles.cardIcon, 'text-[hsl(var(--color-accent-primary))]')} />
                <h3 className={cardStyles.cardTitle}>EigenAI response</h3>
              </div>
              {generatedContent && (
                <div className="mb-3">
                  <p className={labelStyles.helper}>Model output</p>
                  <pre className={cn(inputStyles.textarea, 'min-h-[80px] text-[11px] whitespace-pre-wrap')}>
                    {generatedContent}
                  </pre>
                </div>
              )}
              <div className="space-y-1 text-[11px] text-[hsl(var(--color-text-muted))] font-mono">
                <p>signature: <span className="break-all">{llmSignature ?? '—'}</span></p>
                <p>model: {llmModelUsed ?? '—'}</p>
                <p>chainId: {llmChainId ?? chainId}</p>
              </div>

              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleVerify}
                  disabled={isVerifying || !llmSignature}
                >
                  {isVerifying && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                  Verify Signature
                </Button>
              </div>

              {verifyError && (
                <div className="mt-3 flex items-start gap-2 p-2 rounded bg-[hsl(var(--color-error)/0.08)] border border-[hsl(var(--color-error)/0.3)]">
                  <AlertCircle className="w-3.5 h-3.5 text-[hsl(var(--color-error))] mt-0.5" />
                  <p className="text-[10px] text-[hsl(var(--color-error))]">{verifyError}</p>
                </div>
              )}

              {verificationResult && (
                <div className="mt-3 space-y-2">
                  {/* Result badge */}
                  <div
                    className={cn(
                      'p-2.5 rounded-lg border text-[10px] space-y-1.5',
                      verificationResult.isValid
                        ? 'border-[hsl(var(--color-success)/0.4)] bg-[hsl(var(--color-success)/0.08)]'
                        : 'border-[hsl(var(--color-warning)/0.4)] bg-[hsl(var(--color-warning)/0.08)]'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {verificationResult.isValid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--color-success))]" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-[hsl(var(--color-warning))]" />
                      )}
                      <span className="font-medium text-[hsl(var(--color-text-primary))]">
                        {verificationResult.isValid ? 'Signature verified ✅' : 'Signature invalid ❌'}
                      </span>
                    </div>
                    {verificationResult.message && (
                      <p className="text-[10px] text-[hsl(var(--color-text-muted))]">{verificationResult.message}</p>
                    )}
                  </div>

                  {/* Trace panel */}
                  {verificationResult.trace && (
                    <div className="p-2.5 rounded-lg border border-[hsl(var(--color-border-default))] bg-[hsl(var(--color-surface-elevated)/0.5)] text-[10px] font-mono space-y-1.5">
                      <p className="text-[10px] font-sans font-semibold text-[hsl(var(--color-text-secondary))] pb-1 border-b border-[hsl(var(--color-border-subtle))]">
                        Verification Trace
                      </p>
                      {/* Step 1 */}
                      <div className="space-y-0.5">
                        <p className="text-[hsl(var(--color-accent-primary))] font-sans font-medium">Step 1 — Inputs</p>
                        <p className="text-[hsl(var(--color-text-muted))]">chain_id: <span className="text-[hsl(var(--color-text-primary))]">{String((verificationResult.trace as any).step1_chainId)}</span></p>
                        <p className="text-[hsl(var(--color-text-muted))]">model_id: <span className="text-[hsl(var(--color-text-primary))]">{String((verificationResult.trace as any).step1_model)}</span></p>
                      </div>
                      {/* Step 2 */}
                      <div className="space-y-0.5">
                        <p className="text-[hsl(var(--color-accent-primary))] font-sans font-medium">Step 2 — Prompt &amp; Output lengths</p>
                        <p className="text-[hsl(var(--color-text-muted))]">prompt chars: <span className="text-[hsl(var(--color-text-primary))]">{String((verificationResult.trace as any).step2_promptLength)}</span></p>
                        <p className="text-[hsl(var(--color-text-muted))]">output chars: <span className="text-[hsl(var(--color-text-primary))]">{String((verificationResult.trace as any).step2_outputLength)}</span></p>
                      </div>
                      {/* Step 3 */}
                      <div className="space-y-0.5">
                        <p className="text-[hsl(var(--color-accent-primary))] font-sans font-medium">Step 3 — Constructed message</p>
                        <p className="text-[hsl(var(--color-text-muted))]">length: <span className="text-[hsl(var(--color-text-primary))]">{String((verificationResult.trace as any).step3_messageLength)} chars</span></p>
                        <p className="text-[hsl(var(--color-text-muted))]">preview: <span className="break-all text-[hsl(var(--color-text-primary))]">{String((verificationResult.trace as any).step3_message)}</span></p>
                      </div>
                      {/* Step 4 */}
                      <div className="space-y-0.5">
                        <p className="text-[hsl(var(--color-accent-primary))] font-sans font-medium">Step 4 — Signature (0x-prefixed)</p>
                        <p className="break-all text-[hsl(var(--color-text-primary))]">{String((verificationResult.trace as any).step4_signatureHex)}</p>
                      </div>
                      {/* Step 5 */}
                      <div className="space-y-0.5">
                        <p className="text-[hsl(var(--color-accent-primary))] font-sans font-medium">Step 5 — Address comparison</p>
                        <p className="text-[hsl(var(--color-text-muted))]">recovered: <span className="break-all text-[hsl(var(--color-text-primary))]">{String((verificationResult.trace as any).step5_recoveredAddress)}</span></p>
                        <p className="text-[hsl(var(--color-text-muted))]">expected:  <span className="break-all text-[hsl(var(--color-text-primary))]">{String((verificationResult.trace as any).step5_expectedAddress)}</span></p>
                        <p className="text-[hsl(var(--color-text-muted))]">match:     <span className={verificationResult.isValid ? 'text-[hsl(var(--color-success))]' : 'text-[hsl(var(--color-error))]'}>{verificationResult.isValid ? '✅ YES' : '❌ NO'}</span></p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

