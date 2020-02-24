import { SupportBladeDefinitions } from "./portal";

export class ToolNames {
    public static MemoryDump: string = 'Collect Memory Dump';
    public static Profiler: string = 'Collect .NET Profiler Trace';
    public static JavaThreadDump: string = 'Collect Java Thread Dump';
    public static JavaMemoryDump: string = 'Collect Java Memory Dump';
    public static HttpLogAnalyzer: string = 'Analyze HTTP Logs';
    public static PHPLogAnalyzer: string = 'Analyze PHP Logs';
    public static PHPProcessAnalyzer: string = 'Analyze PHP Process';
    public static DatabaseTester: string = 'Check Connection Strings';
    public static NetworkTrace: string = 'Collect Network Trace';
    public static AutoHealing: string = 'Auto-Heal';
    public static Diagnostics: string = 'Diagnostics';
    public static CpuMonitoring: string = 'Proactive CPU Monitoring';
    public static EventViewer: string = 'Application Event Logs';
    public static FrebViewer: string = "Failed Request Tracing Logs";
    public static MetricPerInstanceApp: string = 'Metrics per Instance (Apps)';
    public static AppServicePlanMetrics: string = 'Metrics per Instance (App Service Plan)';
    public static AdvancedAppRestart: string = 'Advanced Application Restart';
    public static SecurityScanning: string = 'Security Scanning';
}


export class ToolIds {
    public static Profiler: string = 'profiler';
    public static MemoryDump: string = 'memorydump';
    public static JavaThreadDump: string = 'javathreaddump';
    public static JavaMemoryDump: string = 'javamemorydump';
    public static HttpLogAnalyzer: string = 'Analyze HTTP Logs';
    public static PHPLogAnalyzer: string = 'phploganalyzer';
    public static PHPProcessAnalyzer: string = 'phpprocessanalyzer';
    public static DatabaseTester: string = 'databasetester';
    public static NetworkTrace: string = 'networktrace';
    public static AutoHealing: string = 'mitigate';
    public static Diagnostics: string = 'Diagnostics';
    public static CpuMonitoring: string = 'cpumonitoring';
    public static EventViewer: string = SupportBladeDefinitions.EventViewer.Identifier;
    public static FrebViewer: string = SupportBladeDefinitions.FREBLogs.Identifier;
    public static MetricPerInstanceApp: string = SupportBladeDefinitions.MetricPerInstance.Identifier;
    public static AppServicePlanMetrics: string = SupportBladeDefinitions.AppServicePlanMetrics.Identifier;
    public static AdvancedAppRestart: string = 'advancedapprestart';
    public static SecurityScanning: string = 'tinfoil';
}
