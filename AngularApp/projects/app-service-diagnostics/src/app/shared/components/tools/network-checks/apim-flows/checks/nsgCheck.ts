import { checkResultLevel, CheckStepView, InfoStepView, InfoType, StepFlowManager, StepView } from 'diagnostic-data';
import { DiagProvider } from '../../diag-provider';
import { ApiManagementServiceResourceContract, PlatformVersion, VirtualNetworkConfigurationContract, VirtualNetworkType } from '../contracts/APIMService';
import { NetworkSecurityGroupContract, ProvisioningState, SecurityRuleAccess, SecurityRuleContract, SecurityRuleProtocol, SubnetContract } from '../contracts/NetworkSecurity';
import { PortRequirements, stv1portRequirements, stv2portRequirements } from '../data/portRequirements';
import { NETWORK_API_VERSION, statusIconMarkdown } from "../data/constants";
import { getWorstStatus } from "./networkStatusCheck";

class PortRange {
    portLowerBound: number;
    portUpperBound: number;
    ports: PortRange[];

    constructor(ports: string | string[]) {
        this.portLowerBound = -1;
        this.portUpperBound = -1;
        this.ports = [];

        if (Array.isArray(ports)) {
            this.ports = ports.map(p => new PortRange(p));
        } else if (ports == "*") {
            this.portLowerBound = 0;
            this.portUpperBound = 65536;
        } else if (ports.includes("-")) {
            let [p1, p2] = ports.split("-");
            this.portLowerBound = parseInt(p1);
            this.portUpperBound = parseInt(p2);
        } else if (ports.includes(",")) {
            this.ports = ports.split(",").map(p => new PortRange(p));
        } else {
            let port = parseInt(ports);
            this.portLowerBound = port;
            this.portUpperBound = port;
        }
    }

    has(port: number) {
        if (this.portLowerBound >= 0 && this.portUpperBound >= 0) {
            return this.portLowerBound <= port && port <= this.portUpperBound;
        } else if (this.portUpperBound >= 0) {
            throw Error(`invalid state for PortRange obj: ${this.portLowerBound}, ${this.portUpperBound}, ${this.ports}`);
        } else if (this.portLowerBound >= 0) {
            throw Error(`invalid state for PortRange obj: ${this.portLowerBound}, ${this.portUpperBound}, ${this.ports}`);
        } else if (this.ports.length > 0) {
            return this.ports.some(pr => pr.has(port));
        } else {
            throw Error(`invalid state for PortRange obj: ${this.portLowerBound}, ${this.portUpperBound}, ${this.ports}`);
        }
    }
}

function sameProtocol(protocol1: SecurityRuleProtocol, protocol2: SecurityRuleProtocol) {
    return protocol1 == SecurityRuleProtocol.AST || protocol2 == SecurityRuleProtocol.AST || protocol1 == protocol2;
}

function samePorts(ports: number[], portRange: string | string[]) {
    let pRange = new PortRange(portRange);
    // -1 means all ports
    let fullRange = ports.includes(-1) && (portRange.includes("*") || portRange.includes("0-65536"));
    return fullRange || ports.some((n) => pRange.has(n));
}

function sameIP(ip1: string, ip2: string) {
    return ip1 == "*" || ip2 == "*" || ip1 == "Any" || ip2 == "Any" || ip1 == ip2 ||
        (ip1 != "Internet" && ip2 == "VirtualNetwork") || (ip1 == "VirtualNetwork" && ip2 != "Internet");
}

enum RuleResult {
    ALLOW,
    NO_EFFECT,
    BLOCK,
}

function ruleAffects(requirement: PortRequirements, rule: SecurityRuleContract): boolean {
    // if requirement does not apply to security rule, we return true

    if (rule.properties.provisioningState != ProvisioningState.SUCCEEDED)
        return false;

    // rule matches inbound / outbound direction of requirement
    if (!requirement.dir.includes(rule.properties.direction))
        return false;
    // rule matches tcp / ip / udp protocol of requirement
    if (!sameProtocol(requirement.protocol, rule.properties.protocol))
        return false;
    // rule blocks source ips of requirement
    if (!sameIP(requirement.serviceSource, rule.properties.sourceAddressPrefix))
        return false;
    // rule blocks destination ips of requirement
    if (!sameIP(requirement.serviceDestination, rule.properties.destinationAddressPrefix))
        return false;
    // rule blocks destination ports of requirement
    if (!samePorts(requirement.portNums, rule.properties.destinationPortRange || rule.properties.destinationPortRanges))
        return false;

    return true;
}

function rulePasses(portNum: number, rule: SecurityRuleContract): RuleResult {
    if (rule.properties.access == SecurityRuleAccess.ALLOW) {
        if (samePorts([portNum], rule.properties.destinationPortRange || rule.properties.destinationPortRanges))
            return RuleResult.ALLOW;
    } else {
        // make sure destination ports are unblocked
        if (samePorts([portNum], rule.properties.destinationPortRange || rule.properties.destinationPortRanges))
            return RuleResult.BLOCK;
    }

    return RuleResult.NO_EFFECT;
}

interface RequirementResultsByNsg {
    id: string;
    location: string;
    reqs: RequirementResult[];
}

interface RequirementResult {
    status: checkResultLevel;
    name: string;
    description: string;
}

