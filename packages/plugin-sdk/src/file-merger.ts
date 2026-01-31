/**
 * File Merger Utility for Cradle Code Generation
 * 
 * Provides intelligent merging of files when multiple plugins
 * output files with the same names to the same locations.
 */

/**
 * File types that can be intelligently merged
 */
export type MergeableFileType =
    | 'barrel-exports'    // index.ts files with re-exports
    | 'types'             // TypeScript type definitions
    | 'constants'         // Constant declarations
    | 'none';             // Not mergeable

/**
 * Result of a file merge operation
 */
export interface MergeResult {
    /** Whether the merge was successful */
    success: boolean;
    /** Merged content if successful */
    content: string;
    /** Warning messages if any */
    warnings: string[];
}

/**
 * Determine if a file can be merged and what type it is
 */
export function getMergeableType(filename: string): MergeableFileType {
    const basename = filename.split('/').pop() || filename;

    if (basename === 'index.ts' || basename === 'index.tsx') {
        return 'barrel-exports';
    }
    if (basename === 'types.ts' || basename.endsWith('.types.ts')) {
        return 'types';
    }
    if (basename === 'constants.ts' || basename.endsWith('.constants.ts')) {
        return 'constants';
    }

    return 'none';
}

/**
 * Check if a file should be merged instead of overwritten
 */
export function shouldMergeFile(filename: string): boolean {
    return getMergeableType(filename) !== 'none';
}

/**
 * Merge two file contents based on file type
 * 
 * @param existing - Content already in the target location
 * @param incoming - New content from another plugin
 * @param filename - Name of the file for type detection
 * @returns Merged content result
 */
export function mergeFileContents(
    existing: string,
    incoming: string,
    filename: string
): MergeResult {
    const fileType = getMergeableType(filename);

    switch (fileType) {
        case 'barrel-exports':
            return mergeBarrelExports(existing, incoming);
        case 'types':
            return mergeTypeDefinitions(existing, incoming);
        case 'constants':
            return mergeConstants(existing, incoming);
        default:
            return {
                success: false,
                content: existing,
                warnings: [`Cannot merge ${filename}: unsupported file type`],
            };
    }
}

/**
 * Merge barrel/index.ts files that contain re-exports
 * 
 * Combines export statements from both files, removing duplicates
 */
export function mergeBarrelExports(existing: string, incoming: string): MergeResult {
    const warnings: string[] = [];

    // Extract all export lines from both files
    const existingExports = extractExportStatements(existing);
    const incomingExports = extractExportStatements(incoming);

    // Extract all import lines from both files  
    const existingImports = extractImportStatements(existing);
    const incomingImports = extractImportStatements(incoming);

    // Extract comments/documentation from both
    const existingComments = extractTopComments(existing);
    const incomingComments = extractTopComments(incoming);

    // Merge exports, avoid duplicates by checking export specifiers
    const allExports = new Map<string, string>();

    for (const exp of existingExports) {
        const key = normalizeExportKey(exp);
        allExports.set(key, exp);
    }

    for (const exp of incomingExports) {
        const key = normalizeExportKey(exp);
        if (allExports.has(key)) {
            warnings.push(`Duplicate export skipped: ${key}`);
        } else {
            allExports.set(key, exp);
        }
    }

    // Merge imports, avoid duplicates
    const allImports = new Map<string, string>();

    for (const imp of existingImports) {
        const key = normalizeImportKey(imp);
        allImports.set(key, imp);
    }

    for (const imp of incomingImports) {
        const key = normalizeImportKey(imp);
        if (!allImports.has(key)) {
            allImports.set(key, imp);
        }
    }

    // Build merged content
    const parts: string[] = [];

    // Use the longer/more descriptive comment block
    const comment = existingComments.length >= incomingComments.length
        ? existingComments
        : incomingComments;
    if (comment) {
        parts.push(comment);
    }

    // Add imports
    if (allImports.size > 0) {
        parts.push(Array.from(allImports.values()).join('\n'));
        parts.push('');
    }

    // Add exports
    parts.push(Array.from(allExports.values()).join('\n'));
    parts.push('');

    return {
        success: true,
        content: parts.join('\n'),
        warnings,
    };
}

/**
 * Merge TypeScript type definition files
 * 
 * Combines type/interface/enum declarations, avoiding duplicates
 */
export function mergeTypeDefinitions(existing: string, incoming: string): MergeResult {
    const warnings: string[] = [];

    // Extract type names from existing to detect duplicates
    const existingTypeNames = extractTypeNames(existing);
    const incomingLines = incoming.split('\n');

    // Filter out duplicate types from incoming
    const linesToAdd: string[] = [];
    let skipBlock = false;
    let braceCount = 0;

    for (const line of incomingLines) {
        // Check if this line starts a type definition
        const typeMatch = line.match(/^export\s+(?:type|interface|enum)\s+(\w+)/);

        if (typeMatch) {
            const typeName = typeMatch[1];
            if (existingTypeNames.has(typeName)) {
                skipBlock = true;
                braceCount = 0;
                warnings.push(`Duplicate type skipped: ${typeName}`);
                continue;
            }
        }

        // Track braces for multi-line declarations
        if (skipBlock) {
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;

            if (braceCount <= 0 && line.includes('}')) {
                skipBlock = false;
            }
            continue;
        }

        // Skip import statements that might duplicate
        if (line.trim().startsWith('import ')) {
            continue;
        }

        linesToAdd.push(line);
    }

    // Filter empty lines from the start
    while (linesToAdd.length > 0 && linesToAdd[0].trim() === '') {
        linesToAdd.shift();
    }

    // Combine existing with new unique types
    let merged = existing.trimEnd();

    if (linesToAdd.length > 0) {
        const newContent = linesToAdd.join('\n').trim();
        if (newContent) {
            merged += '\n\n// Additional types from merged plugins\n';
            merged += newContent;
        }
    }

    merged += '\n';

    return {
        success: true,
        content: merged,
        warnings,
    };
}

