import { TelemetryService } from 'diagnostic-data';
import { Observable, of } from 'rxjs';
import { Injectable } from '@angular/core';
import { DefaultUrlSerializer, Router } from '@angular/router';
import { PortalService } from '../../startup/services/portal.service';
import { OpenBladeInfo } from '../models/portal';
import { ArmService } from './arm.service';
import { DaasService } from './daas.service';
import { PortalActionService } from './portal-action.service';
import { AppInsightsService } from './appinsights/appinsights.service';

@Injectable({
  providedIn: 'root'
})
export class GenericSolutionService {
  allowedRoutes = {
    restart: ['post'],
    reboot: ['post'],
    'config/web': ['get', 'put', 'patch'],
    'config/appsettings/list': ['get', 'put'],
    'config/logs': ['put']
  };

  constructor(
    private armService: ArmService,
    private portalService: PortalService,
    private logService: TelemetryService,
    private portalNavService: PortalActionService,
    private appInsightsService: AppInsightsService,
    private _daasService: DaasService,
    private _router: Router
  ) {}

  assertPropertyExists(dict: {}, property: string) {
    if (!(property in dict) || property == undefined) {
      throw new Error(
        `Property Not Found: expected property named "${property}"`
      );
    }
  }

  validateArmApiOptions(options: { route: string; verb: string }) {
    for (let prop of ['route', 'verb']) {
      this.assertPropertyExists(options, prop);
    }

    let cleanedRoute = options.route.startsWith('/')
      ? options.route.substring(1)
      : options.route;
    cleanedRoute = cleanedRoute.toLowerCase();

    if (
      !this.allowedRoutes[cleanedRoute].includes(options.verb.toLowerCase())
    ) {
      throw new Error(
        `Invalid Operation: cannot perform ${options.verb} on route ${cleanedRoute}`
      );
    }
  }

  buildRoute(resourceUri: string, routeSegment: string): string {
    resourceUri = !resourceUri.endsWith('/') ? resourceUri + '/' : resourceUri;
    return resourceUri + routeSegment;
  }

  getApiVersion(route: string): string | null {
    let urlTree = new DefaultUrlSerializer().parse(route);

    return 'api-version' in urlTree.queryParams
      ? urlTree.queryParams['api-version']
      : null;
  }

  ArmApi(
    resourceUri: string,
    actionOptions: { route: string; verb: string }
  ): Observable<any> {
    this.validateArmApiOptions(actionOptions);

    const verb = actionOptions['verb'].toLowerCase();
    const route = this.buildRoute(resourceUri, actionOptions['route']);
    const apiVersion = this.getApiVersion(route);
    const body = 'body' in actionOptions ? actionOptions['body'] : null;

    this.logService.logEvent('SolutionArmApi', {
      fullRoute: route,
      ...actionOptions
    });

    if (verb === 'get') {
      return this.armService.getResourceFullResponse(route, true, apiVersion);
    }

    let actionMethod = `${verb}ResourceFullResponse`;
    return this.armService[actionMethod](route, body, true, apiVersion);
  }

  OpenTab(
    resourceUri: string,
    actionOptions: { tabUrl: string }
  ): Observable<any> {
    this.assertPropertyExists(actionOptions, 'tabUrl');
    this.logService.logEvent('SolutionOpenTab', {
      resourceUri: resourceUri,
      ...actionOptions
    });

    const tabUrl = actionOptions.tabUrl.toLowerCase();
    this._router.navigateByUrl(tabUrl);

    return of(tabUrl);
  }

  getBladeInfo(options: {}) {
    this.assertPropertyExists(options, 'detailBlade');

    return options as OpenBladeInfo;
  }

  GoToBlade(
    resourceUri: string,
    actionOptions: { detailBlade: string }
  ): Observable<any> {
    const bladeInfo = this.getBladeInfo(actionOptions);
    this.logService.logEvent('SolutionGoToBlade', {
      resourceUri: resourceUri,
      ...actionOptions
    });

    switch (bladeInfo.detailBlade.toLowerCase()) {
      case 'scaleup': {
        this.portalNavService.openBladeScaleUpBlade();
        break;
      }
      case 'autoscalesettingsblade': {
        this.portalNavService.openBladeScaleOutBlade();
        break;
      }
      case 'tinfoilsecurityblade': {
        this.portalNavService.openTifoilSecurityBlade();
        break;
      }
      case 'appinsightsblade': {
        this.appInsightsService.openAppInsightsBlade();
        break;
      }
      case 'appinsightsfailuresblade': {
        this.appInsightsService.openAppInsightsFailuresBlade();
        break;
      }
      case 'appinsightsperformanceblade': {
        this.appInsightsService.openAppInsightsPerformanceBlade();
        break;
      }
      default: {
        this.portalService.openBlade(bladeInfo, 'troubleshoot');
      }
    }

    return of(bladeInfo.detailBlade);
  }

  ToggleStdoutSetting(
    resourceUri: string,
    actionOptions: { enabled: boolean }
  ): Observable<any> {
    this.logService.logEvent('SolutionToggleStdoutSetting', {
      resourceUri: resourceUri,
      enabled: actionOptions.enabled.toString()
    });

    return this._daasService.putStdoutSetting(
      resourceUri,
      actionOptions.enabled
    );
  }
}