function requirementCheck(requirements: PortRequirements[], rules: SecurityRuleContract[]): RequirementResult[] {
    // sort by priority
    rules.sort((a, b) => a.properties.priority - b.properties.priority);
    let failedChecks: RequirementResult[] = [];

    for (let requirement of requirements) {
        let affectingRules = rules.filter(rule => ruleAffects(requirement, rule));
        for (let port of requirement.portNums) {
            let portBlocked = false;
            for (let rule of affectingRules) {
                let ruleRes = rulePasses(port, rule);
                if (ruleRes == RuleResult.ALLOW) {
                    break;
                } else if (ruleRes == RuleResult.NO_EFFECT) {
                    continue;
                } else if (ruleRes == RuleResult.BLOCK) {
                    failedChecks.push({
                        status: requirement.required ? checkResultLevel.fail : checkResultLevel.warning,
                        name: rule.name,
                        description: requirement.purpose
                    });
                    portBlocked = true;
                    break;
                }
            }
            if (portBlocked) break;
        }
    }

    return failedChecks;
}

function generateRequirementViolationTable(requirements: RequirementResultsByNsg): string {

    if (requirements.reqs.length == 0) {
        return `No requirement violations detected`;
    }

    return `
| Status | Rule Name | Description |
|--------|-----------|-------------|
` + requirements.reqs.map((req: RequirementResult) => {

        let icon = statusIconMarkdown[req.status];
        let description = req.description.replace(/(\r\n|\n|\r)/gm, "");
        let link = `https://ms.portal.azure.com/#@microsoft.onmicrosoft.com/resource${requirements.id}/overview`;

        return `|   ${icon} | <a href="${link}" target="_blank">${req.name}</a> | ${description} |`;
    }).join("\n");
}

async function getViolatedRequirements(
    virtualNetworkConfiguration: VirtualNetworkConfigurationContract,
    diagProvider: DiagProvider,
    networkType: VirtualNetworkType = VirtualNetworkType.EXTERNAL,
    platformVersion: PlatformVersion = PlatformVersion.STV2): Promise<RequirementResultsByNsg> {

    const subnetResourceId = virtualNetworkConfiguration.subnetResourceId;
    const subnetResponse = await diagProvider.getResource<SubnetContract>(subnetResourceId, NETWORK_API_VERSION);
    const subnet = subnetResponse.body;

    const networkSecurityGroupResourceId = subnet.properties.networkSecurityGroup.id;

    if (!networkSecurityGroupResourceId) return null;

    const networkSecurityGroupResponse = await diagProvider.getResource<NetworkSecurityGroupContract>(networkSecurityGroupResourceId, NETWORK_API_VERSION);
    const networkSecurityGroup = networkSecurityGroupResponse.body;

    const securityRules = [...networkSecurityGroup.properties.defaultSecurityRules, ...networkSecurityGroup.properties.securityRules];

    let portRequirements = (platformVersion == PlatformVersion.STV1 ? stv1portRequirements : stv2portRequirements);
    portRequirements = portRequirements.filter(req => req.vnetType.includes(networkType));
    return {
        id: networkSecurityGroup.id,
        location: networkSecurityGroup.location,
        reqs: requirementCheck(portRequirements, securityRules),
    };
}

async function getVnetInfoView(
    diagProvider: DiagProvider,
    serviceResource: ApiManagementServiceResourceContract,
    networkType: VirtualNetworkType = VirtualNetworkType.EXTERNAL,
    platformVersion: PlatformVersion = PlatformVersion.STV2): Promise<StepView> {

    let violatedRequirementsByLocation: { [key: string]: RequirementResultsByNsg } = {};

    violatedRequirementsByLocation[serviceResource.location] = await getViolatedRequirements(serviceResource.properties.virtualNetworkConfiguration, diagProvider, networkType, platformVersion);
    if (serviceResource.properties.additionalLocations) {
        for (let loc of serviceResource.properties.additionalLocations) {
            violatedRequirementsByLocation[loc.location] = await getViolatedRequirements(loc.virtualNetworkConfiguration, diagProvider, networkType, platformVersion);
        }
    }

    let worstStatus = getWorstStatus(Object.values(violatedRequirementsByLocation).map(violatedRequirements => getWorstStatus(violatedRequirements.reqs.map(req => req.status))));
    let view = new CheckStepView({
        id: "netsec-view",
        title: "Network Security Rule status",
        level: worstStatus,
        bodyMarkdown: `
            A network security group contains security rules that allow or deny inbound 
            network traffic to, or outbound network traffic from, several types of Azure resources. 
            Some rules may block access to important dependencies. You can find a list of requirements 
            [here](https://docs.microsoft.com/en-us/azure/api-management/virtual-network-reference?tabs=stv2).`,
        subChecks: Object.entries(violatedRequirementsByLocation).map(([loc, violatedRequirements]) => {
            if (violatedRequirements) {
                return {
                    title: loc,
                    level: getWorstStatus(violatedRequirements.reqs.map(req => req.status)),
                    bodyMarkdown: generateRequirementViolationTable(violatedRequirements),
                }
            } else {
                return {
                    title: loc,
                    level: checkResultLevel.info,
                    bodyMarkdown: "Network Security Group is not linked to this subnet"
                }
            }
        }),
    });

    return view;
}

async function getNoVnetView(): Promise<StepView> {
    const view = new InfoStepView({
        title: "VNET Status",
        infoType: InfoType.recommendation,
        id: "secondStep",
        markdown: `
            ## No VNet Configuration detected
        `,
    });

    return view;
}

export interface Body {
    location?: string;
}

export function nsgRuleCheck(networkType: VirtualNetworkType, flowMgr: StepFlowManager, diagProvider: DiagProvider, serviceResource: ApiManagementServiceResourceContract) {
    if (networkType != VirtualNetworkType.NONE) {
        flowMgr.addView(getVnetInfoView(diagProvider, serviceResource, networkType), "Gathering VNET Configuration");
    } else {
        flowMgr.addView(getNoVnetView(), "Gathering VNET Configuration");
    }
}
