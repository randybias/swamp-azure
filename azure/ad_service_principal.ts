import { z } from "npm:zod@4.3.6";
import { az, EntraGlobalArgsSchema, sanitizeInstanceName } from "./_helpers.ts";

const ServicePrincipalSchema = z
  .object({
    id: z.string(),
    appId: z.string().optional(),
    displayName: z.string().optional(),
    servicePrincipalType: z.string().nullish(),
    accountEnabled: z.boolean().optional(),
    appOwnerOrganizationId: z.string().nullish(),
    appRoleAssignmentRequired: z.boolean().optional(),
    servicePrincipalNames: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  })
  .passthrough();

const CredentialSchema = z
  .object({
    keyId: z.string().optional(),
    displayName: z.string().nullish(),
    startDateTime: z.string().nullish(),
    endDateTime: z.string().nullish(),
    hint: z.string().nullish(),
    type: z.string().nullish(),
    usage: z.string().nullish(),
  })
  .passthrough();

const OwnerSchema = z
  .object({
    id: z.string(),
    displayName: z.string().nullish(),
    userPrincipalName: z.string().nullish(),
  })
  .passthrough();

/**
 * `@dougschaefer/azure-ad-service-principal` model — Entra ID service
 * principal reads and credential auditing, wrapping the `az ad sp`
 * CLI. This model is tenant-scoped, not subscription-scoped:
 * authentication uses the active `az login` session and no
 * `--subscription` flag is emitted. list enumerates service
 * principals (require one of all/displayName/filter/spn to bound the
 * query — a tenant-wide `--all` can be slow), get and sync read one
 * SP by appId or object id, listCredentials surfaces password and
 * certificate credential metadata (including `endDateTime` for
 * expiry auditing — secret values are never returned by Graph), and
 * listOwners resolves who controls the SP. Creation is intentionally
 * out of scope because `create-for-rbac` emits secret material that
 * should not flow through stored model data.
 */
export const model = {
  type: "@dougschaefer/azure-ad-service-principal",
  version: "2026.05.26.2",
  globalArguments: EntraGlobalArgsSchema,
  resources: {
    servicePrincipal: {
      description: "Entra ID service principal",
      schema: ServicePrincipalSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
    credential: {
      description: "Service principal password or certificate credential",
      schema: CredentialSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
    owner: {
      description: "Owner of a service principal",
      schema: OwnerSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
  },
  methods: {
    list: {
      description:
        "List service principals. Provide one of all/displayName/filter/spn to bound the query.",
      arguments: z.object({
        all: z
          .boolean()
          .optional()
          .describe("List every SP in the tenant (slow on large orgs)"),
        displayName: z
          .string()
          .optional()
          .describe("Display name or prefix"),
        filter: z.string().optional().describe("OData filter"),
        spn: z.string().optional().describe("Service principal name"),
      }),
      execute: async (args, context) => {
        const cmdArgs = ["ad", "sp", "list"];
        if (args.all) {
          cmdArgs.push("--all");
        } else if (args.displayName) {
          cmdArgs.push("--display-name", args.displayName);
        } else if (args.filter) {
          cmdArgs.push("--filter", args.filter);
        } else if (args.spn) {
          cmdArgs.push("--spn", args.spn);
        } else {
          throw new Error(
            "Provide one of all, displayName, filter, or spn to bound the SP query",
          );
        }

        const sps = (await az(cmdArgs, undefined)) as Array<
          Record<string, unknown>
        >;

        context.logger.info("Found {count} service principals", {
          count: sps.length,
        });

        const handles = [];
        for (const sp of sps) {
          const handle = await context.writeResource(
            "servicePrincipal",
            sanitizeInstanceName(sp.id as string),
            sp,
          );
          handles.push(handle);
        }
        return { dataHandles: handles };
      },
    },

    get: {
      description: "Get a single service principal by appId or object id.",
      arguments: z.object({
        id: z.string().describe("Application (client) id or object id"),
      }),
      execute: async (args, context) => {
        const sp = (await az(
          ["ad", "sp", "show", "--id", args.id],
          undefined,
        )) as Record<string, unknown>;
        const handle = await context.writeResource(
          "servicePrincipal",
          sanitizeInstanceName(sp.id as string),
          sp,
        );
        return { dataHandles: [handle] };
      },
    },

    sync: {
      description:
        "Refresh the stored state of a service principal without making changes.",
      arguments: z.object({
        id: z.string().describe("Application (client) id or object id"),
      }),
      execute: async (args, context) => {
        const sp = (await az(
          ["ad", "sp", "show", "--id", args.id],
          undefined,
        )) as Record<string, unknown>;
        const handle = await context.writeResource(
          "servicePrincipal",
          sanitizeInstanceName(sp.id as string),
          sp,
        );
        context.logger.info("Synced service principal {id}", { id: args.id });
        return { dataHandles: [handle] };
      },
    },

    listCredentials: {
      description:
        "List a service principal's credential metadata for expiry auditing. Secret values are never returned.",
      arguments: z.object({
        id: z.string().describe("Application (client) id or object id"),
        cert: z
          .boolean()
          .optional()
          .describe("List certificate credentials instead of passwords"),
      }),
      execute: async (args, context) => {
        const cmdArgs = ["ad", "sp", "credential", "list", "--id", args.id];
        if (args.cert) cmdArgs.push("--cert");

        const creds = (await az(cmdArgs, undefined)) as Array<
          Record<string, unknown>
        >;

        context.logger.info("SP {id} has {count} credentials", {
          id: args.id,
          count: creds.length,
        });

        const handles = [];
        for (const cred of creds) {
          const handle = await context.writeResource(
            "credential",
            sanitizeInstanceName(
              (cred.keyId as string) ?? crypto.randomUUID(),
            ),
            cred,
          );
          handles.push(handle);
        }
        return { dataHandles: handles };
      },
    },

    listOwners: {
      description: "List the owners of a service principal.",
      arguments: z.object({
        id: z.string().describe("Application (client) id or object id"),
      }),
      execute: async (args, context) => {
        const owners = (await az(
          ["ad", "sp", "owner", "list", "--id", args.id],
          undefined,
        )) as Array<Record<string, unknown>>;

        context.logger.info("SP {id} has {count} owners", {
          id: args.id,
          count: owners.length,
        });

        const handles = [];
        for (const o of owners) {
          const handle = await context.writeResource(
            "owner",
            sanitizeInstanceName(o.id as string),
            o,
          );
          handles.push(handle);
        }
        return { dataHandles: handles };
      },
    },
  },
};
