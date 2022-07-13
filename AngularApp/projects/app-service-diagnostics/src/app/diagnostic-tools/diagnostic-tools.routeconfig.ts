import { ToolIds, ToolNames } from '../shared/models/tools-constants';
import { ProfilerToolComponent } from '../shared/components/tools/profiler-tool/profiler-tool.component';
import { MemoryDumpToolComponent } from '../shared/components/tools/memorydump-tool/memorydump-tool.component';
import { JavaThreadDumpToolComponent } from '../shared/components/tools/java-threaddump-tool/java-threaddump-tool.component';
import { JavaMemoryDumpToolComponent } from '../shared/components/tools/java-memorydump-tool/java-memorydump-tool.component';
import { ConnectionDiagnoserToolComponent } from '../shared/components/tools/connection-diagnoser-tool/connection-diagnoser-tool.component';
import { AutohealingComponent } from '../auto-healing/autohealing.component';
import { NetworkTraceToolComponent } from '../shared/components/tools/network-trace-tool/network-trace-tool.component';
import { DaasMainComponent } from '../shared/components/daas-main/daas-main.component';
import { Route, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot, Router, ActivatedRoute } from '@angular/router';
import { AutohealingDetectorComponent } from '../availability/detector-view/detectors/autohealing-detector/autohealing-detector.component';
import { CpuMonitoringToolComponent } from '../shared/components/tools/cpu-monitoring-tool/cpu-monitoring-tool.component';
import { EventViewerComponent } from '../shared/components/daas/event-viewer/event-viewer.component';
import { FrebViewerComponent } from '../shared/components/daas/freb-viewer/freb-viewer.component';
import { Injectable, Component } from '@angular/core';
import { Observable, of } from 'rxjs';
import { PortalActionService } from '../shared/services/portal-action.service';
import { AuthService } from '../startup/services/auth.service';
import { JavaFlightRecorderToolComponent } from '../shared/components/tools/java-flight-recorder-tool/java-flight-recorder-tool.component';
import { CrashMonitoringComponent } from '../shared/components/tools/crash-monitoring/crash-monitoring.component';
import { NetworkCheckComponent } from '../shared/components/tools/network-checks/network-checks.component';
import { LinuxNodeHeapDumpComponent } from '../shared/components/tools/linux-node-heap-dump/linux-node-heap-dump.component';
import { LinuxNodeCpuProfilerComponent } from '../shared/components/tools/linux-node-cpu-profiler/linux-node-cpu-profiler.component';
import { LinuxPythonCpuProfilerComponent } from '../shared/components/tools/linux-python-cpu-profiler/linux-python-cpu-profiler.component';

@Injectable()
export class MetricsPerInstanceAppsResolver implements Resolve<Observable<boolean>> {
    private resourceId: string;
    constructor(private _portalActionService: PortalActionService, private _router: Router, private _authService: AuthService) {
        this._authService.getStartupInfo().subscribe(startupInfo => this.resourceId = startupInfo.resourceId);
    }
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        //if open from home page second blade will go to Diagnostic Tool Overview Page
        //Otherwise redirect to previous page(open from category search bar)
        const url = this._router.url === '/resourceRedirect' ? `resource${this.resourceId}/categories/DiagnosticTools/overview` : this._router.url;
        this._router.navigateByUrl(url);
        this._portalActionService.openMdmMetricsV3Blade();
        return of(true);
    }
}

@Injectable()
export class MetricsPerInstanceAppServicePlanResolver implements Resolve<Observable<boolean>> {
    private resourceId: string;
    constructor(private _portalActionService: PortalActionService, private _router: Router, private _authService: AuthService) {
        this._authService.getStartupInfo().subscribe(startupInfo => this.resourceId = startupInfo.resourceId);
    }
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const url = this._router.url === '/resourceRedirect' ? `resource${this.resourceId}/categories/DiagnosticTools/overview` : this._router.url;
        this._router.navigateByUrl(url);
        this._portalActionService.openMdmMetricsV3Blade(this._portalActionService.currentSite.properties.serverFarmId);
        return of(true);
    }
}

@Injectable()
export class AdvanceApplicationRestartResolver implements Resolve<Observable<boolean>> {
    private resourceId: string;
    constructor(private _portalActionService: PortalActionService, private _router: Router, private _authService: AuthService) {
        this._authService.getStartupInfo().subscribe(startupInfo => this.resourceId = startupInfo.resourceId);
    }
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const url = this._router.url === '/resourceRedirect' ? `resource${this.resourceId}/categories/DiagnosticTools/overview` : this._router.url;
        this._router.navigateByUrl(url);
        this._portalActionService.openBladeAdvancedAppRestartBladeForCurrentSite();
        return of(true);
    }
}

