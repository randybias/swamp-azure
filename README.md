# @dougschaefer/azure

Azure infrastructure management for [Swamp](https://swamp.club), covering 23 model types across compute, networking, data services, security, identity, monitoring, DNS, DevOps, and subscription-wide topology visualization. Every method runs through the Azure CLI as a subprocess, so authentication delegates to whatever `az login` session is active on the machine and there is nothing proprietary sitting between you and your subscription.

The extension goes beyond standard CRUD. The topology model performs subscription-wide inventory across 16 resource types, generates Azure-branded Mermaid diagrams of resource group network architecture, estimates monthly costs against the public Azure Retail Pricing API, and exports ARM templates for IaC documentation. The DNS model handles zone and record lifecycle with enum-validated record types. The DevOps model covers projects, repos, pipelines, builds, and work items so you can wire CI/CD operations into the same workflows that manage the infrastructure those pipelines deploy to.

Most models include a `sync` method that refreshes stored state without making changes, which means you can keep your swamp data current with what actually exists in Azure and use CEL expressions to reference live resource attributes in downstream workflows.

## Models

| Model Type | Description |
|---|---|
| `azure-vm` | Virtual machines with full lifecycle, remote command execution, and size enumeration |
| `azure-disk` | Managed disks with orphan detection |
| `azure-vnet` | Virtual networks, subnets, and peering connections |
| `azure-nsg` | Network security groups and security rules |
| `azure-firewall` | Azure Firewall instances, policies, and rule collection groups |
| `azure-route-table` | Route tables and user-defined routes |
| `azure-public-ip` | Public IP addresses (Standard/Basic, Static/Dynamic) |
| `azure-nat-gateway` | NAT gateways for outbound connectivity |
| `azure-load-balancer` | Load balancers with backend pool and health probe enumeration |
| `azure-application-gateway` | Application gateways (read and delete) |
| `azure-bastion` | Bastion hosts for secure VM access |
| `azure-private-endpoint` | Private endpoints with private DNS zone enumeration |
| `azure-key-vault` | Key Vault lifecycle |
| `azure-sql` | SQL logical servers and databases |
| `azure-storage-account` | Storage accounts (Blob, File, Table, Queue) |
| `azure-managed-identity` | User-assigned managed identities |
| `azure-monitor` | Metric alerts, activity log alerts, action groups, and diagnostic settings |
| `azure-network-watcher` | Network Watcher instances, flow logs, connection monitors, and connectivity checks |
| `azure-dns` | DNS zones and records with full record type support |
| `azure-devops` | Projects, repos, pipelines, builds, and work items |
| `azure-vwan` | Virtual WANs, hubs, hub connections, VPN sites, and VPN gateways |
| `azure-resource-group` | Resource group lifecycle |
| `azure-topology` | Subscription-wide inventory, Mermaid diagrams, cost estimation, and ARM template export |

## Method Reference

### azure-vm

| Method | Description |
|---|---|
| `list` | List all VMs in a resource group or subscription |
| `get` | Get a VM by name |
| `sync` | Refresh stored state without making changes |
| `getInstanceView` | Get power state, agent status, and platform fault domain |
| `create` | Create a VM with image, size, networking, and OS configuration |
| `delete` | Delete a VM |
| `start` | Start a stopped or deallocated VM |
| `stop` | Stop (power off) a VM without deallocating |
| `deallocate` | Deallocate a VM to stop billing for compute |
| `restart` | Restart a running VM |
| `resize` | Change VM size (SKU) |
| `listSizes` | List available VM sizes for a region |
| `runCommand` | Execute a command on the VM via the Azure agent |

### azure-disk

| Method | Description |
|---|---|
| `list` | List managed disks in a resource group or subscription |
| `get` | Get a managed disk by name |
| `sync` | Refresh stored state without making changes |
| `listOrphaned` | List disks not attached to any VM |
| `create` | Create a managed disk |
| `delete` | Delete a managed disk |

### azure-vnet

| Method | Description |
|---|---|
| `list` | List VNets in a resource group or subscription |
| `get` | Get a VNet by name |
| `sync` | Refresh stored state without making changes |
| `create` | Create a VNet with address space and optional subnets |
| `delete` | Delete a VNet |
| `listSubnets` | List subnets in a VNet |
| `getSubnet` | Get a subnet by name |
| `createSubnet` | Create a subnet with address prefix |
| `updateSubnet` | Update a subnet's properties |
| `deleteSubnet` | Delete a subnet |
| `listPeerings` | List VNet peering connections |
| `createPeering` | Create a peering connection to another VNet |
| `deletePeering` | Delete a peering connection |

### azure-nsg

| Method | Description |
|---|---|
| `list` | List NSGs in a resource group or subscription |
| `get` | Get an NSG by name |
| `sync` | Refresh stored state without making changes |
| `create` | Create an NSG |
| `delete` | Delete an NSG |
| `listRules` | List security rules in an NSG |
| `getRule` | Get a security rule by name |
| `createRule` | Create a security rule with priority, direction, protocol, and port ranges |
| `updateRule` | Update an existing security rule |
| `deleteRule` | Delete a security rule |

### azure-firewall

| Method | Description |
|---|---|
| `list` | List firewalls in a resource group or subscription |
| `get` | Get a firewall by name |
| `sync` | Refresh stored state without making changes |
| `create` | Create an Azure Firewall |
| `delete` | Delete an Azure Firewall |
| `listPolicies` | List firewall policies |
| `getPolicy` | Get a firewall policy by name |
| `syncPolicy` | Refresh stored state of a firewall policy |
| `listRuleCollectionGroups` | List rule collection groups in a policy |
| `getRuleCollectionGroup` | Get a single rule collection group |
| `createPolicy` | Create a firewall policy |

### azure-route-table

| Method | Description |
|---|---|
| `list` | List route tables in a resource group or subscription |
| `get` | Get a route table by name |
| `sync` | Refresh stored state without making changes |
| `create` | Create a route table |
| `delete` | Delete a route table |
| `listRoutes` | List routes in a route table |
| `createRoute` | Create a user-defined route |
| `updateRoute` | Update an existing route |
| `deleteRoute` | Delete a route |

### azure-public-ip

| Method | Description |
|---|---|
| `list` | List public IPs in a resource group or subscription |
| `get` | Get a public IP by name |
| `sync` | Refresh stored state without making changes |
| `create` | Create a public IP address |
| `delete` | Delete a public IP address |

### azure-nat-gateway

| Method | Description |
|---|---|
| `list` | List NAT gateways in a resource group or subscription |
| `get` | Get a NAT gateway by name |
| `sync` | Refresh stored state without making changes |
| `create` | Create a NAT gateway |
| `delete` | Delete a NAT gateway |

### azure-load-balancer

| Method | Description |
|---|---|
| `list` | List load balancers in a resource group or subscription |
| `get` | Get a load balancer by name |
| `sync` | Refresh stored state without making changes |
| `create` | Create a load balancer |
| `delete` | Delete a load balancer |
| `listBackendPools` | List backend address pools |
| `listProbes` | List health probes |

### azure-application-gateway

| Method | Description |
|---|---|
| `list` | List application gateways in a resource group or subscription |
| `get` | Get an application gateway by name |
| `sync` | Refresh stored state without making changes |
| `delete` | Delete an application gateway |

### azure-bastion

| Method | Description |
|---|---|
| `list` | List Bastion hosts in the subscription |
| `get` | Get a Bastion host by name |
| `sync` | Refresh stored state without making changes |
| `create` | Create a Bastion host (requires AzureBastionSubnet) |
| `delete` | Delete a Bastion host |

### azure-private-endpoint

| Method | Description |
|---|---|
| `list` | List private endpoints in a resource group or subscription |
| `get` | Get a private endpoint by name |
| `sync` | Refresh stored state without making changes |
| `create` | Create a private endpoint to a service |
| `delete` | Delete a private endpoint |
| `listPrivateDnsZones` | List private DNS zones linked to the endpoint |

### azure-key-vault

| Method | Description |
|---|---|
| `list` | List Key Vaults in a resource group or subscription |
| `get` | Get a Key Vault by name |
| `sync` | Refresh stored state without making changes |
| `create` | Create a Key Vault |
| `delete` | Delete a Key Vault (soft delete aware) |

### azure-sql

| Method | Description |
|---|---|
| `listServers` | List SQL logical servers in a resource group or subscription |
| `getServer` | Get a SQL server by name |
| `syncServer` | Refresh stored state of a SQL server |
| `createServer` | Create a SQL logical server with admin credentials |
| `deleteServer` | Delete a SQL server and all its databases |
| `listDatabases` | List databases on a SQL server |
| `getDatabase` | Get a database by name |
| `syncDatabase` | Refresh stored state of a database |
| `createDatabase` | Create a database with SKU and max size |
| `deleteDatabase` | Delete a database |

### azure-storage-account

| Method | Description |
|---|---|
| `list` | List storage accounts in a resource group or subscription |
| `get` | Get a storage account by name |
| `sync` | Refresh stored state without making changes |
| `create` | Create a storage account with SKU and kind |
| `delete` | Delete a storage account |

### azure-managed-identity

| Method | Description |
|---|---|
| `list` | List user-assigned managed identities in a resource group or subscription |
| `get` | Get a managed identity by name |
| `sync` | Refresh stored state without making changes |
| `create` | Create a user-assigned managed identity |
| `delete` | Delete a managed identity |

### azure-monitor

| Method | Description |
|---|---|
| `listMetricAlerts` | List metric alerts in a resource group or subscription |
| `listActivityLogAlerts` | List activity log alerts in a resource group or subscription |
| `listActionGroups` | List action groups in a resource group or subscription |
| `getDiagnosticSettings` | Get diagnostic settings for a specific resource |

### azure-network-watcher

| Method | Description |
|---|---|
| `list` | List Network Watcher instances in the subscription |
| `listFlowLogs` | List NSG flow logs for a Network Watcher |
| `listConnectionMonitors` | List connection monitors for a Network Watcher |
| `checkConnectivity` | Test connectivity from a source VM to a destination endpoint |

### azure-dns

| Method | Description |
|---|---|
| `listZones` | List DNS zones in a resource group or subscription |
| `getZone` | Get a DNS zone by name |
| `createZone` | Create a DNS zone |
| `deleteZone` | Delete a DNS zone |
| `syncZone` | Refresh stored state of a DNS zone |
| `listRecords` | List all records in a DNS zone |
| `getRecord` | Get a single DNS record (enum-validated record type) |
| `createRecord` | Add a record to a record set (A, AAAA, CNAME, MX, TXT, NS, SRV, PTR) |
| `deleteRecord` | Remove a record from a record set |
| `deleteRecordSet` | Delete an entire record set |
| `exportZone` | Export a DNS zone to a file |

### azure-devops

| Method | Description |
|---|---|
| `listProjects` | List all projects in the organization |
| `getProject` | Get a project by name |
| `listRepos` | List repositories in a project |
| `getRepo` | Get a repository by name |
| `createRepo` | Create a repository |
| `deleteRepo` | Delete a repository |
| `listPipelines` | List pipelines in a project |
| `getPipeline` | Get a pipeline by name |
| `runPipeline` | Trigger a pipeline run |
| `listBuilds` | List builds in a project |
| `getBuild` | Get a build by ID |
| `listWorkItems` | List work items in a project |
| `getWorkItem` | Get a work item by ID |
| `createWorkItem` | Create a work item |
| `updateWorkItem` | Update a work item |

### azure-vwan

The vWAN model manages the full hub-and-spoke topology as a set of interdependent resources, from the WAN itself through virtual hubs, hub-to-VNet connections, VPN sites, and VPN gateways.

| Method | Description |
|---|---|
| `list` | List virtual WANs in a resource group |
| `get` | Get a virtual WAN by name |
| `create` | Create a virtual WAN |
| `delete` | Delete a virtual WAN |
| `listHubs` | List virtual hubs in a vWAN |
| `getHub` | Get a virtual hub by name |
| `createHub` | Create a virtual hub with address prefix and region |
| `deleteHub` | Delete a virtual hub |
| `listHubConnections` | List VNet connections on a hub |
| `createHubConnection` | Connect a VNet to a virtual hub |
| `deleteHubConnection` | Remove a VNet connection from a hub |
| `listVpnSites` | List VPN sites in a resource group |
| `getVpnSite` | Get a VPN site by name |
| `createVpnSite` | Create a VPN site with device properties and link configuration |
| `deleteVpnSite` | Delete a VPN site |
| `listVpnGateways` | List VPN gateways in a resource group |
| `getVpnGateway` | Get a VPN gateway by name |
| `inventory` | Full inventory of all vWAN resources (WANs, hubs, connections, sites, gateways) |

### azure-resource-group

| Method | Description |
|---|---|
| `list` | List resource groups in a subscription |
| `get` | Get a resource group by name |
| `create` | Create a resource group in a location |
| `delete` | Delete a resource group and all its contents |

### azure-topology

The topology model operates at the subscription level rather than on individual resources. The `inventory` method discovers all resources across 16 Azure resource types and produces per-resource data handles that downstream workflows can reference. The `generate` method builds Mermaid diagrams with Azure-branded colors and resource relationship mapping. The `costEstimate` method calls the Azure Retail Pricing API directly (no authentication required) to estimate monthly spend for VMs and firewalls. The `exportTemplate` method pulls the full ARM template for a resource group.

| Method | Description |
|---|---|
| `inventory` | Discover all resources across the subscription (or a single resource group) |
| `generate` | Produce a Mermaid diagram of network topology with Azure-branded colors |
| `costEstimate` | Estimate monthly VM and firewall costs via the Azure Retail Pricing API |
| `exportTemplate` | Export the full ARM template for a resource group |

## Installation

```bash
swamp extension pull @dougschaefer/azure
```

## Setup

All models authenticate through the Azure CLI, so you need `az` installed and an active login session before running any methods.

1. Install the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) and authenticate:

