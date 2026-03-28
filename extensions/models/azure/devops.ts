import { z } from "npm:zod@4";
import { az, sanitizeInstanceName } from "./_helpers.ts";

const DevOpsGlobalArgsSchema = z.object({
  organization: z.string().describe(
    "Azure DevOps organization URL. Use: ${{ vault.get('azure-devops', 'ORG_URL') }}",
  ),
  project: z
    .string()
    .optional()
    .describe("Default project name for operations that require one"),
});

function devopsArgs(
  baseArgs: string[],
  g: { organization: string; project?: string },
  projectOverride?: string,
): string[] {
  const args = [...baseArgs, "--org", g.organization];
  const proj = projectOverride || g.project;
  if (proj) args.push("--project", proj);
  return args;
}

const ProjectSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    state: z.string(),
    visibility: z.string(),
    description: z.string().optional(),
  })
  .passthrough();

const RepoSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    project: z.record(z.string(), z.unknown()).optional(),
    defaultBranch: z.string().optional(),
    remoteUrl: z.string().optional(),
    size: z.number().optional(),
  })
  .passthrough();

const PipelineSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    folder: z.string().optional(),
    revision: z.number().optional(),
  })
  .passthrough();

const BuildSchema = z
  .object({
    id: z.number(),
    buildNumber: z.string().optional(),
    status: z.string().optional(),
    result: z.string().optional(),
    sourceBranch: z.string().optional(),
    startTime: z.string().optional(),
    finishTime: z.string().optional(),
    requestedBy: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const WorkItemSchema = z
  .object({
    id: z.number(),
    fields: z
      .object({
        "System.WorkItemType": z.string().optional(),
        "System.Title": z.string().optional(),
        "System.State": z.string().optional(),
        "System.AssignedTo": z.unknown().optional(),
        "System.AreaPath": z.string().optional(),
        "System.IterationPath": z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const model = {
  type: "@dougschaefer/azure-devops",
  version: "2026.03.28.1",
  globalArguments: DevOpsGlobalArgsSchema,
  resources: {
    project: {
      description: "Azure DevOps project",
      schema: ProjectSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
    repo: {
      description: "Azure DevOps Git repository",
      schema: RepoSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
    pipeline: {
      description: "Azure DevOps pipeline",
      schema: PipelineSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
    build: {
      description: "Azure DevOps pipeline build/run",
      schema: BuildSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
    workItem: {
      description: "Azure DevOps work item",
      schema: WorkItemSchema,
      lifetime: "infinite",
      garbageCollection: 10,
    },
  },
  methods: {
    listProjects: {
      description: "List all projects in the organization.",
      arguments: z.object({}),
      execute: async (_args, context) => {
        const g = context.globalArgs;
        const result = (await az(
          devopsArgs(["devops", "project", "list"], g),
          undefined,
        )) as Record<string, unknown>;

        const projects = (result?.value ?? result) as Array<
          Record<string, unknown>
        >;

        context.logger.info("Found {count} projects", {
          count: projects.length,
        });

        const handles = [];
        for (const proj of projects) {
          const handle = await context.writeResource(
            "project",
            sanitizeInstanceName(proj.name as string),
            proj,
          );
          handles.push(handle);
        }
        return { dataHandles: handles };
      },
    },

    getProject: {
      description: "Get a single project by name.",
      arguments: z.object({
        project: z.string().describe("Project name"),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const proj = await az(
          devopsArgs(
            ["devops", "project", "show", "--project", args.project],
            g,
          ),
          undefined,
        );
        const handle = await context.writeResource(
          "project",
          sanitizeInstanceName(args.project),
          proj,
        );
        return { dataHandles: [handle] };
      },
    },

    listRepos: {
      description: "List Git repositories in a project.",
      arguments: z.object({
        project: z.string().optional().describe(
          "Project name (overrides global)",
        ),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const repos = (await az(
          devopsArgs(["repos", "list"], g, args.project),
          undefined,
        )) as Array<Record<string, unknown>>;

        context.logger.info("Found {count} repos", { count: repos.length });

        const handles = [];
        for (const repo of repos) {
          const handle = await context.writeResource(
            "repo",
            sanitizeInstanceName(repo.name as string),
            repo,
          );
          handles.push(handle);
        }
        return { dataHandles: handles };
      },
    },

    getRepo: {
      description: "Get a single repository by name or ID.",
      arguments: z.object({
        repository: z.string().describe("Repository name or ID"),
        project: z.string().optional().describe(
          "Project name (overrides global)",
        ),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const repo = await az(
          devopsArgs(
            ["repos", "show", "--repository", args.repository],
            g,
            args.project,
          ),
          undefined,
        );
        const handle = await context.writeResource(
          "repo",
          sanitizeInstanceName(args.repository),
          repo,
        );
        return { dataHandles: [handle] };
      },
    },

    createRepo: {
      description: "Create a new Git repository.",
      arguments: z.object({
        name: z.string().describe("Repository name"),
        project: z.string().optional().describe(
          "Project name (overrides global)",
        ),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const repo = await az(
          devopsArgs(["repos", "create", "--name", args.name], g, args.project),
          undefined,
        );

        context.logger.info("Created repository {name}", { name: args.name });

        const handle = await context.writeResource(
          "repo",
          sanitizeInstanceName(args.name),
          repo,
        );
        return { dataHandles: [handle] };
      },
    },

    deleteRepo: {
      description: "Delete a Git repository by ID.",
      arguments: z.object({
        id: z.string().describe("Repository ID"),
        project: z.string().optional().describe(
          "Project name (overrides global)",
        ),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        await az(
          devopsArgs(
            ["repos", "delete", "--id", args.id, "--yes"],
            g,
            args.project,
          ),
          undefined,
        );

        context.logger.info("Deleted repository {id}", { id: args.id });

        return { dataHandles: [] };
      },
    },

    listPipelines: {
      description: "List pipelines in a project.",
      arguments: z.object({
        project: z.string().optional().describe(
          "Project name (overrides global)",
        ),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const pipelines = (await az(
          devopsArgs(["pipelines", "list"], g, args.project),
          undefined,
        )) as Array<Record<string, unknown>>;

        context.logger.info("Found {count} pipelines", {
          count: pipelines.length,
        });

        const handles = [];
        for (const p of pipelines) {
          const handle = await context.writeResource(
            "pipeline",
            sanitizeInstanceName(p.name as string),
            p,
          );
          handles.push(handle);
        }
        return { dataHandles: handles };
      },
    },

    getPipeline: {
      description: "Get a single pipeline by ID.",
      arguments: z.object({
        id: z.number().describe("Pipeline ID"),
        project: z.string().optional().describe(
          "Project name (overrides global)",
        ),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const pipeline = await az(
          devopsArgs(
            ["pipelines", "show", "--id", String(args.id)],
            g,
            args.project,
          ),
          undefined,
        );
        const handle = await context.writeResource(
          "pipeline",
          sanitizeInstanceName(String(args.id)),
          pipeline,
        );
        return { dataHandles: [handle] };
      },
    },

    runPipeline: {
      description: "Trigger a pipeline run.",
      arguments: z.object({
        id: z.number().describe("Pipeline ID"),
        branch: z.string().optional().describe("Source branch to build"),
        project: z.string().optional().describe(
          "Project name (overrides global)",
        ),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const cmdArgs = ["pipelines", "run", "--id", String(args.id)];
        if (args.branch) cmdArgs.push("--branch", args.branch);

        const build = await az(
          devopsArgs(cmdArgs, g, args.project),
          undefined,
        );

        context.logger.info("Triggered pipeline {id}", { id: args.id });

        const handle = await context.writeResource(
          "build",
          sanitizeInstanceName(
            String((build as Record<string, unknown>).id ?? args.id),
          ),
          build,
        );
        return { dataHandles: [handle] };
      },
    },

    listBuilds: {
      description: "List recent pipeline builds.",
      arguments: z.object({
        top: z.number().optional().describe(
          "Number of builds to return (default 20)",
        ),
        project: z.string().optional().describe(
          "Project name (overrides global)",
        ),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const top = args.top ?? 20;
        const builds = (await az(
          devopsArgs(
            ["pipelines", "build", "list", "--top", String(top)],
            g,
            args.project,
          ),
          undefined,
        )) as Array<Record<string, unknown>>;

        context.logger.info("Found {count} builds", { count: builds.length });

        const handles = [];
        for (const b of builds) {
          const handle = await context.writeResource(
            "build",
            sanitizeInstanceName(String(b.id)),
            b,
          );
          handles.push(handle);
        }
        return { dataHandles: handles };
      },
    },

    getBuild: {
      description: "Get a single build by ID.",
      arguments: z.object({
        id: z.number().describe("Build ID"),
        project: z.string().optional().describe(
          "Project name (overrides global)",
        ),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const build = await az(
          devopsArgs(
            ["pipelines", "build", "show", "--id", String(args.id)],
            g,
            args.project,
          ),
          undefined,
        );
        const handle = await context.writeResource(
          "build",
          sanitizeInstanceName(String(args.id)),
          build,
        );
        return { dataHandles: [handle] };
      },
    },

    listWorkItems: {
      description:
        "Query work items using WIQL. Defaults to recent items in the project.",
      arguments: z.object({
        wiql: z.string().optional().describe("WIQL query string"),
        project: z.string().optional().describe(
          "Project name (overrides global)",
        ),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const proj = args.project || g.project;
        const wiql = args.wiql ||
          `SELECT [System.Id],[System.Title],[System.State],[System.WorkItemType] FROM WorkItems WHERE [System.TeamProject] = '${proj}' ORDER BY [System.ChangedDate] DESC`;

        const result = (await az(
          devopsArgs(["boards", "query", "--wiql", wiql], g, args.project),
          undefined,
        )) as Array<Record<string, unknown>>;

        context.logger.info("Query returned {count} work items", {
          count: result.length,
        });

        const handles = [];
        for (const wi of result) {
          const handle = await context.writeResource(
            "workItem",
            sanitizeInstanceName(String(wi.id)),
            wi,
          );
          handles.push(handle);
        }
        return { dataHandles: handles };
      },
    },

    getWorkItem: {
      description: "Get a single work item by ID.",
      arguments: z.object({
        id: z.number().describe("Work item ID"),
        project: z.string().optional().describe(
          "Project name (overrides global)",
        ),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const wi = await az(
          devopsArgs(
            ["boards", "work-item", "show", "--id", String(args.id)],
            g,
            args.project,
          ),
          undefined,
        );
        const handle = await context.writeResource(
          "workItem",
          sanitizeInstanceName(String(args.id)),
          wi,
        );
        return { dataHandles: [handle] };
      },
    },

    createWorkItem: {
      description: "Create a new work item.",
      arguments: z.object({
        title: z.string().describe("Work item title"),
        type: z.string().describe(
          "Work item type (e.g. Bug, Task, User Story)",
        ),
        assignedTo: z.string().optional().describe("Assigned user"),
        areaPath: z.string().optional().describe("Area path"),
        description: z.string().optional().describe("Work item description"),
        project: z.string().optional().describe(
          "Project name (overrides global)",
        ),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const cmdArgs = [
          "boards",
          "work-item",
          "create",
          "--title",
          args.title,
          "--type",
          args.type,
        ];

        if (args.assignedTo) {
          cmdArgs.push("--assigned-to", args.assignedTo);
        }
        if (args.areaPath) {
          cmdArgs.push("--area", args.areaPath);
        }
        if (args.description) {
          cmdArgs.push("--description", args.description);
        }

        const wi = await az(
          devopsArgs(cmdArgs, g, args.project),
          undefined,
        );

        context.logger.info("Created {type} work item: {title}", {
          type: args.type,
          title: args.title,
        });

        const handle = await context.writeResource(
          "workItem",
          sanitizeInstanceName(String((wi as Record<string, unknown>).id)),
          wi,
        );
        return { dataHandles: [handle] };
      },
    },

    updateWorkItem: {
      description: "Update a work item by ID with field/value pairs.",
      arguments: z.object({
        id: z.number().describe("Work item ID"),
        fields: z
          .record(z.string(), z.string())
          .describe("Field/value pairs to update (e.g. System.State=Closed)"),
        project: z.string().optional().describe(
          "Project name (overrides global)",
        ),
      }),
      execute: async (args, context) => {
        const g = context.globalArgs;
        const cmdArgs = [
          "boards",
          "work-item",
          "update",
          "--id",
          String(args.id),
        ];

        for (const [key, value] of Object.entries(args.fields)) {
          cmdArgs.push("--fields", `${key}=${value}`);
        }

        const wi = await az(
          devopsArgs(cmdArgs, g, args.project),
          undefined,
        );

        context.logger.info("Updated work item {id}", { id: args.id });

        const handle = await context.writeResource(
          "workItem",
          sanitizeInstanceName(String(args.id)),
          wi,
        );
        return { dataHandles: [handle] };
      },
    },
  },
};
