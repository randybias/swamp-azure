# @dougschaefer/azure

Azure infrastructure management for [Swamp](https://swamp.club), covering 13 model types across VMs, networking, data services, security, and management operations. Every method runs through the Azure CLI as a subprocess, so authentication delegates to whatever `az login` session is active on the machine and there is nothing proprietary sitting between you and your subscription. Beyond standard CRUD, the extension includes a topology model that generates Azure-branded Mermaid diagrams of resource group network architecture, estimates monthly costs against the public Azure Retail Pricing API, and exports ARM templates for IaC documentation.

## Models

| Model Type | Description |
|------------|-------------|
| `azure-vm` | Virtual machines with full lifecycle and remote command execution |
| `azure-vnet` | Virtual networks, subnets, and peering connections |
| `azure-nsg` | Network security groups and individual security rules |
| `azure-route-table` | Route tables and user-defined routes |
| `azure-public-ip` | Public IP addresses (Standard/Basic, Static/Dynamic) |
| `azure-nat-gateway` | NAT gateways for outbound connectivity |
| `azure-firewall` | Azure Firewall instances and firewall policies |
| `azure-vwan` | Virtual WANs, hubs, hub connections, VPN sites, and VPN gateways |
| `azure-sql` | SQL logical servers and databases |
| `azure-storage-account` | Storage accounts (Blob, File, Table, Queue) |
| `azure-key-vault` | Key Vault for secrets, keys, and certificates |
| `azure-resource-group` | Resource group lifecycle |
| `azure-topology` | Mermaid diagrams, cost estimation, and ARM template export |

### azure-vm

| Method | Description |
|--------|-------------|
| `list` | List all VMs in a resource group |
| `get` | Get a VM by name |
| `getInstanceView` | Get power state, agent status, and platform fault domain |
| `create` | Create a VM with image, size, networking, and OS configuration |
| `delete` | Delete a VM |
| `start` | Start a deallocated or stopped VM |
| `stop` | Stop (power off) a VM without deallocating |
| `deallocate` | Deallocate a VM to stop billing for compute |
| `restart` | Restart a running VM |
| `resize` | Change VM size (SKU) |
| `listSizes` | List available VM sizes for a location |
| `runCommand` | Execute a shell command on the VM via the Azure agent |

### azure-vnet

| Method | Description |
|--------|-------------|
| `list` | List VNets in a resource group |
| `get` | Get a VNet by name |
| `create` | Create a VNet with address space |
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
|--------|-------------|
| `list` | List NSGs in a resource group |
| `get` | Get an NSG by name |
| `create` | Create an NSG |
| `delete` | Delete an NSG |
| `listRules` | List security rules in an NSG |
| `getRule` | Get a security rule by name |
| `createRule` | Create a security rule with priority, direction, protocol, and port ranges |
| `updateRule` | Update an existing security rule |
| `deleteRule` | Delete a security rule |

### azure-route-table

| Method | Description |
|--------|-------------|
| `list` | List route tables in a resource group |
| `get` | Get a route table by name |
| `create` | Create a route table |
| `delete` | Delete a route table |
| `listRoutes` | List routes in a route table |
| `createRoute` | Create a user-defined route |
| `updateRoute` | Update an existing route |
| `deleteRoute` | Delete a route |

### azure-public-ip

| Method | Description |
|--------|-------------|
| `list` | List public IPs in a resource group |
| `get` | Get a public IP by name |
| `create` | Create a public IP address |
| `delete` | Delete a public IP address |

### azure-nat-gateway

| Method | Description |
|--------|-------------|
| `list` | List NAT gateways in a resource group |
| `get` | Get a NAT gateway by name |
| `create` | Create a NAT gateway |
| `delete` | Delete a NAT gateway |

### azure-firewall

| Method | Description |
|--------|-------------|
| `list` | List Azure Firewalls in a resource group |
| `get` | Get a firewall by name |
| `create` | Create an Azure Firewall |
| `delete` | Delete an Azure Firewall |
| `listPolicies` | List firewall policies |
| `getPolicy` | Get a firewall policy by name |
| `createPolicy` | Create a firewall policy |

### azure-vwan

The vWAN model manages the full hub-and-spoke topology as a set of interdependent resources, from the WAN itself through virtual hubs, hub-to-VNet connections, VPN sites, and VPN gateways.

| Method | Description |
|--------|-------------|
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
| `inventory` | Generate a full inventory of all vWAN resources (WANs, hubs, connections, sites, gateways) |

### azure-sql

| Method | Description |
|--------|-------------|
| `listServers` | List SQL logical servers in a resource group |
| `getServer` | Get a SQL server by name |
| `createServer` | Create a SQL logical server with admin credentials |
| `deleteServer` | Delete a SQL server |
| `listDatabases` | List databases on a SQL server |
| `getDatabase` | Get a database by name |
| `createDatabase` | Create a database with SKU and max size |
| `deleteDatabase` | Delete a database |

### azure-storage-account

| Method | Description |
|--------|-------------|
| `list` | List storage accounts in a resource group |
| `get` | Get a storage account by name |
| `create` | Create a storage account with SKU and kind |
| `delete` | Delete a storage account |

### azure-key-vault

| Method | Description |
|--------|-------------|
| `list` | List Key Vaults in a resource group |
| `get` | Get a Key Vault by name |
| `create` | Create a Key Vault |
| `delete` | Delete a Key Vault |

### azure-resource-group

| Method | Description |
|--------|-------------|
| `list` | List resource groups in a subscription |
| `get` | Get a resource group by name |
| `create` | Create a resource group in a location |
| `delete` | Delete a resource group and all its contents |

### azure-topology

| Method | Description |
|--------|-------------|
| `generate` | Produce a Mermaid diagram of a resource group's network topology with Azure-branded colors |
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

2. Create a Swamp vault and store your subscription ID:

```bash
swamp vault create azure --type local_encryption
swamp vault set azure subscription-id <your-subscription-id>
```

3. Create a model instance, wiring the subscription ID from vault:

```bash
swamp model create --type @dougschaefer/azure-vm --name my-vms
```

When prompted for the `subscriptionId` global argument, use:

```
${{ vault.get(azure, subscription-id) }}
```

4. Run methods against the instance:

```bash
swamp model execute my-vms --method list
```

## API Compatibility

All operations shell out to Azure CLI 2.x via subprocess. The topology model's `costEstimate` method calls the [Azure Retail Pricing API](https://learn.microsoft.com/rest/api/cost-management/retail-prices/azure-retail-prices) directly via fetch for VM hourly rates, which is public and requires no authentication.

Tested against Azure CLI 2.67+ and the current Azure Resource Manager API versions as of March 2026. Resource group operations and ARM template export use whichever API versions the installed CLI targets.

## License

MIT — see [LICENSE](LICENSE)
