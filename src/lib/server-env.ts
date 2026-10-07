import "server-only";

/**
 * Server-only secrets. Importing this module from a Client Component fails
 * the build (`server-only`), so these values can never reach the browser.
 * Never prefix these variables with NEXT_PUBLIC_.
 */

function read(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export const serverEnv = {
  /** Which AI provider implementation to use (see src/lib/ai). */
  get aiProvider(): string {
    return read("AI_PROVIDER") ?? "anthropic";
  },
  /** Model id for the selected provider; each provider has its own default. */
  get aiModel(): string | undefined {
    return read("AI_MODEL");
  },
  /** Anthropic API key (console.anthropic.com → API Keys). */
  get anthropicApiKey(): string | undefined {
    return read("ANTHROPIC_API_KEY");
  },

  /**
   * Bypasses Row Level Security. Only for trusted server-side jobs (webhooks,
   * admin tasks, background processing), never for regular user requests.
   * Accepts the legacy service_role key or the newer secret key (sb_secret_...).
   */
  get supabaseServiceRoleKey(): string | undefined {
    return read("SUPABASE_SERVICE_ROLE_KEY") ?? read("SUPABASE_SECRET_KEY");
  },
};
