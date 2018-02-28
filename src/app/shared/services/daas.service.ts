import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { SiteDaasInfo } from '../models/solution-metadata';
import { ArmService } from './arm.service';
import { AuthService } from './auth.service';
import { UriElementsService } from './urielements.service';
import { Session, DiagnoserDefinition } from '../models/daas';

@Injectable()
export class DaasService {

    public currentSite: SiteDaasInfo;

    constructor(private _armClient: ArmService, private _authService: AuthService, private _http: Http, private _uriElementsService: UriElementsService) {
    }

    getDaasSessions(site: SiteDaasInfo): Observable<Session[]> {
        let resourceUri: string = this._uriElementsService.getAllDiagnosticsSessionsUrl(site);
        return <Observable<Session[]>>(this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri, null, true));
    }

    submitDaasSession(site: SiteDaasInfo, diagnoser: string, Instances: string[]): Observable<string> {

        let session = new Session();
        session.CollectLogsOnly = false;
        session.StartTime = "";
        session.RunLive = true;
        session.Instances = Instances;
        session.Diagnosers = [];
        session.Diagnosers.push(diagnoser);
        session.TimeSpan = "00:02:00";

        let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsUrl(site);
        return <Observable<string>>(this._armClient.postResource(resourceUri, session, null, true));
    }
    getDaasSessionsWithDetails(site: SiteDaasInfo): Observable<Session[]> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsSessionsDetailsUrl(site, "all", true);
        return <Observable<Session[]>>this._armClient.getResourceWithoutEnvelope<Session[]>(resourceUri, null, true);
    }

    getDaasSessionWithDetails(site: SiteDaasInfo, sessionId: string): Observable<Session> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsSingleSessionUrl(site, sessionId, true);
        return <Observable<Session>>this._armClient.getResourceWithoutEnvelope<Session>(resourceUri, null, true);
    }

    getInstances(site: SiteDaasInfo): Observable<string[]> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsInstancesUrl(site);
        return <Observable<string[]>>this._armClient.getResourceWithoutEnvelope<string[]>(resourceUri, null, true);
    }

    getDiagnosers(site: SiteDaasInfo): Observable<DiagnoserDefinition[]> {
        let resourceUri: string = this._uriElementsService.getDiagnosticsDiagnosersUrl(site);
        return <Observable<DiagnoserDefinition[]>>this._armClient.getResourceWithoutEnvelope<DiagnoserDefinition[]>(resourceUri, null, true);
    }
}