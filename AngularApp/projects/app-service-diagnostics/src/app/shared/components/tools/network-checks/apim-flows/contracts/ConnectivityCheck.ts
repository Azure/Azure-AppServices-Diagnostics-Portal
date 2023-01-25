

export enum ConnectivityCheckProtocol {
    HTTPS = "HTTPS",
    HTTP = "HTTP",
    TCP = "TCP"
}

interface Destination {
    address: string;
    port: number;
}

interface Source {
    instance?: number;
    region: string;
}

export enum PreferredIPVersion {
    IPv4 = "IPv4"
}

interface HTTPHeader {
    name: string;
    value: string;
}

export enum Method {
    GET = "GET",
    POST = "POST"
}

interface HTTPConfiguration {
    headers: HTTPHeader[];
    method: Method;
    validStatusCodes: number[];
}

interface ProtocolConfiguration {
    HTTPConfiguration: HTTPConfiguration;
}

export interface ConnectivityCheckPayloadContract {
    destination: Destination;
    source: Source;
    preferredIPVersion?: PreferredIPVersion;
    protocol?: ConnectivityCheckProtocol;
    protocolConfiguration?: ProtocolConfiguration;
}

interface ErrorFieldContract {
    code: string;
    message: string;
    target: string;
}

export interface ErrorResponseContract {
    error: {
        code: string;
        details: ErrorFieldContract[];
        message: string;
    }
}

export enum ConnectionStatus {
    CONNECTED = "Connected",
    DEGRADED = "Degraded",
    DISCONNECTED = "Disconnected",
    UNKNOWN = "Unknown",
    REACHABLE = "Reachable",
    UNREACHABLE = "Unreachable"
}

enum Origin {
    INBOUND = "Inbound",
    LOCAL = "Local",
    OUTBOUND = "Outbound"
}

export enum Severity {
    ERROR = "Error",
    WARNING = "Warning"
}

export enum IssueType {
    AgentStopped = "AgentStopped",
    DnsResolution = "DnsResolution",
    GuestFirewall = "GuestFirewall",
    NetworkSecurityRule = "NetworkSecurityRule",
    Platform = "Platform",
    PortThrottled = "PortThrottled",
    SocketBind = "SocketBind",
    Unknown = "Unknown",
    UserDefinedRoute = "UserDefinedRoute"
}

export interface ConnectivityIssueContract {
    context: object[];
    origin: Origin;
    severity: Severity;
    type: IssueType;
}

export interface ConnectivityHopContract {
    address: string;
    id: string;
    issues: ConnectivityIssueContract[];
    nextHopIds: string[];
    resourceId?: string;
    type: string;
}

export interface ConnectivityCheckResponse {
    avgLatencyInMs: number;
    connectionStatus: ConnectionStatus;
    hops: ConnectivityHopContract[];
    maxLatencyInMs: number;
    minLatencyInMs: number;
    probesFailed: number;
    probesSent: number;
}