```bash
az login
```

2. Create a swamp vault and store your subscription ID:

```bash
swamp vault create azure --type local_encryption
swamp vault set azure SUBSCRIPTION_ID <your-subscription-id>
```

3. Create a model instance, wiring the subscription ID from vault:

```bash
swamp model create @dougschaefer/azure-vm my-vms --json
```

When prompted for the `subscriptionId` global argument, use the vault expression `${{ vault.get('azure', 'SUBSCRIPTION_ID') }}`. You can also set a default resource group at this point, which saves you from passing it on every method call.

4. Run methods against the instance:

```bash
swamp model method run my-vms list --json
```

For the DevOps model, you will need a separate vault entry for your organization URL:

```bash
swamp vault set azure-devops ORG_URL https://dev.azure.com/your-org
```

## API Compatibility

All operations shell out to Azure CLI 2.x via `Deno.Command` subprocess with an args array (no shell interpolation). The topology model's `costEstimate` method calls the [Azure Retail Pricing API](https://learn.microsoft.com/rest/api/cost-management/retail-prices/azure-retail-prices) directly via fetch, which is public and requires no authentication.

Tested against Azure CLI 2.67+ and the current Azure Resource Manager API versions as of March 2026. Resource group operations and ARM template export use whichever API versions the installed CLI targets.

## License

MIT
