import { z } from "npm:zod@4.3.6";

export const AzureGlobalArgsSchema = z.object({
  subscriptionId: z.string().describe(
    "Azure subscription ID. Use: ${{ vault.get('azure', 'SUBSCRIPTION_ID') }}",
  ),
  resourceGroup: z
    .string()
    .optional()
    .describe("Default resource group for operations that require one"),
});

/**
 * Global arguments for tenant-scoped Entra ID (`az ad`) models. Entra
 * directory objects are not subscription-scoped, so these models pass
 * `undefined` for the subscription to {@link az} and never emit a
 * `--subscription` flag. Authentication uses the active `az login`
 * session; `tenantId` is informational/documentary only — `az ad`
 * commands target whatever tenant that session is signed in to.
 */
export const EntraGlobalArgsSchema = z.object({
  tenantId: z
    .string()
    .optional()
    .describe(
      "Entra tenant ID for context/documentation. Auth uses the active az login session.",
    ),
});

export async function az(
  args: string[],
  subscriptionId?: string,
): Promise<unknown> {
  const fullArgs = [...args, "--output", "json"];
  if (subscriptionId) {
    fullArgs.push("--subscription", subscriptionId);
  }

  const cmd = new Deno.Command("az", {
    args: fullArgs,
    stdout: "piped",
    stderr: "piped",
  });

  const result = await cmd.output();
  const stderr = new TextDecoder().decode(result.stderr);

  if (result.code !== 0) {
    throw new Error(`az ${args.slice(0, 2).join(" ")} failed: ${stderr}`);
  }

  const stdout = new TextDecoder().decode(result.stdout).trim();
  if (!stdout) return null;

  return JSON.parse(stdout);
}

/**
 * Classify an error thrown by {@link az} as a "not found" condition, so
 * delete-style methods can treat an already-absent target as success
 * (idempotent delete) rather than failing the workflow.
 */
export function isAzNotFound(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  return (
    msg.includes("not found") ||
    msg.includes("does not exist") ||
    msg.includes("resourcenotfound") ||
    msg.includes("request_resourcenotfound") ||
    msg.includes("could not be found")
  );
}

/**
 * Classify an error thrown by {@link az} as an "already exists" / conflict
 * condition, so create-style methods can converge on the existing resource
 * instead of failing (idempotent create).
 */
export function isAzAlreadyExists(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  return (
    msg.includes("already exist") ||
    msg.includes("roleassignmentexists") ||
    msg.includes("already present") ||
    msg.includes("references already exist") ||
    msg.includes("conflict")
  );
}

export function sanitizeInstanceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.\./g, "--")
    .replace(/[/\\]/g, "-")
    .replace(/\0/g, "");
}

export function requireResourceGroup(
  methodArg: string | undefined,
  globalArg: string | undefined,
): string {
  const rg = methodArg || globalArg;
  if (!rg) {
    throw new Error(
      "resourceGroup is required — pass it as an argument or set it in globalArguments",
    );
  }
  return rg;
}

/**
 * Poll a condition function until it returns true or the timeout expires.
 * Used for readiness polling after create/update operations where the CLI
 * returns before the resource reaches a stable state.
 *
 * @param check - async function that returns true when the resource is ready
 * @param options - intervalMs (default 5000), timeoutMs (default 300000), label for logging
 * @returns true if ready, false if timed out
 */
export async function pollUntilReady(
  check: () => Promise<boolean>,
  options?: { intervalMs?: number; timeoutMs?: number; label?: string },
): Promise<boolean> {
  const interval = options?.intervalMs ?? 5000;
  const timeout = options?.timeoutMs ?? 300000;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}
