import { Volume, createFsFromVolume } from "memfs";
import * as realFs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import type {
  Blueprint,
  BlueprintNode,
  CodegenOutput,
  ExecutionContext,
} from "@dapp-forge/blueprint-schema";
import { topologicalSort } from "@dapp-forge/blueprint-schema";
import {
  getDefaultRegistry,
  buildPathContext,
  rewriteOutputPaths,
  type NodePlugin,
  type PathContext,
} from "@dapp-forge/plugin-sdk";
import type { PathCategory } from "@dapp-forge/blueprint-schema";
import { RunStore } from "../store/runs";
import { createExecutionLogger } from "../utils/logger";
import {
  applyCodegenOutput,
  formatAndLint,
  createManifest,
} from "./filesystem";
import { GitHubIntegration } from "./github";

export interface ExecutionOptions {
  dryRun?: boolean;
  createGitHubRepo?: boolean;
  githubToken?: string; // User's OAuth token from session
}

export interface ExecutionResult {
  success: boolean;
  files: Array<{ path: string; size: number }>;
  envVars: Array<{ key: string; description: string }>;
  scripts: Array<{ name: string; command: string }>;
  repoUrl?: string;
}

/**
 * Execution engine for running blueprint code generation
 */
export class ExecutionEngine {
  private registry = getDefaultRegistry();
  private runStore = new RunStore();
  private githubIntegration = new GitHubIntegration();

