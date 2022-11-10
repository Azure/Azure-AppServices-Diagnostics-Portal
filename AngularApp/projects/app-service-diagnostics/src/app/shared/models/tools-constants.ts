import { SupportBladeDefinitions } from "./portal";

export class ToolNames {
    public static MemoryDump: string = 'Collect Memory Dump';
    public static Profiler: string = 'Collect .NET Profiler Trace';
    public static NetworkChecks: string = 'Network Troubleshooter';
    public static JavaThreadDump: string = 'Collect Java Thread Dump';
    public static JavaMemoryDump: string = 'Collect Java Memory Dump';
    public static JavaFlightRecorder: string = 'Collect Java Flight Recorder Trace';
    public static DatabaseTester: string = 'Check Connection Strings';
    public static NetworkTrace: string = 'Collect Network Trace';
    public static AutoHealing: string = 'Auto-Heal';
    public static Diagnostics: string = 'Diagnostics';
    public static CpuMonitoring: string = 'Proactive CPU Monitoring';
    public static CrashMonitoring: string = 'Crash Monitoring';
    public static EventViewer: string = 'Application Event Logs';
    public static FrebViewer: string = "Failed Request Tracing Logs";
    public static MetricPerInstanceApp: string = 'Metrics per Instance (Apps)';
    public static AppServicePlanMetrics: string = 'Metrics per Instance (App Service Plan)';
    public static AdvancedAppRestart: string = 'Advanced Application Restart';
    public static SecurityScanning: string = 'Security Scanning';
    public static LinuxNodeHeapDump: string = "Node Heap Dump";
    public static LinuxNodeCpuProfiler: string = "Node CPU Profiler";
    public static LinuxPythonCpuProfiler: string = "Python CPU Profiler";
}


export class ToolIds {
    public static Profiler: string = 'profiler';
    public static NetworkChecks: string = 'networkchecks';
    public static MemoryDump: string = 'memorydump';
    public static JavaThreadDump: string = 'javathreaddump';
    public static JavaMemoryDump: string = 'javamemorydump';
    public static JavaFlightRecorder: string = 'javaflightrecorder';
    public static DatabaseTester: string = 'databasetester';
    public static NetworkTrace: string = 'networktrace';
    public static AutoHealing: string = 'mitigate';
    public static Diagnostics: string = 'Diagnostics';
    public static CpuMonitoring: string = 'cpumonitoring';
    public static CrashMonitoring:string = 'crashmonitoring';
    public static EventViewer: string = SupportBladeDefinitions.EventViewer.Identifier;
    public static FrebViewer: string = SupportBladeDefinitions.FREBLogs.Identifier;
    public static MetricPerInstanceApp: string = SupportBladeDefinitions.MetricPerInstance.Identifier;
    public static AppServicePlanMetrics: string = SupportBladeDefinitions.AppServicePlanMetrics.Identifier;
    public static AdvancedAppRestart: string = 'advancedapprestart';
    public static SecurityScanning: string = 'tinfoil';
    public static LinuxNodeHeapDump: string = "linuxnodeheapdump";
    public static LinuxNodeCpuProfiler: string = "linuxnodecpuprofiler";
    public static LinuxPythonCpuProfiler: string = "linuxpythoncpuprofiler";
}
