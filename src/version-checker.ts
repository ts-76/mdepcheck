export interface VersionInfo {
    package: string;
    current: string;
    latest: string;
}

// Simple in-memory cache for package versions
const versionCache = new Map<string, string>();

// Concurrency limiter for parallel requests
async function limitConcurrency<T>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<void>
): Promise<void> {
    const queue = [...items];
    const running: Promise<void>[] = [];

    while (queue.length > 0 || running.length > 0) {
        while (running.length < concurrency && queue.length > 0) {
            const item = queue.shift()!;
            const promise = fn(item).finally(() => {
                running.splice(running.indexOf(promise), 1);
            });
            running.push(promise);
        }
        if (running.length > 0) {
            await Promise.race(running);
        }
    }
}

export class VersionChecker {
    private cache = versionCache;

    /**
     * Pre-fetch versions for multiple packages at once.
     * This deduplicates packages and fetches them in parallel with concurrency limit.
     */
    async prefetch(packageNames: string[]): Promise<void> {
        // Filter out already cached and skip workspace/file protocols
        const toFetch = [...new Set(packageNames)].filter(
            pkg => !this.cache.has(pkg) && !pkg.startsWith('workspace:') && !pkg.startsWith('file:')
        );

        if (toFetch.length === 0) return;

        await limitConcurrency(toFetch, 10, async (pkg) => {
            try {
                const version = await this.fetchLatestVersion(pkg);
                if (version) {
                    this.cache.set(pkg, version);
                }
            } catch {
                // Ignore errors (private packages, network issues)
            }
        });
    }

    /**
     * Fetch the latest version of a package from npm registry.
     * Uses the registry API directly instead of spawning npm processes.
     */
    private async fetchLatestVersion(pkg: string): Promise<string | null> {
        try {
            // Use abbreviated metadata for faster response
            const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`, {
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json() as { version?: string };
            return data.version || null;
        } catch {
            return null;
        }
    }

    /**
     * Check versions for a set of dependencies.
     * Uses cache if available, otherwise fetches from registry.
     */
    async checkVersions(dependencies: Record<string, string>): Promise<VersionInfo[]> {
        const results: VersionInfo[] = [];

        for (const [pkg, currentRange] of Object.entries(dependencies)) {
            // Skip workspace protocols and file paths
            if (currentRange.startsWith('workspace:') || currentRange.startsWith('file:')) {
                continue;
            }

            let latest = this.cache.get(pkg);

            // If not in cache, fetch it (fallback for single package check)
            if (!latest) {
                latest = await this.fetchLatestVersion(pkg) || undefined;
                if (latest) {
                    this.cache.set(pkg, latest);
                }
            }

            if (latest) {
                results.push({
                    package: pkg,
                    current: currentRange,
                    latest: latest,
                });
            }
        }

        return results;
    }

    /**
     * Clear the version cache
     */
    clearCache(): void {
        this.cache.clear();
    }
}
