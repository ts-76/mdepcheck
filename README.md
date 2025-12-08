# mdepcheck

A dependency check tool designed for monorepos. It analyzes your project to find unused, missing, misplaced, and outdated dependencies, supporting nested packages and various package managers.

## Features

- **Monorepo Support**: Automatically detects packages using `package.json` workspaces or `pnpm-workspace.yaml`.
- **Nested Package Handling**: Correctly scans root and sub-packages in isolation, ignoring nested package directories.
- **Dependency Analysis**: Identifies:
  - **Unused dependencies**: Packages listed in `package.json` but not imported in the code.
  - **Missing dependencies**: Packages imported in the code but not listed in `package.json`.
  - **Wrong dependency types**: Dependencies that should be in `devDependencies` but are in `dependencies` (or vice versa).
  - **Outdated dependencies**: Packages with newer versions available on npm.
  - **Version mismatches**: Same dependency with different versions across packages in the monorepo.
- **Package Manager Agnostic**: Works with npm, yarn, pnpm, and bun.
- **TypeScript Support**: Parses TypeScript files to extract imports.
- **Configurable**: Supports configuration files to customize behavior.
- **CI/AI Friendly**: Provides compact output mode for automation and AI agents.

## Installation

```bash
npm install -g @ts-76/mdepcheck
```

Or use directly via npx:

```bash
npx @ts-76/mdepcheck
```

### From Source

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Link globally (optional):
   ```bash
   npm link
   ```

## Usage

### Basic Usage

Run the tool against your project root:

```bash
npx @ts-76/mdepcheck /path/to/your/project
```

Or in the current directory:

```bash
npx @ts-76/mdepcheck .
```

### Options

| Option | Description |
|--------|-------------|
| `--compact` | Output compact log format for AI agents and CI pipelines |

### Output Example

```text
📦 mdepcheck - Monorepo Dependency Checker

Analyzing project at /path/to/project...
Found 3 packages.

📁 package-a
   /path/to/project/packages/a
   ⚠ Unused dependencies:
     - lodash
   ✗ Missing dependencies:
     - react
   ⚡ Wrong dependency types:
     - chalk: Should be in devDependencies (found in dependencies)
   ⏰ Outdated dependencies:
     - typescript: ^5.0.0 → 5.3.3

📁 package-b
   /path/to/project/packages/b
   ✓ No issues found.

🔀 Version Mismatches Found:
   lodash:
     - ^4.17.21 in package-a, package-c
     - ^4.17.20 in package-b

──────────────────────────────────────────────────

📊 Summary

   Packages scanned:     3
   Packages with issues: 1

   ⚠ Unused:      1
   ✗ Missing:     1
   ⚡ Wrong type:  1
   ⏰ Outdated:    1
   🔀 Mismatches:  1

──────────────────────────────────────────────────

❌ Total issues: 5
```

### Compact Output

For CI pipelines or AI agents, use the `--compact` flag:

```bash
npx @ts-76/mdepcheck . --compact
```

Output:
```text
[mdepcheck] scanned=3 issues=5
[unused] package-a: lodash
[missing] package-a: react
[wrongType] package-a: chalk (dependencies -> devDependencies)
[outdated] package-a: typescript (^5.0.0 -> 5.3.3)
[mismatch] *: lodash (^4.17.21(package-a,package-c) vs ^4.17.20(package-b))
```

## Configuration

Create a configuration file in your project root. Supported formats:

- `.mdepcheckrc`
- `.mdepcheckrc.json`
- `.mdepcheckrc.yaml`
- `.mdepcheckrc.yml`
- `.mdepcheckrc.js`
- `.mdepcheckrc.cjs`
- `mdepcheck.config.js`
- `mdepcheck.config.cjs`

### Configuration Options

```json
{
  "ignorePatterns": ["**/generated/**", "**/fixtures/**"],
  "ignoreDependencies": ["some-optional-peer-dep"],
  "skipPackages": ["@myorg/internal-tools"],
  "checkOutdated": true
}
```

| Option | Type | Description |
|--------|------|-------------|
| `ignorePatterns` | `string[]` | Glob patterns for files/directories to ignore during scanning |
| `ignoreDependencies` | `string[]` | Dependencies to exclude from unused/missing checks |
| `skipPackages` | `string[]` | Package names to skip entirely |
| `checkOutdated` | `boolean` | Enable/disable outdated dependency checking (default: `true`) |

## How it Works

1. **Monorepo Detection**: It looks for `workspaces` in `package.json` or `packages` in `pnpm-workspace.yaml` to identify all packages in the monorepo.
2. **File Scanning**: For each package, it scans for source files (`.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`), excluding `node_modules`, `dist`, `build`, and nested sub-packages.
3. **Import Parsing**: It parses the source files using TypeScript's parser to find all import statements.
4. **Dependency Comparison**: It compares the found imports against the `dependencies`, `devDependencies`, and `peerDependencies` listed in the package's `package.json`.
5. **Type Classification**: It detects whether imports are used in production code or test files to identify wrong dependency types.
6. **Version Checking**: It queries the npm registry to find the latest versions of dependencies.
7. **Consistency Check**: It compares dependency versions across all packages to find mismatches.

## Exit Codes

| Code | Description |
|------|-------------|
| `0` | No issues found |
| `1` | One or more issues detected |

## License

MIT
