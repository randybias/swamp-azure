import { z } from "npm:zod@4.3.6";
import { az, EntraGlobalArgsSchema, sanitizeInstanceName } from "./_helpers.ts";

const UserSchema = z
  .object({
    id: z.string(),
    displayName: z.string().optional(),
    userPrincipalName: z.string().optional(),
    givenName: z.string().nullish(),
    surname: z.string().nullish(),
    jobTitle: z.string().nullish(),
    mail: z.string().nullish(),
    mobilePhone: z.string().nullish(),
    officeLocation: z.string().nullish(),
    businessPhones: z.array(z.string()).optional(),
    preferredLanguage: z.string().nullish(),
    accountEnabled: z.boolean().optional(),
  })
  .passthrough();

const MembershipSchema = z
  .object({
    id: z.string(),
    displayName: z.string().nullish(),
  })
  .passthrough();

/**
 * `@dougschaefer/azure-ad-user` model — Entra ID (Azure AD) user
 * directory reads, wrapping the `az ad user` CLI. This model is
 * tenant-scoped, not subscription-scoped: authentication uses the
 * active `az login` session and no `--subscription` flag is emitted.
 * list enumerates users (optionally narrowed by an OData `$filter`),
 * get and sync return or refresh one user by UPN or object id, and
 * getMemberGroups resolves the groups a user belongs to for access
 * audits. User provisioning (create/update/delete) is intentionally
 * out of scope — directory account lifecycle involves password and
 * licensing material better handled interactively, not through an
 * infrastructure automation surface.
 */
export const model = {
  type: "@dougschaefer/azure-ad-user",
  version: "2026.05.26.2",
  globalArguments: EntraGlobalArgsSchema,
  resources: {
    user: {
      description: "Entra ID user",
      schema: UserSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
    membership: {
      description: "Group a user is a member of",
      schema: MembershipSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
  },
  methods: {
    list: {
      description:
        "List users in the directory. Optionally narrow with an OData $filter.",
      arguments: z.object({
        filter: z
          .string()
          .optional()
          .describe(
            'OData filter, e.g. "startswith(displayName,\'A\')" or "accountEnabled eq true"',
          ),
      }),
      execute: async (args, context) => {
        const cmdArgs = ["ad", "user", "list"];
        if (args.filter) cmdArgs.push("--filter", args.filter);

        const users = (await az(cmdArgs, undefined)) as Array<
          Record<string, unknown>
        >;

        context.logger.info("Found {count} users", { count: users.length });

        const handles = [];
        for (const u of users) {
          const handle = await context.writeResource(
            "user",
            sanitizeInstanceName(u.id as string),
            u,
          );
          handles.push(handle);
        }
        return { dataHandles: handles };
      },
    },

    get: {
      description: "Get a single user by UPN or object id.",
      arguments: z.object({
        id: z.string().describe("User principal name or object id"),
      }),
      execute: async (args, context) => {
        const user = (await az(
          ["ad", "user", "show", "--id", args.id],
          undefined,
        )) as Record<string, unknown>;
        const handle = await context.writeResource(
          "user",
          sanitizeInstanceName(user.id as string),
          user,
        );
        return { dataHandles: [handle] };
      },
    },

    sync: {
      description: "Refresh the stored state of a user without making changes.",
      arguments: z.object({
        id: z.string().describe("User principal name or object id"),
      }),
      execute: async (args, context) => {
        const user = (await az(
          ["ad", "user", "show", "--id", args.id],
          undefined,
        )) as Record<string, unknown>;
        const handle = await context.writeResource(
          "user",
          sanitizeInstanceName(user.id as string),
          user,
        );
        context.logger.info("Synced user {id}", { id: args.id });
        return { dataHandles: [handle] };
      },
    },

    getMemberGroups: {
      description: "List the groups a user is a member of (for access review).",
      arguments: z.object({
        id: z.string().describe("User principal name or object id"),
        securityEnabledOnly: z
          .boolean()
          .optional()
          .describe("Return only security-enabled groups (default false)"),
      }),
      execute: async (args, context) => {
        const cmdArgs = ["ad", "user", "get-member-groups", "--id", args.id];
        if (args.securityEnabledOnly) cmdArgs.push("--security-enabled-only");

        const groups = (await az(cmdArgs, undefined)) as Array<
          Record<string, unknown>
        >;

        context.logger.info("User {id} is a member of {count} groups", {
          id: args.id,
          count: groups.length,
        });

        const handles = [];
        for (const grp of groups) {
          const handle = await context.writeResource(
            "membership",
            sanitizeInstanceName(grp.id as string),
            grp,
          );
          handles.push(handle);
        }
        return { dataHandles: handles };
      },
    },
  },
};
