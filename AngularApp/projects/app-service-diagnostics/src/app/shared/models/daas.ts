export enum DiagnosisStatus {
    NotRequested,
    WaitingForInputs,
    InProgress,
    Error,
    Cancelled,
    Complete
}

export enum SessionStatus {
    Active,
    CollectedLogsOnly,
    Cancelled,
    Error,
    Complete
}

export enum SessionMode {
    Collect = "Collect",
    CollectAndAnalyze = "CollectAndAnalyze"
}

export class Session {
    Mode: SessionMode;
    SessionId: string;
    Status: string;
    StartTime: string;
    Tool: string;
    ToolParams: string;
    Instances: string[];
    ActiveInstances: ActiveInstance[];
    BlobStorageHostName: string;
    DefaultScmHostName: string;
}

export interface ActiveInstance {
    Name: string;
    Logs: LogFile[];
    CollectorErrors: string[];
    AnalyzerErrors: string[];
    Status: string;
    CollectorStatusMessages: string[];
    AnalyzerStatusMessages: string[];
}

export class LogFile {
    StartTime: string;
    Name: string;
    Size: number;
    Reports: ReportV2[];
    RelativePath: string;
}

export class ReportV2 {
    Name: string;
    RelativePath: string;
}

export class SessionFile {
    name: string;
    relativePath: string;
}

export class SessionMaster {
    mode: SessionMode;
    sessionId: string;
    startDate: string;
    instances: string[] = [];
    tool: string;
    toolParams: string;
    logs: SessionFile[] = [];
    reports: SessionFile[] = [];
    collectorErrors: string[] = [];
    analyzerErrors: string[] = [];
    status: SessionStatus;
    collectorStatus: DiagnosisStatus;
    analyzerStatus: DiagnosisStatus;
    hasBlobSasUri: boolean = false;
    blobStorageHostName: string = "";

    expanded: boolean = true;
    deleting: boolean = false;
    deletingFailure: string = "";
    size: number = 0;
    isV2: boolean = false;
    isDiagServerSession: boolean = false;
}

export interface DiagnoserDefinition {
    Name: string;
    Warnings: string[];
    Description: string;
}

export interface DatabaseTestConnectionResult {
    Name: string;
    ConnectionString: string;
    ProviderName: string;
    ExceptionDetails: ExceptionDetails;
    Succeeded: boolean;
    DatabaseType: ConnectionDatabaseType;
    Instance: string;
    DummyValueExistsInWebConfig: boolean;
    FilePath: string;
    LineNumber: number;
    IsEnvironmentVariable: boolean;
    MaskedConnectionString: string;
    DisplayClearText: boolean;
    Expanded: boolean;
}

export enum ConnectionDatabaseType {
    SqlDatabase = 0,
    SqlServer,
    MySql,
    Custom,
    Dynamic,
    NotSupported,
    PostgreSql,
    RedisCache
}

export interface ExceptionDetails {
    ClassName: string;
    Message: string;
    Data: any;
    StackTraceString: string;
    RemoteStackTraceString: string;
    HResult: number;

}
export enum AnalysisStatus {
    NotStarted,
    InProgress,
    Completed
}

export enum CpuMonitoringMode {
    Kill = "Kill",
    Collect = "Collect",
    CollectAndKill = "CollectAndKill",
    CollectKillAndAnalyze = "CollectKillAndAnalyze"
}

export class MonitoringSession {
    RuleType: RuleType = RuleType.Diagnostics;
    Mode: CpuMonitoringMode;
    SessionId: string;
    StartDate: string;
    EndDate: string;
    ProcessesToMonitor: string;
    MonitorScmProcesses: boolean;
    CpuThreshold: number;
    ThresholdSeconds: number;
    MonitorDuration: number;
    ActionToExecute: string;
    ArgumentsToAction: string;
    MaxActions: number;
    MaximumNumberOfHours: number;
    FilesCollected: MonitoringFile[];
    AnalysisStatus: AnalysisStatus;
    AnalysisSubmitted: boolean = false;
    ErrorSubmittingAnalysis: string = "";
    BlobSasUri: string = "";
}

export enum RuleType {
    Diagnostics = "Diagnostics",
    AlwaysOn = "AlwaysOn"
}

export interface MonitoringFile {
    FileName: string;
    RelativePath: string
    ReportFile: string;
    ReportFileRelativePath: string;
    AnalysisErrors: string[];
}

export interface ActiveMonitoringSession {
    Session: MonitoringSession;
    MonitoringLogs: MonitoringLogsPerInstance[];
}

export interface MonitoringLogsPerInstance {
    Instance: string;
    Logs: string
}

export interface DaasAppInfo {
    Framework: string;
    FrameworkVersion: string;
    AspNetCoreVersion: string;
    CoreProcessName: string;
    LoggingLevel: string;
}

export class DaasSettings {
    Diagnosers: any[] = [];
    TimeSpan: string;
    BlobSasUri: string;
    BlobContainer: string;
    BlobKey: string;
    BlobAccount: string;
    EndpointSuffix: string;
}

export class DaasStorageConfiguration {
    SasUri: string = '';
    ConnectionString: string = '';
}

export class DaasValidationResult {
    Validated: boolean = false;
    BlobSasUri: string = "";
    ConnectionString: string = "";
    UseDiagServerForLinux: boolean = false;
}

export class CrashMonitoringSettings {
    StartTimeUtc: string;
    MaxHours: number;
    MaxDumpCount: number;
    ExceptionFilter: string;
}

export interface ValidateSasUriResponse {
    Exception: string;
    IsValid: boolean;
    StorageAccount: string;
    SpecifiedAt: string;
    ExtendedError: StorageExtendError;
}

export interface ValidateStorageAccountResponse {
    IsStorageConfigured: boolean;
    IsValid: boolean;
    StorageAccount: string;
    ValidationError: any;
    UnderlyingException: any;
}

export interface StorageExtendError {
    HttpStatusCode: string;
    HttpStatusMessage: string;
    ErrorCode: string;
    ErrorMessage: string;
    AdditionalDetails: any;
}

export enum linuxDiagnosticTools {
    MemoryDump = "MemoryDump",
    Profiler = "Profiler"
}

export enum linuxToolParams {
    DumpType = "DumpType",
    DurationSeconds = "DurationSeconds"
}

export enum linuxDumpType {
    Mini = "Mini",
    Full = "Full",
    Triage = "Triage",
    WithHeap = "WithHeap",
}

export enum linuxCollectionModes {
    CollectLogs = "CollectLogs",
    CollectLogsAndKill = "CollectLogsAndKill"
}

export interface LinuxDaasSettings {
    DiagnosticServerEnabled: boolean;
}

export interface Instance {
    machineName: string;
    instanceId: string;
}

export interface LinuxCommand {
    command: string;
}

export interface LinuxCommandOutput {
    Output: string;
    Error: string;
    ExitCode: number;
}

export interface DaasSettingsResponse {
    BlobSasUri: string;
    StorageConnectionString: string;
}