@Injectable()
export class SecurityScanningResolver implements Resolve<Observable<boolean>> {
    private resourceId: string;
    constructor(private _portalActionService: PortalActionService, private _router: Router, private _authService: AuthService) {
        this._authService.getStartupInfo().subscribe(startupInfo => this.resourceId = startupInfo.resourceId);
    }
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        const url = this._router.url === '/resourceRedirect' ? `resource${this.resourceId}/categories/DiagnosticTools/overview` : this._router.url;
        this._router.navigateByUrl(url);
        this._portalActionService.openTifoilSecurityBlade();
        return of(true);
    }
}

export const DiagnosticToolsRoutes: Route[] = [
    // CLR Profiling Tool
    {
        path: 'profiler',
        component: ProfilerToolComponent,
        data: {
            navigationTitle: ToolNames.Profiler,
            cacheComponent: true
        }
    },
    {
        path: 'networkchecks',
        component: NetworkCheckComponent,
        data: {
            navigationTitle: ToolNames.NetworkChecks,
            cacheComponent: true
        }
    },
    // Memory Dump
    {
        path: 'memorydump',
        component: MemoryDumpToolComponent,
        data: {
            navigationTitle: ToolNames.MemoryDump,
            cacheComponent: true
        }
    },
    // Java Thread Dump
    {
        path: 'javathreaddump',
        component: JavaThreadDumpToolComponent,
        data: {
            navigationTitle: ToolNames.JavaThreadDump,
            cacheComponent: true
        }
    },
    // Java Memory Dump
    {
        path: 'javamemorydump',
        component: JavaMemoryDumpToolComponent,
        data: {
            navigationTitle: ToolNames.JavaMemoryDump,
            cacheComponent: true
        }
    },
    // Java Flight Recorder
    {
        path: 'javaflightrecorder',
        component: JavaFlightRecorderToolComponent,
        data: {
            navigationTitle: ToolNames.JavaFlightRecorder,
            cacheComponent: true
        }
    },
    // Linux Node Heap Dump
    {
        path: "linuxnodeheapdump",
        component: LinuxNodeHeapDumpComponent,
        data: {
            navigationTitle: ToolNames.LinuxNodeHeapDump,
            cacheComponent: true
        }
    },
    // Linux Node Cpu Profiler
    {
        path: "linuxnodecpuprofiler",
        component: LinuxNodeCpuProfilerComponent,
        data: {
            navigationTitle: ToolNames.LinuxNodeCpuProfiler,
            cacheComponent: true
        }
    },
    // Linux Python CPU Profiler
    {
        path: "linuxpythoncpuprofiler",
        component: LinuxPythonCpuProfilerComponent,
        data: {
            navigationTitle: ToolNames.LinuxPythonCpuProfiler,
            cacheComponent: true
        }
    },
    // Database Test Tool
    {
        path: 'databasetester',
        component: ConnectionDiagnoserToolComponent,
        data: {
            navigationTitle: ToolNames.DatabaseTester,
            cacheComponent: true
        }
    },
    // CPU Monitoring tool
    {
        path: 'cpumonitoring',
        component: CpuMonitoringToolComponent,
        data: {
            navigationTitle: ToolNames.CpuMonitoring,
            cacheComponent: true
        }
    },
    // CPU Monitoring tool
    {
        path: 'crashmonitoring',
        component: CrashMonitoringComponent,
        data: {
            navigationTitle: ToolNames.CrashMonitoring,
            cacheComponent: true
        }
    },
    // Autohealing
    {
        path: 'mitigate',
        component: AutohealingComponent,
        data: {
            navigationTitle: 'Auto-Heal',
            detectorComponent: AutohealingDetectorComponent
        }
    },
    // Network Trace
    {
        path: 'networktrace',
        component: NetworkTraceToolComponent,
        data: {
            navigationTitle: ToolNames.NetworkTrace,
            cacheComponent: true
        }
    },
    // Diagnostics
    {
        path: 'daas',
        component: DaasMainComponent,
        data: {
            navigationTitle: ToolNames.Diagnostics,
            cacheComponent: true
        }
    },
    // Event Viewer
    {
        path: 'eventviewer',
        component: EventViewerComponent,
        data: {
            navigationTitle: ToolNames.EventViewer,
            cacheComponent: true
        }
    },
    // Freb Viewer
    {
        path: 'frebviewer',
        component: FrebViewerComponent,
        data: {
            navigationTitle: ToolNames.FrebViewer,
            cacheComponent: true
        }
    },
    //Metrics per Instance (Apps)
    {
        path: 'metricsperinstance',
        resolve: {
            reroute: MetricsPerInstanceAppsResolver
        },
    },
    //Metrics per Instance (App Service Plan)
    {
        path: 'metricsperinstanceappserviceplan',
        resolve: {
            reroute: MetricsPerInstanceAppServicePlanResolver
        },
    },
    //Advanced Application Restart
    {
        path: 'applicationrestart',
        resolve: {
            reroute: AdvanceApplicationRestartResolver
        },
    },
    //Security Scanning
    {
        path: 'securityscanning',
        resolve: {
            reroute: SecurityScanningResolver
        },
    },
];


