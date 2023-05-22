import { Injectable, isDevMode } from '@angular/core';
import { StartupInfo } from '../../models/portal';
import { CommonLogEventType } from './events.enumerations';
import { SiteExtensions, OperatingSystem, Site } from '../../models/site';
import { IDiagnosticProperties } from '../../models/diagnosticproperties';
import { ResponseMessageEnvelope } from '../../models/responsemessageenvelope';
import { AuthService } from '../../../startup/services/auth.service';
import { ArmService } from '../arm.service';
import { IncidentNotification, IncidentType, IncidentStatus } from '../../models/icm-incident';
import { PortalService } from '../../../startup/services/portal.service';
import { Observable, forkJoin } from 'rxjs';
import { VersioningHelper } from '../../utilities/versioningHelper';
import { UriUtilities } from 'diagnostic-data';

@Injectable()
export class LoggingService {

    private _startUpInfo: StartupInfo;
    private _subscriptionId: string = '';
    private _resourceGroup: string = '';
    private _resourceName: string = '';
    private _resourceType: string = '';
    private _ticketBladeWorkflowId: string = '';
    private _supportTopicId: string = '';
    private _sapSupportTopicId: string = '';
    private _appType: string = '';
    private _source: string = '';
    private _diagnosticsVersion: string = '';

    public platform: string = '';
    public appStackInfo: string = '';

    constructor(private _portalServiceInstance: PortalService, private _authServiceInstance: AuthService, private _armServiceInstance: ArmService) {
        this._authServiceInstance.getStartupInfo().subscribe(data => {

            this._startUpInfo = data;

            if (this._startUpInfo && this._startUpInfo.resourceId) {
                const parts = this._startUpInfo.resourceId.toLowerCase().split('/');

                const subscriptionIndex = parts.indexOf('subscriptions');
                this._subscriptionId = subscriptionIndex !== -1 ? parts[subscriptionIndex + 1] : '';

                const resourceGroupIndex = parts.indexOf('resourcegroups');
                this._resourceGroup = resourceGroupIndex !== -1 ? parts[resourceGroupIndex + 1] : '';

                const siteIndex = parts.indexOf('sites');
                const hostingEnvironmentIndex = parts.indexOf('hostingenvironments');
                const resourceIndex = parts.indexOf('resourcename');
                this._resourceName = resourceIndex !== -1 ? parts[resourceIndex + 1] : siteIndex !== -1 ? parts[siteIndex + 1] : hostingEnvironmentIndex !== -1 ? parts[hostingEnvironmentIndex + 1] : '';

                const providerIndex = parts.indexOf('providers');
                this._resourceType = providerIndex !== -1 ? parts[providerIndex + 1] + '/' + parts[providerIndex + 2] : '';

                if (this._startUpInfo.workflowId) {
                    this._ticketBladeWorkflowId = this._startUpInfo.workflowId;
                    this._diagnosticsVersion =  VersioningHelper.isV2Subscription(this._subscriptionId) ? "v2" : "v1" ;
                }

                if (this._startUpInfo.supportTopicId) {
                    this._supportTopicId = this._startUpInfo.supportTopicId;
                }

                if (this._startUpInfo.sapSupportTopicId) {
                    this._sapSupportTopicId = this._startUpInfo.sapSupportTopicId;
                }

                if (this._startUpInfo.source) {
                    this._source = this._startUpInfo.source;
                }

                if (siteIndex !== -1) {
                    if(UriUtilities.isNoResourceCall(this._startUpInfo.resourceId)) {
                        this.appStackInfo = 'Others';
                        this.platform = 'windows';
                        this._appType = 'webapp';
                        this.LogStartUpInfo(this._startUpInfo);
                    }
                    else {
                        const siteSpecificDataRequests = forkJoin(
                            this._armServiceInstance.getResource<IDiagnosticProperties>(this._startUpInfo.resourceId + '/diagnostics/properties'),
                            this._armServiceInstance.getResource<Site>(this._startUpInfo.resourceId)
                        );
    
                        siteSpecificDataRequests.subscribe(partialObserver => {
                            const propertiesEnvelope: ResponseMessageEnvelope<IDiagnosticProperties> = <ResponseMessageEnvelope<IDiagnosticProperties>>partialObserver[0];
                            const resourceEnvelope: ResponseMessageEnvelope<Site> = <ResponseMessageEnvelope<Site>>partialObserver[0];
    
                            if (propertiesEnvelope && propertiesEnvelope.properties) {
                                this.appStackInfo = propertiesEnvelope.properties.appStack;
                            }
    
                            if (resourceEnvelope && resourceEnvelope.properties) {
                                this.platform = SiteExtensions.operatingSystem(resourceEnvelope.properties) === OperatingSystem.windows ? 'windows' : 'linux';
                                this._appType = resourceEnvelope.properties.kind && resourceEnvelope.properties.kind.toLowerCase().indexOf('functionapp') >= 0 ? 'functionapp' : 'webapp';
                            }
    
                            this.LogStartUpInfo(this._startUpInfo);
                        });
                    }                    

                } else {
                    this.LogStartUpInfo(this._startUpInfo);
                }
            }
        });
    }

