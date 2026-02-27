import { NextResponse } from 'next/server';
import { verifyMessage } from 'ethers';

export const runtime = 'nodejs';

// Default EigenAI operator address (mainnet)
const DEFAULT_EIGENAI_OPERATOR_ADDRESS = '0x7053bfb0433a16a2405de785d547b1b32cee0cf3';

function constructMessage(
  chainId: string | number,
  modelId: string,
  prompt: string,
  output: string
): string {
  const chainIdStr = typeof chainId === 'number' ? String(chainId) : chainId;
  return chainIdStr + modelId + prompt + output;
}

function verifySignature(
  message: string,
  signature: string,
  expectedAddress: string
): { isValid: boolean; recoveredAddress: string } {
  const sigHex = signature.startsWith('0x') ? signature : `0x${signature}`;
  const recoveredAddress = verifyMessage(message, sigHex);
  const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();

  return { isValid, recoveredAddress };
}

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      {
        success: false,
        error: 'Method not allowed. Use POST.',
      },
      { status: 405 }
    );
  }

  try {
    const body = await req.json();

    const {
      llm_signature,
      llm_raw_output,
      llm_model_used,
      llm_chain_id,
      llm_full_prompt,
      operator_address,
    } = body ?? {};

    if (!llm_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: llm_signature' },
        { status: 400 }
      );
    }

    if (!llm_raw_output) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: llm_raw_output' },
        { status: 400 }
      );
    }

    if (!llm_model_used) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: llm_model_used' },
        { status: 400 }
      );
    }

    if (llm_chain_id === undefined || llm_chain_id === null) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: llm_chain_id' },
        { status: 400 }
      );
    }

    if (!llm_full_prompt) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: llm_full_prompt' },
        { status: 400 }
      );
    }

    const expectedAddress = operator_address || DEFAULT_EIGENAI_OPERATOR_ADDRESS;

    // ── Step-by-step trace ───────────────────────────────────────────────
    console.log('\n[EigenAI] ── Verify Signature · Trace ──────────────────');
    console.log(`  Step 1  Chain ID      : ${llm_chain_id}`);
    console.log(`  Step 1  Model         : ${llm_model_used}`);
    console.log(`  Step 2  Full Prompt   : ${llm_full_prompt.slice(0, 120)}${llm_full_prompt.length > 120 ? '…' : ''}`);
    console.log(`  Step 2  Raw Output    : ${llm_raw_output.slice(0, 120)}${llm_raw_output.length > 120 ? '…' : ''}`);

    const message = constructMessage(
      llm_chain_id,
      llm_model_used,
      llm_full_prompt,
      llm_raw_output
    );

    console.log(`  Step 3  Message       : ${message.slice(0, 120)}${message.length > 120 ? '…' : ''}`);
    console.log(`  Step 3  Message len   : ${message.length} chars`);
    console.log(`  Step 4  Signature     : ${llm_signature.startsWith('0x') ? llm_signature : '0x' + llm_signature}`);
    console.log(`  Step 5  Expected addr : ${expectedAddress}`);

    const { isValid, recoveredAddress } = verifySignature(
      message,
      llm_signature,
      expectedAddress
    );

    console.log(`  Step 5  Recovered     : ${recoveredAddress}`);
    console.log(`  Step 5  Valid?        : ${isValid ? '✅ YES' : '❌ NO'}`);
    console.log('[EigenAI] ─────────────────────────────────────────────────\n');

    return NextResponse.json({
      success: true,
      isValid,
      recoveredAddress,
      expectedAddress,
      message: isValid
        ? 'Signature verified successfully'
        : 'Signature verification failed - address mismatch',
      details: {
        chainId: llm_chain_id,
        model: llm_model_used,
        messageLength: message.length,
      },
      trace: {
        step1_chainId: String(llm_chain_id),
        step1_model: llm_model_used,
        step2_promptLength: llm_full_prompt.length,
        step2_outputLength: llm_raw_output.length,
        step3_message: message.slice(0, 200) + (message.length > 200 ? '…' : ''),
        step3_messageLength: message.length,
        step4_signatureHex: llm_signature.startsWith('0x') ? llm_signature : '0x' + llm_signature,
        step5_recoveredAddress: recoveredAddress,
        step5_expectedAddress: expectedAddress,
        step5_match: isValid,
      },
    });
  } catch (error) {
    console.error('[EigenAI] Verification error:', error);
    const message =
      error instanceof Error ? error.message : 'Signature verification failed';

    return NextResponse.json(
      {
        success: false,
        error: 'Signature verification failed',
        message,
      },
      { status: 500 }
    );
  }
}

