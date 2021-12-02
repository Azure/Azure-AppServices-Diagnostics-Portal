import { Route } from '@angular/router';

import { AvailabilityComponent } from './availability.component';
import { DetectorViewRouteConfig } from './detector-view/detector-view.routeconfig';
import { RerouteResolver } from './reroute/reroute.resolver';
const AvailabilityCommonRouteConfig: Route[] = [
    {
        path: '',
        component: AvailabilityComponent,
        data: {
            navigationTitle: 'availability'
        }
    },
    {
        path: 'detectors',
        children: DetectorViewRouteConfig,

        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'appDownAnalysis'
        },
    },
    {
        path: 'detectors/sitecpuanalysis/focus',
        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'webappcpu'
        }
    }
];

const PerformanceCommonRouteConfig: Route[] = [
    {
        path: 'detectors',
        children: DetectorViewRouteConfig,

        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'perfAnalysis'
        },
    },
    {
        path: 'detectors/sitecpuanalysis/focus',
        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'webappcpu'
        }
    }
];

export const AvailabilityAndPerformanceCategoryRouteConfig: Route[] = [

    /*
    Purposefully moving app analysis, perf analysis and restart analysis to parrent route level to enable component caching.
    Unfortunately, Component Reuse Strategy doesnt work as expected for child routes.
    See issue : https://github.com/angular/angular/issues/13869
    */
    // Web App Error Analysis
    {
        path: 'diagnostics/availability/analysis',
        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'appDownAnalysis'
        }
    },

    // Web App Performance Analysis
    {
        path: 'diagnostics/performance/analysis',
        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'perfAnalysis'
        }
    },

    // Web App Restart Analysis
    {
        path: 'diagnostics/availability/apprestartanalysis',
        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'webapprestart'
        }
    },

    // Memory Analysis
    {
        path: 'diagnostics/availability/memoryanalysis',
        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'Memoryusage'
        }
    },

    // TCP Connections Analysis
    {
        path: 'diagnostics/availability/tcpconnectionsanalysis',
        resolve:{
            reroute: RerouteResolver
        },
        data:{
            analysisId:'tcpconnections'
        }
    },

    {
        path: 'diagnostics/availability',
        children: AvailabilityCommonRouteConfig
    },

    // Web App Slow
    {
        path: 'diagnostics/performance',
        children: PerformanceCommonRouteConfig
    },
];
