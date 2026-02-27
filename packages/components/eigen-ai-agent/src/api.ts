import type { EigenAIChatOptions, EigenAIChatResult } from './types';

const DEFAULT_BASE_URL =
  process.env.EIGENAI_BASE_URL ?? 'https://eigenai.eigencloud.xyz/v1';

const DEFAULT_MODEL = process.env.EIGENAI_MODEL ?? 'gpt-oss-120b-f16';

const DEFAULT_CHAIN_ID = Number(process.env.EIGENAI_CHAIN_ID ?? '1');

/**
 * Call EigenAI with a single user prompt.
 * This method is compatible with both server and edge runtimes.
 */
export async function callEigenAI(
  prompt: string,
  options: EigenAIChatOptions = {}
): Promise<EigenAIChatResult> {
  const apiKey = process.env.EIGENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'EIGENAI_API_KEY is not set. Configure it in your environment before calling EigenAI.'
    );
  }

  const baseUrl = DEFAULT_BASE_URL.replace(/\/$/, '');
  const model = options.model ?? DEFAULT_MODEL;
  const systemPrompt =
    options.systemPrompt ??
    'You are a helpful AI assistant powered by EigenAI. Answer clearly and concisely.';
  const temperature =
    typeof options.temperature === 'number' ? options.temperature : 0.2;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`EigenAI API error: ${response.status} ${errorText}`);
  }

  const data: any = await response.json();

  if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
    throw new Error('EigenAI API response missing choices array');
  }

  const message = data.choices[0]?.message;
  const rawOutput: unknown = message?.content;

  if (typeof rawOutput !== 'string') {
    throw new Error('EigenAI API response did not contain string content');
  }

  const content = extractFinalContent(rawOutput);

  return {
    content,
    signature: data.signature,
    rawOutput,
    model: data.model ?? model,
    chainId: typeof data.chainId === 'number' ? data.chainId : DEFAULT_CHAIN_ID,
  };
}

/**
 * Some EigenAI models may return thinking tags like <|end|> or
 * channel markers. This helper extracts the final user-visible
 * content from the raw message.
 */
export function extractFinalContent(rawOutput: string): string {
  // Try extracting JSON or text after a <|end|> tag
  const endTagMatch = rawOutput.match(/<\|end\|>\s*([\s\S]*)$/);
  if (endTagMatch) {
    return endTagMatch[1].trim();
  }

  // Try extracting from a <|channel|>final<|message|> section
  const finalChannelMatch = rawOutput.match(
    /<\|channel\|>final<\|message\|>([\s\S]*?)(?:<\|end\|>|$)/
  );
  if (finalChannelMatch) {
    return finalChannelMatch[1].trim();
  }

  return rawOutput.trim();
}

