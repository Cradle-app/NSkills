import { NextResponse } from 'next/server';
// #region agent log
console.error('[DEBUG-A] validate/route.ts:3 - Import validateBlueprint');
// #endregion
import { validateBlueprint } from '@dapp-forge/blueprint-schema';

export const runtime = 'nodejs'; // Force Node.js runtime (not Edge)

/**
 * Transform cryptic Zod errors into user-friendly messages
 */
function formatValidationError(error: { path: string; message: string; code: string }): { path: string; message: string; code: string } {
  const { path, message, code } = error;

  // Handle "expected string, received null" errors
  if (message.includes('expected string, received null') || message.includes('Expected string, received null')) {
    // Extract field name from path for better context
    const fieldName = path.split('.').pop() || 'field';
    return {
      path,
      message: `The "${fieldName}" field cannot be empty. Please provide a valid value.`,
      code,
    };
  }

  // Handle GitHub config errors
  if (path.includes('github.owner') && message.includes('regex')) {
    return {
      path,
      message: 'GitHub username/owner is missing or invalid. Please connect your GitHub account.',
      code,
    };
  }

  if (path.includes('github.repoName') && message.includes('regex')) {
    return {
      path,
      message: 'Repository name is invalid. Use only letters, numbers, hyphens, underscores, and dots.',
      code,
    };
  }

  return error;
}

export async function POST(request: Request) {
  // #region agent log
  console.error('[DEBUG-B] validate/route.ts:8 - POST handler entry');
  // #endregion
  try {
    // #region agent log
    console.error('[DEBUG-B] validate/route.ts:12 - Before request.json()');
    // #endregion
    const body = await request.json();
    // #region agent log
    console.error('[DEBUG-B] validate/route.ts:15 - After request.json()', { hasBlueprint: !!body.blueprint });
    // #endregion
    // #region agent log
    console.error('[DEBUG-D] validate/route.ts:18 - Before validateBlueprint');
    // #endregion
    const result = validateBlueprint(body.blueprint);
    // #region agent log
    console.error('[DEBUG-D] validate/route.ts:21 - After validateBlueprint', { valid: result.valid, errorCount: result.errors.length });
    if (!result.valid) {
      console.error('[VALIDATION-ERROR] Validation errors:', JSON.stringify(result.errors, null, 2));
    }
    // #endregion

    // Transform errors to be more user-friendly
    const formattedErrors = result.errors.map(formatValidationError);

    return NextResponse.json({
      ...result,
      errors: formattedErrors,
    }, {
      status: result.valid ? 200 : 400,
    });
  } catch (error) {
    // #region agent log
    console.error('[DEBUG-A,B,D] validate/route.ts:28 - Error caught', {
      errorMessage: error instanceof Error ? error.message : 'unknown',
      errorName: error instanceof Error ? error.name : 'unknown',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : 'none',
    });
    // #endregion
    return NextResponse.json(
      {
        valid: false,
        errors: [{
          path: '',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'PARSE_ERROR',
        }],
        warnings: [],
      },
      { status: 400 }
    );
  }
}