  /**
   * Execute a blueprint and generate code
   */
  async execute(
    blueprint: Blueprint,
    runId: string,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult> {
    const logger = createExecutionLogger(runId);
    // Mark run as started
    this.runStore.start(runId);
    logger.info("Starting blueprint execution", { blueprintId: blueprint.id });

    try {
      // Create in-memory filesystem
      const vol = new Volume();
      const fs = createFsFromVolume(vol);

      // Initialize the filesystem with base structure
      fs.mkdirSync("/output", { recursive: true });
      fs.mkdirSync("/output/src", { recursive: true });
      fs.mkdirSync("/output/docs", { recursive: true });

      // Get topological order of nodes
      const sortedNodes = topologicalSort(blueprint.nodes, blueprint.edges);
      if (!sortedNodes) {
        throw new Error(
          "Blueprint contains cycles - cannot determine execution order"
        );
      }

      logger.info(`Executing ${sortedNodes.length} nodes in topological order`);

      // Build path context for intelligent file routing
      const pathContext = buildPathContext(sortedNodes);
      logger.info("Path context built", {
        hasFrontend: pathContext.hasFrontend,
        hasBackend: pathContext.hasBackend,
        hasContracts: pathContext.hasContracts,
      });

      // Track outputs from each node
      const nodeOutputs = new Map<string, CodegenOutput>();
      const allEnvVars: CodegenOutput["envVars"] = [];
      const allScripts: CodegenOutput["scripts"] = [];

      // Execute each node in order
      for (const node of sortedNodes) {
        logger.info(`Processing node: ${node.type}`, { nodeId: node.id });
        this.runStore.addLog(runId, {
          level: "info",
          message: `Processing node: ${node.type}`,
          nodeId: node.id,
        });

        // Get the plugin for this node type
        const plugin = this.registry.get(node.type) as NodePlugin | undefined;
        if (!plugin) {
          throw new Error(`No plugin found for node type: ${node.type}`);
        }

        // Create execution context
        const context: ExecutionContext = {
          blueprintId: blueprint.id,
          runId,
          config: blueprint.config,
          nodeOutputs,
          logger: createExecutionLogger(runId, node.id),
          pathContext,
        };

        // Validate node config
        const validationResult = await plugin.validate(node.config, context);
        if (!validationResult.valid) {
          const errors = validationResult.errors
            .map((e) => `${e.field}: ${e.message}`)
            .join(", ");
          throw new Error(`Node ${node.id} validation failed: ${errors}`);
        }

        // Generate code
        const output = await plugin.generate(node, context);

        // Rewrite file paths based on path context (intelligent routing)
        output.files = rewriteOutputPaths(output.files, pathContext);

        nodeOutputs.set(node.id, output);

        // Apply output to filesystem
        applyCodegenOutput(fs, "/output", output);

        // Copy component package if plugin has one (pre-built component architecture)
        if (plugin.componentPath) {
          logger.info(`Copying component package: ${plugin.componentPackage}`, {
            nodeId: node.id,
          });
          this.copyComponentToOutput(
            fs,
            "/output",
            plugin.componentPath,
            plugin.componentPackage || "component",
            pathContext,
            plugin.componentPathMappings
          );
        }

        // Collect env vars and scripts
        allEnvVars.push(...output.envVars);
        allScripts.push(...output.scripts);

        logger.info(
          `Node ${node.type} generated ${output.files.length} files`,
          { nodeId: node.id }
        );
      }

      // Generate root files
      generateRootFiles(
        fs,
        "/output",
        blueprint,
        allEnvVars,
        allScripts,
        pathContext,
        sortedNodes
      );

      // Run format and lint
      logger.info("Running format and lint checks");
      this.runStore.addLog(runId, {
        level: "info",
        message: "Running format and lint checks",
      });

      const lintResult = await formatAndLint(fs, "/output");
      if (!lintResult.success) {
        logger.warn("Lint/format warnings", { warnings: lintResult.warnings });
      }

      // Create manifest
      const manifest = createManifest(fs, "/output");

      // Handle GitHub repo creation
      let repoUrl: string | undefined;
      if (
        options.createGitHubRepo &&
        blueprint.config.github &&
        !options.dryRun
      ) {
        logger.info("Creating GitHub repository");
        this.runStore.addLog(runId, {
          level: "info",
          message: "Creating GitHub repository",
        });

        // Set the user's OAuth token if provided
        if (options.githubToken) {
          this.githubIntegration.setUserToken(options.githubToken);
        }

        const repoResult = await this.githubIntegration.createRepository(
          blueprint.config.github,
          fs,
          "/output"
        );

        repoUrl = repoResult.url;

        this.runStore.addArtifact(runId, {
          name: "GitHub Repository",
          type: "repo",
          url: repoUrl,
        });
      }

      // Add file manifest as artifact
      this.runStore.addArtifact(runId, {
        name: "Generated Files",
        type: "report",
        content: JSON.stringify(manifest, null, 2),
      });

      // Mark run as completed
      this.runStore.complete(runId);

      return {
        success: true,
        files: manifest.files,
        envVars: allEnvVars,
        scripts: allScripts,
        repoUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error("Execution failed", { error: message });
      this.runStore.fail(runId, message);
      throw error;
    }
  }

  /**
   * Copy a component package from the source repo to the output
   * Uses path mappings for intelligent file routing when available
   */
  private copyComponentToOutput(
    memFs: ReturnType<typeof createFsFromVolume>,
    outputPath: string,
    componentPath: string,
    packageName: string,
    pathContext: PathContext,
    pathMappings?: Record<string, PathCategory>
  ): void {
    const currentFileDir = dirname(fileURLToPath(import.meta.url));

    // Robust project root detection
    // 1. Check for environment variable
    // 2. Look for workspace marker (pnpm-workspace.yaml) in parent directories
    // 3. Fallback to rigid relative path
    let projectRoot = process.env.PROJECT_ROOT;

    if (!projectRoot) {
      let currentDir = currentFileDir;
      const rootMarker = "pnpm-workspace.yaml";
      while (currentDir !== path.parse(currentDir).root) {
        if (realFs.existsSync(path.join(currentDir, rootMarker))) {
          projectRoot = currentDir;
          break;
        }
        currentDir = path.dirname(currentDir);
      }
    }

    if (!projectRoot) {
      // Fallback: This handles both src (../../../../) and dist (../../../)
      // but the recursive search above is much more reliable
      projectRoot = path.resolve(
        currentFileDir,
        currentFileDir.includes("dist") ? "../../../" : "../../../../"
      );
    }

    const sourcePath = path.join(projectRoot, componentPath);

    if (!realFs.existsSync(sourcePath)) {
      console.warn(`Component path not found: ${sourcePath}`);
      return;
    }

    console.log(`Copying component from: ${sourcePath}`);

    // Derive a namespace from the package name to avoid file collisions
    // e.g., "@cradle/maxxit-lazy-trader" → "maxxit-lazy-trader"
    const componentNamespace = packageName.includes("/")
      ? packageName.split("/").pop()!
      : packageName;

    // If path mappings are provided and we have a frontend scaffold, use intelligent routing
    if (pathMappings && pathContext.hasFrontend) {
      console.log(`Using path mappings for ${packageName} (namespace: ${componentNamespace})`);
      this.copyWithPathMappings(
        realFs,
        memFs,
        sourcePath,
        outputPath,
        pathMappings,
        pathContext,
        componentNamespace
      );
      return;
    }

    // Legacy: Special case for wallet-auth without path mappings
    if (packageName === "@cradle/wallet-auth" && pathContext.hasFrontend) {
      console.log(
        "Merging wallet-auth into apps/web/src/ (frontend-scaffold detected)"
      );
      this.copyWalletAuthMerged(realFs, memFs, sourcePath, outputPath);
      return;
    }

    // Default: Copy as separate package
    const dirName = packageName.includes("/")
      ? packageName.split("/").pop()!
      : packageName;

    const targetPath = `${outputPath}/packages/${dirName}`;

    this.copyDirectoryToMemfs(realFs, memFs, sourcePath, targetPath);
  }

  /**
   * Copy component files using path mappings for intelligent routing.
   *
   * Strategy: Copy the component's src/ directory into a namespaced subdirectory
   * under the frontend lib path (e.g., apps/web/src/lib/maxxit-lazy-trader/).
   * This preserves all internal relative imports between component files.
   *
   * Special handling:
   * - contract-source files: copied to contracts/ preserving structure
   * - Hook files: copied to apps/web/src/hooks/ with import rewriting
   * - types.ts, constants.ts: merged into shared location AND copied to namespace
   * - README/docs: copied to docs/
   */
  private copyWithPathMappings(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    outputPath: string,
    pathMappings: Record<string, PathCategory>,
    pathContext: PathContext,
    componentNamespace: string
  ): void {
    // Phase 1: Copy ALL src/ files to the namespaced lib directory
    // e.g., apps/web/src/lib/maxxit-lazy-trader/
    // This preserves internal relative imports (../api, ./types, etc.)
    const srcPath = path.join(sourcePath, "src");
    if (sourceFs.existsSync(srcPath)) {
      const namespacedLibPath = pathContext.hasFrontend
        ? `${outputPath}/${pathContext.frontendPath}/${pathContext.frontendSrcPath}/lib/${componentNamespace}`
        : `${outputPath}/src/lib/${componentNamespace}`;

      console.log(`  Phase 1: Copying src/ → ${namespacedLibPath.replace(outputPath + "/", "")}`);
      this.copyDirectoryToMemfs(sourceFs, targetFs, srcPath, namespacedLibPath);
    }

    // Phase 2: Handle contract-source files (outside src/)
    this.copyContractFiles(
      sourceFs,
      targetFs,
      sourcePath,
      outputPath,
      "",
      pathMappings
    );

    // Phase 3: Create re-exports in standard hook/type barrel files
    // so hooks are discoverable from apps/web/src/hooks/ and types from apps/web/src/types/
    if (pathContext.hasFrontend && sourceFs.existsSync(srcPath)) {
      this.createComponentReExports(
        sourceFs,
        targetFs,
        srcPath,
        outputPath,
        pathContext,
        componentNamespace
      );
    }

    // Phase 4: Copy README/docs
    this.copyComponentDocs(sourceFs, targetFs, sourcePath, outputPath);
  }

  /**
   * Copy contract-source files from a component (if any) to the contracts/ directory
   */
  private copyContractFiles(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    outputPath: string,
    relativePath: string,
    pathMappings: Record<string, PathCategory>
  ): void {
    const currentPath = relativePath
      ? path.join(sourcePath, relativePath)
      : sourcePath;

    if (!sourceFs.existsSync(currentPath)) return;

    const items = sourceFs.readdirSync(currentPath);

    for (const item of items) {
      if (
        item === "node_modules" ||
        item === "dist" ||
        item === "target" ||
        item === "src" ||
        item.startsWith(".")
      ) {
        continue;
      }

      const sourceItem = path.join(currentPath, item);
      const relativeItem = relativePath ? `${relativePath}/${item}` : item;
      const stat = sourceFs.statSync(sourceItem);

      if (stat.isDirectory()) {
        this.copyContractFiles(
          sourceFs,
          targetFs,
          sourcePath,
          outputPath,
          relativeItem,
          pathMappings
        );
      } else {
        const category = this.findPathCategory(relativeItem, pathMappings);

        if (category === "contract-source") {
          const contractRelativePath = relativeItem.replace(
            /^contract\//,
            ""
          );
          const targetPath = `${outputPath}/contracts/${contractRelativePath}`;
          const targetDir = path.dirname(targetPath);
          targetFs.mkdirSync(targetDir, { recursive: true });
          const content = sourceFs.readFileSync(sourceItem);
          targetFs.writeFileSync(targetPath, content);
          console.log(
            `  ${relativeItem} -> contracts/${contractRelativePath} (contract-source) [created]`
          );
        }
      }
    }
  }

  /**
   * Create re-exports in barrel files (hooks/index.ts, types/types.ts, lib/constants.ts)
   * so component hooks, types, and constants are discoverable from standard import paths.
   *
   * For example, after copying maxxit-lazy-trader to lib/maxxit-lazy-trader/,
   * this adds to hooks/index.ts:
   *   export * from '../lib/maxxit-lazy-trader/hooks';
   *
   * And to types/types.ts:
   *   export * from '../lib/maxxit-lazy-trader/types';
   *
   * And to lib/constants.ts:
   *   export * from './maxxit-lazy-trader/constants';
   */
  private createComponentReExports(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    srcPath: string,
    outputPath: string,
    pathContext: PathContext,
    componentNamespace: string
  ): void {
    const frontendBase = `${outputPath}/${pathContext.frontendPath}/${pathContext.frontendSrcPath}`;

    // --- Hook re-exports ---
    const hooksDir = path.join(srcPath, "hooks");
    if (sourceFs.existsSync(hooksDir)) {
      const hooksIndexPath = path.join(hooksDir, "index.ts");
      const targetHooksIndex = `${frontendBase}/hooks/index.ts`;
      targetFs.mkdirSync(path.dirname(targetHooksIndex), { recursive: true });

      let existingContent = "";
      try {
        existingContent = targetFs.readFileSync(targetHooksIndex, "utf-8") as string;
      } catch {
        // File doesn't exist yet
      }

      if (sourceFs.existsSync(hooksIndexPath)) {
        // Component has hooks/index.ts — re-export the barrel
        const reExportLine = `\n// Re-exports from ${componentNamespace}\nexport * from '../lib/${componentNamespace}/hooks';\n`;

        if (!existingContent.includes(`from '../lib/${componentNamespace}/hooks'`)) {
          targetFs.writeFileSync(
            targetHooksIndex,
            existingContent + reExportLine
          );
          console.log(
            `  hooks/index.ts -> Added re-export for ${componentNamespace} hooks`
          );
        }
      } else {
        // No hooks/index.ts — scan individual hook files and re-export each one
        const hookFiles = (sourceFs.readdirSync(hooksDir) as string[]).filter(
          (f: string) => f.endsWith(".ts") && f !== "index.ts"
        );

        if (hookFiles.length > 0) {
          const reExportLines = hookFiles
            .map((f: string) => {
              const hookName = f.replace(/\.ts$/, "");
              return `export * from '../lib/${componentNamespace}/hooks/${hookName}';`;
            })
            .join("\n");

          const block = `\n// Re-exports from ${componentNamespace}\n${reExportLines}\n`;

          if (!existingContent.includes(`from '../lib/${componentNamespace}/hooks/`)) {
            targetFs.writeFileSync(
              targetHooksIndex,
              existingContent + block
            );
            console.log(
              `  hooks/index.ts -> Added individual re-exports for ${componentNamespace} hooks (${hookFiles.join(", ")})`
            );
          }
        }
      }
    }

    // --- Type re-exports ---
    const typesFile = path.join(srcPath, "types.ts");
    if (sourceFs.existsSync(typesFile)) {
      const targetTypesPath = `${frontendBase}/types/types.ts`;
      targetFs.mkdirSync(path.dirname(targetTypesPath), { recursive: true });

      let existingTypes = "";
      try {
        existingTypes = targetFs.readFileSync(targetTypesPath, "utf-8") as string;
      } catch {
        // File doesn't exist yet
      }

      const reExportLine = `\n// Re-exports from ${componentNamespace}\nexport * from '../lib/${componentNamespace}/types';\n`;

      if (!existingTypes.includes(`from '../lib/${componentNamespace}/types'`)) {
        targetFs.writeFileSync(
          targetTypesPath,
          existingTypes + reExportLine
        );
        console.log(
          `  types/types.ts -> Added re-export for ${componentNamespace} types`
        );
      }
    }

    // --- Constants re-exports ---
    const constantsFile = path.join(srcPath, "constants.ts");
    if (sourceFs.existsSync(constantsFile)) {
      const targetConstantsPath = `${frontendBase}/lib/constants.ts`;
      targetFs.mkdirSync(path.dirname(targetConstantsPath), { recursive: true });

      let existingConstants = "";
      try {
        existingConstants = targetFs.readFileSync(targetConstantsPath, "utf-8") as string;
      } catch {
        // File doesn't exist yet
      }

      const reExportLine = `\n// Re-exports from ${componentNamespace}\nexport * from './${componentNamespace}/constants';\n`;

      if (!existingConstants.includes(`from './${componentNamespace}/constants'`)) {
        targetFs.writeFileSync(
          targetConstantsPath,
          existingConstants + reExportLine
        );
        console.log(
          `  lib/constants.ts -> Added re-export for ${componentNamespace} constants`
        );
      }
    }
  }

  /**
   * Copy README and doc files from a component to the docs/ directory
   */
  private copyComponentDocs(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    outputPath: string
  ): void {
    const items = sourceFs.readdirSync(sourcePath);
    for (const item of items) {
      if (item === "README.md" || item.endsWith(".md")) {
        const sourceItem = path.join(sourcePath, item);
        const stat = sourceFs.statSync(sourceItem);
        if (!stat.isDirectory()) {
          const docsPath = `${outputPath}/docs`;
          targetFs.mkdirSync(docsPath, { recursive: true });
          const content = sourceFs.readFileSync(sourceItem);
          targetFs.writeFileSync(`${docsPath}/${item}`, content);
        }
      }
    }
  }

  /**
   * Find the path category for a file based on path mappings
   * Supports glob-like patterns: ** for any path, * for any filename
   */
  private findPathCategory(
    filePath: string,
    pathMappings: Record<string, PathCategory>
  ): PathCategory | undefined {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, "/");

    for (const [pattern, category] of Object.entries(pathMappings)) {
      if (this.matchPattern(normalizedPath, pattern)) {
        return category;
      }
    }

    return undefined;
  }

  /**
   * Simple glob pattern matching
   * Supports: ** (any path), * (any filename without /)
   */
  private matchPattern(filePath: string, pattern: string): boolean {
    // Escape regex special chars except *
    let regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, "<<<DOUBLE>>>") // Placeholder for **
      .replace(/\*/g, "[^/]*") // * matches anything except /
      .replace(/<<<DOUBLE>>>/g, ".*"); // ** matches anything including /

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  /**
   * Copy wallet-auth files merged into apps/web/src/ structure
   */
  private copyWalletAuthMerged(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    outputPath: string
  ): void {
    const srcPath = path.join(sourcePath, "src");
    if (!sourceFs.existsSync(srcPath)) {
      console.warn(`wallet-auth src/ not found: ${srcPath}`);
      return;
    }

    // Mapping: wallet-auth/src/X -> apps/web/src/X
    const webSrcPath = `${outputPath}/apps/web/src`;

    const items = sourceFs.readdirSync(srcPath);
    for (const item of items) {
      if (item === "node_modules" || item.startsWith(".")) continue;

      const sourceItem = path.join(srcPath, item);
      const stat = sourceFs.statSync(sourceItem);

      if (stat.isDirectory()) {
        // Copy directories like hooks/, preserving folder structure
        const targetDir = `${webSrcPath}/${item}`;
        this.copyDirectoryToMemfs(sourceFs, targetFs, sourceItem, targetDir);
      } else {
        // Copy individual files to lib/ (config.ts, constants.ts, types.ts, etc)
        const targetDir = `${webSrcPath}/lib`;
        targetFs.mkdirSync(targetDir, { recursive: true });
        const content = sourceFs.readFileSync(sourceItem);
        targetFs.writeFileSync(`${targetDir}/${item}`, content);
      }
    }

    // Also copy README.md to docs/wallet-auth/
    const readmePath = path.join(sourcePath, "README.md");
    if (sourceFs.existsSync(readmePath)) {
      const docsPath = `${outputPath}/docs/wallet-auth`;
      targetFs.mkdirSync(docsPath, { recursive: true });
      const content = sourceFs.readFileSync(readmePath);
      targetFs.writeFileSync(`${docsPath}/README.md`, content);
    }
  }

  /**
   * Recursively copy a directory from real fs to memfs
   */
  private copyDirectoryToMemfs(
    sourceFs: typeof realFs,
    targetFs: ReturnType<typeof createFsFromVolume>,
    sourcePath: string,
    targetPath: string
  ): void {
    targetFs.mkdirSync(targetPath, { recursive: true });

    const items = sourceFs.readdirSync(sourcePath);

    for (const item of items) {
      if (
        item === "node_modules" ||
        item === "dist" ||
        item === "target" ||
        item.startsWith(".")
      ) {
        continue;
      }

      const sourceItem = path.join(sourcePath, item);
      const targetItem = `${targetPath}/${item}`;
      const stat = sourceFs.statSync(sourceItem);

      if (stat.isDirectory()) {
        this.copyDirectoryToMemfs(sourceFs, targetFs, sourceItem, targetItem);
      } else {
        const content = sourceFs.readFileSync(sourceItem);
        targetFs.writeFileSync(targetItem, content);
      }
    }
  }
}

/**
 * Generate root project files
 */
function generateRootFiles(
  fs: ReturnType<typeof createFsFromVolume>,
  basePath: string,
  blueprint: Blueprint,
  envVars: CodegenOutput["envVars"],
  scripts: CodegenOutput["scripts"],
  pathContext?: PathContext,
  nodes?: BlueprintNode[]
): void {
  // Determine if we need monorepo structure
  // Only need monorepo if:
  // 1. Has backend (multiple apps need coordination), OR
  // 2. Has contracts WITHOUT frontend (standalone contract project needs different setup)
  // When frontend + ERC contracts, we don't need monorepo - frontend handles the interaction
  const needsMonorepo =
    pathContext?.hasBackend ||
    (pathContext?.hasContracts && !pathContext?.hasFrontend) ||
    !pathContext?.hasFrontend;
  const { project } = blueprint.config;

  // Generate package.json
  // Adjust scripts based on whether we need monorepo structure
  const packageJson = needsMonorepo
    ? {
      name: project.name.toLowerCase().replace(/\s+/g, "-"),
      version: project.version,
      description: project.description,
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
        ...Object.fromEntries(scripts.map((s) => [s.name, s.command])),
      },
      dependencies: {},
      devDependencies: {
        typescript: "^5.3.0",
      },
      packageManager: "pnpm@9.0.0",
      author: project.author,
      license: project.license,
      keywords: project.keywords,
    }
    : {
      // Standalone frontend - simpler package.json pointing to apps/web
      name: project.name.toLowerCase().replace(/\s+/g, "-"),
      version: project.version,
      description: project.description,
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
        ...Object.fromEntries(scripts.map((s) => [s.name, s.command])),
      },
      dependencies: {},
      devDependencies: {
        typescript: "^5.3.0",
      },
      packageManager: "pnpm@9.0.0",
      license: project.license,
      keywords: project.keywords,
    };

  fs.writeFileSync(
    `${basePath}/package.json`,
    JSON.stringify(packageJson, null, 2)
  );

  // Generate .env.example
  // Put in apps/web for standalone frontend, root for monorepo
  const envExampleHeader =
    "# Environment Variables\n# Copy this file to .env and fill in the values\n\n";
  const dedupedEnvVars = dedupeEnvVars(envVars);
  const envVarsContent = dedupedEnvVars
    .map(
      (v) =>
        `# ${v.description}${v.required ? " (required)" : ""}${v.secret ? " [secret]" : ""
        }\n${v.key}=${v.defaultValue || ""}`
    )
    .join("\n\n");
  const envExample =
    envExampleHeader +
    (envVarsContent || "# No environment variables required\n");

  const envPath =
    pathContext?.hasFrontend && !needsMonorepo
      ? `${basePath}/apps/web/.env.example`
      : `${basePath}/.env.example`;
  fs.writeFileSync(envPath, envExample);

  // Generate README.md
  const readme = generateReadme(project, scripts, dedupedEnvVars, nodes);
  fs.writeFileSync(`${basePath}/README.md`, readme);

  // Generate .gitignore
  const gitignore = `# Dependencies
node_modules/
.pnpm-store/

# Build
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store

# Logs
*.log

# Test coverage
coverage/

# Rust/WASM
target/
*.wasm

# Generated
*.generated.*
`;
  fs.writeFileSync(`${basePath}/.gitignore`, gitignore);

  // Generate turbo.json and pnpm-workspace.yaml only for monorepo structure
  if (needsMonorepo) {
    // Generate turbo.json
    const turboConfig = {
      $schema: "https://turbo.build/schema.json",
      tasks: {
        build: {
          dependsOn: ["^build"],
          outputs: ["dist/**", ".next/**"],
        },
        dev: {
          cache: false,
          persistent: true,
        },
        test: {
          dependsOn: ["^build"],
        },
        lint: {},
      },
    };
    // fs.writeFileSync(`${basePath}/turbo.json`, JSON.stringify(turboConfig, null, 2));

    // Generate pnpm-workspace.yaml
    const pnpmWorkspace = `packages:
  - "apps/*"
  - "packages/*"
  - "contracts/*"
`;
    fs.writeFileSync(`${basePath}/pnpm-workspace.yaml`, pnpmWorkspace);
  }
}

