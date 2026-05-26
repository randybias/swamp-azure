import { z } from "npm:zod@4.3.6";
import {
  az,
  AzureGlobalArgsSchema,
  requireResourceGroup,
  sanitizeInstanceName,
} from "./_helpers.ts";

const ManagedIdentitySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    location: z.string(),
    resourceGroup: z.string(),
    clientId: z.string().optional(),
    principalId: z.string().optional(),
    tenantId: z.string().optional(),
    type: z.string().optional(),
    tags: z.record(z.string(), z.string()).optional(),
  })
  .passthrough();

/**
 * `@dougschaefer/azure-managed-identity` model — user-assigned managed-
 * identity lifecycle, wrapping the `az identity` CLI. list enumerates
 * user-assigned identities across a subscription or resource group
 * with clientId, principalId (the Entra service-principal object id),
 * and tenantId. get and sync return or refresh one identity. create
 * provisions a new user-assigned identity that can then be attached
 * to VMs, Key Vaults, Storage accounts, etc. delete removes it. RBAC
 * role-assignment to and federated-credential configuration on these
 * identities is out of scope here and belongs in the `az role` and
 * `az identity federated-credential` paths.
 */
export const model = {
  type: "@dougschaefer/azure-managed-identity",
  version: "2026.05.26.1",
  globalArguments: AzureGlobalArgsSchema,
  resources: {
    identity: {
      description: "Azure user-assigned managed identity",
      schema: ManagedIdentitySchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
  },
  methods: {
    list: {
      description:
        "List all user-assigned managed identities in a resource group (or subscription).",
      arguments: z.object({
        resourceGroup: z
          .string()
          .optional()
          .describe("Resource group name. Omit to list across subscription."),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const cmdArgs = ["identity", "list"];
        const rg = args.resourceGroup || g.resourceGroup;
        if (rg) cmdArgs.push("--resource-group", rg);

        const identities = (await az(cmdArgs, g.subscriptionId)) as Array<
          Record<string, unknown>
        >;

        context.logger.info("Found {count} managed identities", {
          count: identities.length,
        });

        const handles = [];
        for (const id of identities) {
          const handle = await context.writeResource(
            "identity",
            sanitizeInstanceName(id.name as string),
            id,
          );
          handles.push(handle);
        }
        return { dataHandles: handles };
      },
    },

    get: {
      description: "Get a single user-assigned managed identity.",
      arguments: z.object({
        name: z.string().describe("Identity name"),
        resourceGroup: z.string().optional().describe("Resource group name"),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const rg = requireResourceGroup(args.resourceGroup, g.resourceGroup);
        const id = await az(
          [
            "identity",
            "show",
            "--name",
            args.name,
            "--resource-group",
            rg,
          ],
          g.subscriptionId,
        );
        const handle = await context.writeResource(
          "identity",
          sanitizeInstanceName(args.name),
          id,
        );
        return { dataHandles: [handle] };
      },
    },

    sync: {
      description:
        "Refresh the stored state of a managed identity without making changes.",
      arguments: z.object({
        name: z.string().describe("Identity name"),
        resourceGroup: z.string().optional().describe("Resource group name"),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const rg = requireResourceGroup(args.resourceGroup, g.resourceGroup);
        const id = await az(
          [
            "identity",
            "show",
            "--name",
            args.name,
            "--resource-group",
            rg,
          ],
          g.subscriptionId,
        );
        const handle = await context.writeResource(
          "identity",
          sanitizeInstanceName(args.name),
          id,
        );
        context.logger.info("Synced managed identity {name}", {
          name: args.name,
        });
        return { dataHandles: [handle] };
      },
    },

    create: {
      description: "Create a user-assigned managed identity.",
      arguments: z.object({
        name: z.string().describe("Identity name"),
        resourceGroup: z.string().optional().describe("Resource group name"),
        location: z.string().describe("Azure region"),
        tags: z
          .record(z.string(), z.string())
          .optional()
          .describe("Tags as key=value pairs"),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const rg = requireResourceGroup(args.resourceGroup, g.resourceGroup);
        const cmdArgs = [
          "identity",
          "create",
          "--name",
          args.name,
          "--resource-group",
          rg,
          "--location",
          args.location,
        ];

        if (args.tags) {
          const tagPairs = Object.entries(args.tags).map(
            ([k, v]) => `${k}=${v}`,
          );
          cmdArgs.push("--tags", ...tagPairs);
        }

        const id = await az(cmdArgs, g.subscriptionId);

        context.logger.info("Created managed identity {name}", {
          name: args.name,
        });

        const handle = await context.writeResource(
          "identity",
          sanitizeInstanceName(args.name),
          id,
        );
        return { dataHandles: [handle] };
      },
    },

    delete: {
      description: "Delete a user-assigned managed identity.",
      arguments: z.object({
        name: z.string().describe("Identity name"),
        resourceGroup: z.string().optional().describe("Resource group name"),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const rg = requireResourceGroup(args.resourceGroup, g.resourceGroup);
        await az(
          [
            "identity",
            "delete",
            "--name",
            args.name,
            "--resource-group",
            rg,
          ],
          g.subscriptionId,
        );
        context.logger.info("Deleted managed identity {name}", {
          name: args.name,
        });
        return { dataHandles: [] };
      },
    },
  },
};