    protected _log(id: string, category: string, args: any = null): void {

        const commonArgs = {
            ticketBladeWorkflowId: this._ticketBladeWorkflowId,
            subscriptionId: this._subscriptionId,
            resourceGroup: this._resourceGroup,
            resourceType: this._resourceType,
            resourceName: this._resourceName,
            appStack: this.appStackInfo,
            platform: this.platform,
            appType: this._appType,
            supportTopicId: this._supportTopicId,
            sapSupportTopicId: this._sapSupportTopicId,
            bladeSource: this._source,
            diagnosticsVersion: this._diagnosticsVersion
        };

        const combinedArgs = {};
        Object.keys(commonArgs).forEach((key: string) => combinedArgs[key] = commonArgs[key]);
        if (args) {
            Object.keys(args).forEach((key: string) => combinedArgs[key] = args[key]);
        }

        this._portalServiceInstance.logAction(id, category, combinedArgs);
    }

    LogMessage(message: string, category: string = 'Availability') {
        this._log(CommonLogEventType[CommonLogEventType.Message].toString(), category, { message: message });
    }

    LogError(errorMessage: string, category: string = 'Availability') {
        this._log(CommonLogEventType[CommonLogEventType.Error].toString(), category, { message: errorMessage });
    }

    LogClickEvent(name: string, containerName: string = '', category: string = 'Availability') {
        this._log(CommonLogEventType[CommonLogEventType.Click].toString(), category, {
            name: name,
            containerName: containerName
        });
    }

    LogTabOpened(name: string) {
        this._log(CommonLogEventType[CommonLogEventType.TabOpened].toString(), 'Support Home', {
            name: name
        });
    }

    LogTabClosed(name: string) {
        this._log(CommonLogEventType[CommonLogEventType.TabClosed].toString(), 'Support Home', {
            name: name
        });
    }

    LogStartUpInfo(startupInfo: StartupInfo, category: string = 'Availability') {
        this._log(CommonLogEventType[CommonLogEventType.StartUp].toString(), category, {
            featureUri: startupInfo.featureUri ? startupInfo.featureUri : '',
            sessionId: startupInfo.sessionId ? startupInfo.sessionId : '',
            source: startupInfo.source ? startupInfo.source : '',
            supportTopicId: startupInfo.supportTopicId ? startupInfo.supportTopicId : ''
        });
    }

    LogMissingSolution(solutionId: number, category: string = 'Availability') {
        this._log(CommonLogEventType[CommonLogEventType.MissingSolution], category, {
            solutionId: solutionId.toString()
        });
    }

    LogFeedback(source: string, helpful: boolean, category: string = 'Availability') {
        this._log(CommonLogEventType[CommonLogEventType.Feedback], category, {
            source: source,
            helpful: helpful
        });
    }

    LogFeedbackMessage(source: string, message: string, category: string = 'Availability') {
        this._log(CommonLogEventType[CommonLogEventType.FeedbackMessage], category, {
            source: source,
            message: message
        });
    }

    LogGenieFeedbackMessage(source: string, rating: string, message: string, category: string = 'Availability') {
        this._log(CommonLogEventType[CommonLogEventType.FeedbackMessage], category, {
            source: source,
            rating: rating,
            message: message
        });
    }

    LogIncidentNotification(hasActiveIncident: boolean) {
        this._log(CommonLogEventType[CommonLogEventType.IncidentNotification], 'Incidents', {
            active: hasActiveIncident
        });
    }

    LogIncidentIncidentDetails(incident: IncidentNotification) {
        this._log(CommonLogEventType[CommonLogEventType.IncidentDetails], 'Incidents', {
            type: IncidentType[incident.type],
            startTime: incident.startTime,
            status: IncidentStatus[incident.status],
            message: incident.message
        });
    }

    LogIncidentDismissed(hasActiveIncident: boolean) {
        this._log(CommonLogEventType[CommonLogEventType.IncidentDismissed], 'Incidents', {
            active: hasActiveIncident
        });
    }

    LogAzureCommShown(incidentId: string, incidentTitle: string, commType: string, expanded: boolean, isActive: boolean, lastIncidentUpdate: string) {
        this._log(CommonLogEventType[CommonLogEventType.AzureComm], 'AzureComm', {
            incidentId: incidentId,
            incidentTitle: incidentTitle,
            expandedByDefault: expanded,
            isActive: isActive,
            lastIncidentUpdate: lastIncidentUpdate,
            type: commType
        });
    }
}
