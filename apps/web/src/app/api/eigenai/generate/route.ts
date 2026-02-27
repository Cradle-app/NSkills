import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const DEFAULT_EIGENAI_BASE_URL = 'https://eigenai.eigencloud.xyz/v1';
const DEFAULT_EIGENAI_MODEL = 'gpt-oss-120b-f16';

interface GenerateBody {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  chainId?: number;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateBody;

    const prompt = String(body.prompt ?? '').trim();
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const envBaseUrl = process.env.EIGENAI_BASE_URL ?? DEFAULT_EIGENAI_BASE_URL;
    const baseUrl = envBaseUrl.replace(/\/$/, '');
    const apiKey = process.env.EIGENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'EIGENAI_API_KEY is not configured in the environment',
        },
        { status: 500 }
      );
    }

    const model =
      body.model ??
      process.env.EIGENAI_MODEL ??
      DEFAULT_EIGENAI_MODEL;

    const chainId =
      typeof body.chainId === 'number'
        ? body.chainId
        : Number(process.env.EIGENAI_CHAIN_ID ?? '1');

    const systemPrompt =
      body.systemPrompt ??
      'You are a helpful Web3 assistant powered by EigenAI. Answer clearly and concisely.';

    const temperature =
      typeof body.temperature === 'number'
        ? body.temperature
        : 0.2;

    const fullPrompt = systemPrompt + prompt;

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
      const text = await response.text().catch(() => '');
      return NextResponse.json(
        {
          success: false,
          error: `EigenAI API error: ${response.status} ${text}`,
        },
        { status: 500 }
      );
    }

    const data: any = await response.json();

    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'EigenAI API response missing choices array' },
        { status: 500 }
      );
    }

    const message = data.choices[0]?.message;
    const rawOutput: unknown = message?.content;

    if (typeof rawOutput !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: `EigenAI API response missing string content. Got: ${typeof rawOutput}`,
        },
        { status: 500 }
      );
    }

    const content = extractFinalContent(rawOutput);

    return NextResponse.json({
      success: true,
      content,
      signature: data.signature,
      rawOutput,
      model: data.model ?? model,
      chainId,
      fullPrompt,
    });
  } catch (error) {
    console.error('[EigenAI] Generate API error:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to call EigenAI';

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * Extract the user-visible content from EigenAI responses.
 * Some models include thinking tags like <|end|> or channel markers.
 */
function extractFinalContent(rawOutput: string): string {
  const endTagMatch = rawOutput.match(/<\|end\|>\s*([\s\S]*)$/);
  if (endTagMatch) {
    return endTagMatch[1].trim();
  }

  const finalChannelMatch = rawOutput.match(
    /<\|channel\|>final<\|message\|>([\s\S]*?)(?:<\|end\|>|$)/
  );
  if (finalChannelMatch) {
    return finalChannelMatch[1].trim();
  }

  return rawOutput.trim();
}