/**
 * Merge constant definition files
 * 
 * Combines const declarations, avoiding duplicates
 */
export function mergeConstants(existing: string, incoming: string): MergeResult {
    const warnings: string[] = [];

    // Extract constant names from existing
    const existingConstNames = extractConstNames(existing);
    const incomingLines = incoming.split('\n');

    const linesToAdd: string[] = [];
    let skipBlock = false;
    let braceCount = 0;

    for (const line of incomingLines) {
        // Check for const/let/var declarations
        const constMatch = line.match(/^export\s+const\s+(\w+)/);

        if (constMatch) {
            const constName = constMatch[1];
            if (existingConstNames.has(constName)) {
                skipBlock = true;
                braceCount = 0;
                warnings.push(`Duplicate constant skipped: ${constName}`);
                continue;
            }
        }

        // Track braces for multi-line declarations
        if (skipBlock) {
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;

            // End of block when we close all braces or hit semicolon
            if ((braceCount <= 0 && line.includes('}')) || line.includes(';')) {
                skipBlock = false;
            }
            continue;
        }

        // Skip import statements
        if (line.trim().startsWith('import ')) {
            continue;
        }

        linesToAdd.push(line);
    }

    // Filter empty lines from the start
    while (linesToAdd.length > 0 && linesToAdd[0].trim() === '') {
        linesToAdd.shift();
    }

    // Combine
    let merged = existing.trimEnd();

    if (linesToAdd.length > 0) {
        const newContent = linesToAdd.join('\n').trim();
        if (newContent) {
            merged += '\n\n// Additional constants from merged plugins\n';
            merged += newContent;
        }
    }

    merged += '\n';

    return {
        success: true,
        content: merged,
        warnings,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract export statements from file content
 */
function extractExportStatements(content: string): string[] {
    const lines = content.split('\n');
    const exports: string[] = [];
    let multiLineExport = '';
    let inMultiLine = false;

    for (const line of lines) {
        if (inMultiLine) {
            multiLineExport += '\n' + line;
            if (line.includes('}') && line.includes('from')) {
                exports.push(multiLineExport.trim());
                multiLineExport = '';
                inMultiLine = false;
            }
        } else if (line.trim().startsWith('export ')) {
            if (line.includes('from') && (line.includes('}') || !line.includes('{'))) {
                exports.push(line.trim());
            } else if (line.includes('{') && !line.includes('}')) {
                inMultiLine = true;
                multiLineExport = line;
            } else if (line.includes('from')) {
                exports.push(line.trim());
            }
        }
    }

    return exports;
}

/**
 * Extract import statements from file content
 */
function extractImportStatements(content: string): string[] {
    const lines = content.split('\n');
    const imports: string[] = [];
    let multiLineImport = '';
    let inMultiLine = false;

    for (const line of lines) {
        if (inMultiLine) {
            multiLineImport += '\n' + line;
            if (line.includes('}') && line.includes('from')) {
                imports.push(multiLineImport.trim());
                multiLineImport = '';
                inMultiLine = false;
            }
        } else if (line.trim().startsWith('import ')) {
            if (line.includes('from') && (line.includes('}') || !line.includes('{'))) {
                imports.push(line.trim());
            } else if (line.includes('{') && !line.includes('}')) {
                inMultiLine = true;
                multiLineImport = line;
            }
        }
    }

    return imports;
}

/**
 * Extract top comment block from file
 */
function extractTopComments(content: string): string {
    const lines = content.split('\n');
    const commentLines: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('/**') || trimmed.startsWith('*') ||
            trimmed.startsWith('*/') || trimmed.startsWith('//')) {
            commentLines.push(line);
        } else if (trimmed === '') {
            if (commentLines.length > 0) {
                commentLines.push(line);
            }
        } else {
            break;
        }
    }

    return commentLines.join('\n').trim();
}

/**
 * Normalize export statement to a key for deduplication
 */
function normalizeExportKey(exportStatement: string): string {
    // Extract the module path (from '...')
    const fromMatch = exportStatement.match(/from\s+['"]([^'"]+)['"]/);
    if (fromMatch) {
        return fromMatch[1];
    }
    return exportStatement;
}

/**
 * Normalize import statement to a key for deduplication
 */
function normalizeImportKey(importStatement: string): string {
    const fromMatch = importStatement.match(/from\s+['"]([^'"]+)['"]/);
    if (fromMatch) {
        return fromMatch[1];
    }
    return importStatement;
}

/**
 * Extract all type/interface/enum names from content
 */
function extractTypeNames(content: string): Set<string> {
    const names = new Set<string>();
    const regex = /(?:export\s+)?(?:type|interface|enum)\s+(\w+)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        names.add(match[1]);
    }

    return names;
}

/**
 * Extract all const names from content
 */
function extractConstNames(content: string): Set<string> {
    const names = new Set<string>();
    const regex = /(?:export\s+)?const\s+(\w+)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        names.add(match[1]);
    }

    return names;
}