/**
 * Dedupe environment variables by key while preserving important flags.
 * If the same key appears multiple times, we:
 * - keep the first description (if any)
 * - OR flags (required/secret)
 * - keep the first non-empty defaultValue
 */
function dedupeEnvVars(
  envVars: CodegenOutput["envVars"]
): CodegenOutput["envVars"] {
  const byKey = new Map<string, CodegenOutput["envVars"][number]>();

  for (const v of envVars) {
    const existing = byKey.get(v.key);

    if (!existing) {
      byKey.set(v.key, { ...v });
    } else {
      existing.required = existing.required || v.required;
      existing.secret = existing.secret || v.secret;

      if (!existing.description && v.description) {
        existing.description = v.description;
      }

      if (
        (existing.defaultValue === undefined || existing.defaultValue === "") &&
        v.defaultValue !== undefined &&
        v.defaultValue !== ""
      ) {
        existing.defaultValue = v.defaultValue;
      }
    }
  }

  return Array.from(byKey.values());
}

function generateReadme(
  project: Blueprint["config"]["project"],
  scripts: CodegenOutput["scripts"],
  envVars: CodegenOutput["envVars"],
  nodes?: BlueprintNode[]
): string {
  const appSlug = project.name.toLowerCase().replace(/\s+/g, "-");
  const nodeTypes = new Set((nodes || []).map((n) => n.type));

  // Build contracts section based on which plugins are present
  let contractsStructure =
    "├── contracts/                  # Rust/Stylus smart contracts\n";
  if (nodeTypes.has("smartcache-caching")) {
    contractsStructure += `│   ├── mycontract/            # Original contract (no caching)\n`;
    contractsStructure += `│   │   └── src/lib.rs\n`;
    contractsStructure += `│   └── cached-contract/       # Contract with is_cacheable helper\n`;
    contractsStructure += `│       └── src/lib.rs\n`;
  } else if (nodeTypes.has("stylus-contract")) {
    contractsStructure += `│   └── counter-contract/      # Stylus template (edit src/lib.rs per docs)\n`;
    contractsStructure += `│       └── src/lib.rs\n`;
  } else if (
    nodeTypes.has("erc20-stylus") ||
    nodeTypes.has("erc721-stylus") ||
    nodeTypes.has("erc1155-stylus")
  ) {
    const contracts: string[] = [];
    if (nodeTypes.has("erc20-stylus")) contracts.push("erc20");
    if (nodeTypes.has("erc721-stylus")) contracts.push("erc721");
    if (nodeTypes.has("erc1155-stylus")) contracts.push("erc1155");
    contracts.forEach((c) => {
      contractsStructure += `│   └── ${c}/\n`;
    });
  } else {
    contractsStructure += `│   └── (contract source)\n`;
  }

  const hasFrontend = nodeTypes.has("frontend-scaffold");
  let structureBlock = `\`\`\`\n${appSlug}/\n`;
  if (hasFrontend) {
    structureBlock += `├── apps/\n│   └── web/                    # Next.js frontend\n│       ├── src/\n│       ├── package.json\n│       └── ...\n`;
  }
  structureBlock += `${contractsStructure}├── docs/                       # Documentation\n├── scripts/                     # Deploy scripts\n├── .gitignore\n└── README.md\n\`\`\``;

  return `# ${project.name}

${project.description ||
    "A Web3 dApp composed with [[N]skills](https://www.nskills.xyz)."
    }

## 📁 Project Structure

${structureBlock}

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. **Clone the repository:**
   \`\`\`bash
   git clone <your-repo-url>
   cd ${appSlug}
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   # or
   pnpm install
   \`\`\`

3. **Set up environment variables:**
   \`\`\`bash
   cp .env.example .env
   \`\`\`

   Edit \`.env\` and configure:
   ${envVars
      .filter((v) => v.required)
      .map((v) => `   - \`${v.key}\`: ${v.description}`)
      .join("\n") || "   - No required variables"
    }

4. **Deploy contracts** (from repo root): \`pnpm deploy:sepolia\` or \`pnpm deploy:mainnet\`

5. **Scripts (Windows):** Run \`pnpm fix-scripts\` or \`dos2unix scripts/*.sh\` if you see line-ending errors.

## 🔗 Smart Contracts

The \`contracts/\` folder contains Rust/Stylus smart contract source code. See \`docs/\` for deployment and integration guides.

## 🛠 Available Scripts

| Command | Description |
|---------|-------------|
| \`pnpm deploy:sepolia\` | Deploy to Arbitrum Sepolia |
| \`pnpm deploy:mainnet\` | Deploy to Arbitrum One |
| \`pnpm fix-scripts\` | Fix CRLF line endings (Windows) |

## 🌐 Supported Networks

- Arbitrum Sepolia (Testnet)
- Arbitrum One (Mainnet)
- Superposition
- Superposition Testnet

## 📚 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Web3:** wagmi + viem
- **Wallet Connection:** RainbowKit

## 📖 Documentation

See the \`docs/\` folder for:
- Contract interaction guide
- Deployment instructions
- API reference

## License

${project.license}

---

Generated with ❤️ by [[N]skills](https://www.nskills.xyz)
`;
}
