
import { of as observableOf, Observable, of, throwError, noop } from 'rxjs';
import { map, flatMap, catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DiagnosticService, DetectorMetaData, DetectorType, RenderingType, KeystoneInsight, TelemetryService } from 'diagnostic-data';
import * as momentNs from 'moment';
import { ResourceService } from './resource.service';
import { AuthService } from '../../startup/services/auth.service';
import { ArmService } from '../../shared/services/arm.service';
import { v4 as uuid } from 'uuid';
import { ResponseMessageEnvelope } from '../../shared/models/responsemessageenvelope';
import { cleanApolloSolutions } from '../utils/apollo-utils';

const moment = momentNs;

@Injectable()
export class SupportTopicService {

    protected detectorTask: Observable<DetectorMetaData[]>;
    protected apolloApiConfig = {
        apiVersion: '2020-07-01-preview',
        apolloResourceProvider: 'providers/Microsoft.Diagnostics/apollo'
    };
    public supportTopicId: string = "";
    public pesId: string = "";
    public sapSupportTopicId: string = "";
    public sapProductId: string = "";
    private selfHelpContentUrl = "https://mpac.support.ext.azure.com/api/v1/selfHelpArticles?articleTypes=Generic&articleTypes=Resource";
    
    private vnetSupportTopicIds: { name: string, supportTopicId: string, sapSupportTopicId: string }[] = [
        { name: "VNet Integration", supportTopicId: "32542212", sapSupportTopicId: "e46a61a3-caeb-38aa-89ea-f851e9d63652" }, // Web App (Linux)\Networking\Configuring VNET integration with App Service
        { name: "VNet Integration", supportTopicId: "32542212", sapSupportTopicId: "f9793673-0fe9-0109-52fa-8b166b645087" }, // Web App (Windows)\Networking\Configuring VNET integration with App Service
        { name: "VNet Integration", supportTopicId: "32542212", sapSupportTopicId: "2b508ce1-e160-1a35-6355-71172d0af5b0" }, // Web App for Containers\Networking\Configuring VNET integration with App Service
        { name: "VNet Integration", supportTopicId: "32630473", sapSupportTopicId: "2f550394-351c-4add-5807-eba6428dac71" }, // Function App\Networking\Configuring VNET integration with Functions
        { name: "VNet Integration", supportTopicId: "32799806", sapSupportTopicId: "73f8d0d6-2b1c-0fb9-f08e-ce5675ae4e9a" }, // Logic App\Networking\Configuring VNET integration
        { name: "Outbound Connectivity", supportTopicId: "32820919", sapSupportTopicId: "6baa322b-ef6b-f235-c0c0-82ff512602c4" }, // Web App (Linux)\Networking\Outbound Connectivity
        { name: "Outbound Connectivity", supportTopicId: "32820919", sapSupportTopicId: "1653e0e2-8249-fb67-6d0e-767fa14d79b2" }, // Web App (Windows)\Networking\Outbound Connectivity
        { name: "Outbound Connectivity", supportTopicId: "32820919", sapSupportTopicId: "1653e0e2-8249-fb67-6d0e-767fa14d79b2" }, // Web App for Containers\Networking\Outbound Connectivity
        { name: "Outbound Connectivity", supportTopicId: "32820562", sapSupportTopicId: "8856038e-a071-236e-9823-41313ee4cb85" }, // Function App\Networking\Outbound Connectivity
    ];

    private solutionOrchestratorConfig = {
        //Enabling for two support topics called Application Code Deployment/Azure Devops - Deploying Application Code
        products: {
            "14748": [
                {
                    name: "Problems with WebJobs/WebJobs is crashing, failing, or stopping",
                    supportTopicId: "32581611",
                    sapSupportTopicId: "69b53f31-2ff0-8b71-86ae-f2177adf434b"
                },
                {
                    name: "OSS (e.g. WordPress, PHP, NodeJs, Java)/node.js",
                    supportTopicId: "32444082",
                    sapSupportTopicId: "c30b281b-4369-616a-a1c8-aadffbbfd405"
                }
            ]
        }
    };

    constructor(protected _http: HttpClient, protected _authService: AuthService, protected _diagnosticService: DiagnosticService, protected _resourceService: ResourceService, protected _telemetryService: TelemetryService, protected _armService: ArmService) {
    }

    private cleanSelfHelpContentApollo(selfHelpResponse) {
        let docContent = selfHelpResponse.properties.content;
        let result = cleanApolloSolutions(docContent, this.showAllSelfHelpContent());
        return result;
    }

    private getSelfHelpContentApollo(): Observable<any> {
        if (this.pesId && this.pesId.length > 0 && this.sapSupportTopicId && this.sapSupportTopicId.length > 0) {

            // To generate a unique apollo search Id, we use resource name, current timestamp and a guid.
            let apolloResourceId = `${this._resourceService.resource.name}-${Math.floor(Date.now() / 1000)}-${uuid()}`;
            let fullResourceUri = this._resourceService.resource.id;
            let partialResourceUri = `/subscriptions/${fullResourceUri.split("subscriptions/")[1].split("/")[0]}/providers/${fullResourceUri.split("/providers/")[1].split("/")[0]}/${fullResourceUri.split("/providers/")[1].split("/")[1].split("?")[0]}`;
            let requestBody =
            {
                "properties": {
                    "triggerCriteria": [
                        {
                            "name": "SapId",
                            "value": this.sapSupportTopicId
                        }
                    ],
                    "parameters": {
                        "SearchText": "error found",
                        "ProductId": this.pesId,
                        "LegacyTopicId": this.supportTopicId,
                        "PartialResourceUri": partialResourceUri
                    }
                }
            };
            let resourceUri = `/subscriptions/${this._resourceService.subscriptionId}/${this.apolloApiConfig.apolloResourceProvider}/${apolloResourceId}`;
            let apolloHeaders = new Map<string, string>();
            apolloHeaders.set("x-ms-client-agent", "AppServiceDiagnostics");
            return this._armService.putResource(resourceUri, requestBody, this.apolloApiConfig.apiVersion, true, apolloHeaders).pipe(map((response: ResponseMessageEnvelope<any>) => {
                let apolloCleaned = this.cleanSelfHelpContentApollo(response);
                if (apolloCleaned && apolloCleaned.length > 1) {
                    return apolloCleaned;
                }
                else {
                    throw new Error("No meaningful content came from Apollo");
                }
            }));
        }
        return throwError("Cannot get self content from Apollo");
    }

    private showAllSelfHelpContent():boolean {
        let rp =  `${this._resourceService?.resource?.id}`.toLowerCase().split('/providers/')[1].split('/')[0];
        let rpsToShowAllContent = ['microsoft.web', 'microsoft.containerservice', 'microsoft.domainregistration', 'microsoft.certificateregistration', 'microsoft.workflow', 'microsoft.apimanagement', 'microsoft.app', 'microsoft.containerregistry', 'microsoft.containerinstance', 'microsoft.redhatopenshift', 'microsoft.servicefabric'];
        return rpsToShowAllContent.some((rpToShowAllContent) => rp.includes(rpToShowAllContent));
    }

    private cleanSelfHelpContentLegacy(selfHelpResponse) {
        if (selfHelpResponse && selfHelpResponse.length > 0) {
            var htmlContent = selfHelpResponse[0]["htmlContent"];
            // Custom javascript code to remove top header from support document html string
            var tmp = document.createElement("DIV");
            tmp.innerHTML = htmlContent;
            if(!this.showAllSelfHelpContent()) {
                var h2s = tmp.getElementsByTagName("h2");
                if (h2s && h2s.length > 0) {
                    h2s[0].remove();
                }
            }

            return tmp.innerHTML;
        }
    }

    private getSelfHelpContentLegacy(): Observable<any> {
        if (this.pesId && this.pesId.length > 0 && this.supportTopicId && this.supportTopicId.length > 0) {
            return this._authService.getStartupInfo().pipe(flatMap(res => {
                var selfHelpContentForSupportTopicUrl = this.selfHelpContentUrl + "&productId=" + encodeURIComponent(this.pesId) + "&topicId=" + encodeURIComponent(this.supportTopicId);
                const headers = new HttpHeaders({
                    'Authorization': `Bearer ${res.token}`
                });

                return this._http.get(selfHelpContentForSupportTopicUrl, {
                    headers: headers
                }).pipe(map((response) => { return this.cleanSelfHelpContentLegacy(response); }));
            }));
        }
        return observableOf(null);
    }

    public getSelfHelpContentDocument(): Observable<any> {
        //Call Apollo API, if error then fallback on legacy API
        return this.getSelfHelpContentApollo().pipe(map(res => res), catchError(err => {
            return this.getSelfHelpContentLegacy();
        }));
    }

    // This is expected to be called only from case submission detector-list-analysis component when it has already been established (via getPathForSupportTopic method) that more than one detector is mapped to the same support topic.
    // detector-list-analysis component will use this method to identify detectors that should be loaded in the dynamically generated analysis view.
    public getMatchingDetectors(): Observable<any[]> {
        if (this.supportTopicId || this.sapSupportTopicId) {
            return this._diagnosticService.getDetectors().pipe(map(detectors => {
                return detectors.filter(detector =>
                    detector.supportTopicList &&
                    detector.supportTopicList.findIndex(supportTopicId =>
                        supportTopicId.sapSupportTopicId === this.sapSupportTopicId || supportTopicId.id === this.supportTopicId) >= 0);
            }));
        }
        else {
            return Observable.of(null);
        }
    }

    addStartAndEndTimeIfNotPresent(queryParams:any): any {
        let startTime, endTime: momentNs.Moment;
        endTime = moment.utc().subtract(16, 'minutes');
        startTime = endTime.clone().subtract(1, 'days');
        let defaultStartTimeString = startTime.format('YYYY-MM-DD HH:mm');
        let defaultEndTimeString = endTime.format('YYYY-MM-DD HH:mm');

        queryParams = !queryParams? {} : queryParams;

        !queryParams.startTime? queryParams["startTime"] = defaultStartTimeString : noop;
        !queryParams.endTime? queryParams["endTime"] = defaultEndTimeString : noop;

        return queryParams;
    }

    getPathForSupportTopic(supportTopicId: string, pesId: string, searchTerm: string, sapSupportTopicId: string = "", sapProductId: string = ""): Observable<any> {

        this.supportTopicId = supportTopicId;
        this.sapSupportTopicId = sapSupportTopicId;
        this.sapProductId = sapProductId;
        return this._resourceService.getPesId().pipe(flatMap(pesId => {
            const redirectFrom = "supportTopic";
            var networkSupportTopic: string = null;

            for (var i = 0; i < this.vnetSupportTopicIds.length; ++i) {
                if (supportTopicId == this.vnetSupportTopicIds[i].supportTopicId || sapSupportTopicId == this.vnetSupportTopicIds[i].sapSupportTopicId) {
                    networkSupportTopic = this.vnetSupportTopicIds[i].name;
                    break;
                }
            }

            var kind = this._resourceService.resource.kind;
            if (networkSupportTopic != null) {
                if (networkSupportTopic == "Outbound Connectivity" && kind.includes("container")) {
                    // container based App is not supported by "Outbound Connectivity" yet, do nothing
                }
                else {
                    return observableOf({ path: 'tools/networkchecks', queryParams: { redirectFrom, supportTopic: networkSupportTopic, supportTopicId, sapSupportTopicId } });
                }
            }

            this.pesId = pesId;
            let queryParamsDic = { "searchTerm": searchTerm };
            if (this.solutionOrchestratorConfig
                && this.solutionOrchestratorConfig.products[this.pesId]
                && this.solutionOrchestratorConfig.products[this.pesId].length > 0 && this.solutionOrchestratorConfig.products[this.pesId].findIndex(s => s.supportTopicId == this.supportTopicId || s.sapSupportTopicId == this.sapSupportTopicId) >= 0) {
                let detectorPath = `solutionorchestrator`;
                return observableOf({ path: detectorPath, queryParams: queryParamsDic });
            }


            this.detectorTask = this._diagnosticService.getDetectors();
            return this.detectorTask.pipe(flatMap(detectors => {
                let detectorPath = '';
                if (detectors) {

                    var matchingDetectors: DetectorMetaData[] = [];
                    if (sapSupportTopicId != "") {
                        matchingDetectors = detectors.filter(detector =>
                            detector.supportTopicList &&
                            detector.supportTopicList.findIndex(supportTopicId => supportTopicId.sapSupportTopicId === sapSupportTopicId) >= 0);

                        this._telemetryService.logEvent("GetDetectorWithSuppotTopic", {
                            "UseSapId": "1",
                            "SapSupportTopicId": sapSupportTopicId,
                            "SupportTopicId": supportTopicId,
                            "PesId": pesId,
                            "SapProductId": sapProductId,
                            "CaseSubject": searchTerm
                        });
                    }

                    if (matchingDetectors.length < 1) {
                        matchingDetectors = detectors.filter(detector =>
                            detector.supportTopicList &&
                            detector.supportTopicList.findIndex(supportTopic => supportTopic.id === supportTopicId) >= 0);

                        this._telemetryService.logEvent("GetDetectorWithSuppotTopic", {
                            "UseSapId": "0",
                            "SapSupportTopicId": sapSupportTopicId,
                            "SupportTopicId": supportTopicId,
                            "PesId": pesId,
                            "SapProductId": sapProductId,
                            "CaseSubject": searchTerm
                        });
                    }
                    
                    if (matchingDetectors && matchingDetectors.length > 0) {
                        this._telemetryService.logEvent("MatchingDetectorsInCaseSubmission", {
                            "MatchingDetectors": JSON.stringify(matchingDetectors.map(detector => {
                                return { 
                                    id: detector.id, 
                                    type: detector.type
                                };
                            })),
                            "SapSupportTopicId": sapSupportTopicId,
                            "SupportTopicId": supportTopicId,
                            "PesId": pesId,
                            "SapProductId": sapProductId,
                            "CaseSubject": searchTerm
                        });
                        if (matchingDetectors.length === 1 && matchingDetectors[0] && matchingDetectors[0].id) {
                            if (matchingDetectors[0].type === DetectorType.Analysis) {
                                detectorPath = `/analysis/${matchingDetectors[0].id}`;
                            } else if (matchingDetectors[0].type === DetectorType.Detector || matchingDetectors[0].type === DetectorType.CategoryOverview) {
                                detectorPath = `/detectors/${matchingDetectors[0].id}`;
                            } else if (matchingDetectors[0].type === DetectorType.Workflow) {
                                detectorPath = `/workflows/${matchingDetectors[0].id}`;
                            }
                        }
                        else {
                            detectorPath = `/analysis/supportTopicAnalysis/dynamic`;
                        }
                    }
                    else {
                        this._telemetryService.logEvent("MatchingDetectorsInCaseSubmission", {
                            "MatchingDetectors": '[]',
                            "SapSupportTopicId": sapSupportTopicId,
                            "SupportTopicId": supportTopicId,
                            "PesId": pesId,
                            "SapProductId": sapProductId,
                            "CaseSubject": searchTerm
                        });
                        detectorPath = `/analysis/searchResultsAnalysis/search`;
                    }
                }

                let keywordsList = [];
                return this._resourceService.getKeystoneDetectorId().pipe(flatMap(keystoneDetectorId => {
                    detectorPath = `/integratedSolutions` + detectorPath;
                    if (keystoneDetectorId) {
                        let startTime, endTime: momentNs.Moment;
                        endTime = moment.utc().subtract(16, 'minutes');
                        startTime = endTime.clone().subtract(1, 'days');
                        let fakeStartTimeString = startTime.format('YYYY-MM-DD HH:mm');
                        let fakeEndTimeString = endTime.format('YYYY-MM-DD HH:mm');

                        return this._diagnosticService.getDetector(keystoneDetectorId, fakeStartTimeString, fakeEndTimeString, false, false, "&extractKeywords=true").pipe(map(keystoneRes => {
                            if (keystoneRes != undefined) {
                                let keystoneData = keystoneRes.dataset.find((data) => data.renderingProperties.type === RenderingType.KeystoneComponent);
                                let keystoneInsight: KeystoneInsight = JSON.parse(keystoneData.table.rows[0][0]);
                                let keystoneSolutionApplied: boolean = false;
                                keywordsList = JSON.parse(keystoneInsight["Title"]);

                                if (keywordsList && keywordsList.findIndex((keyword) => searchTerm.toLowerCase().indexOf(keyword.toLowerCase()) !== -1) !== -1) {
                                    queryParamsDic["keystoneDetectorId"] = keystoneDetectorId;
                                    keystoneSolutionApplied = true;
                                }

                                this._telemetryService.logEvent("KeywordsListForKeyStone", {
                                    "Keywords": keystoneInsight["Title"],
                                    "KeystoneSolutionApplied": String(keystoneSolutionApplied),
                                    "CaseSubject": searchTerm
                                });
                            }
                            
                            if(detectorPath.indexOf('/analysis/supportTopicAnalysis/dynamic')>-1) {
                                queryParamsDic = this.addStartAndEndTimeIfNotPresent(queryParamsDic);
                            }

                            return { path: detectorPath, queryParams: queryParamsDic };
                        }),
                            catchError(err => {
                                // If there is an error getting keystone detector, render the matched dector without key stone solution
                                this._telemetryService.logEvent("KeystoneLoadingFailed", {
                                    "details": JSON.stringify(err)
                                });

                                if(detectorPath.indexOf('/analysis/supportTopicAnalysis/dynamic')>-1) {
                                    queryParamsDic = this.addStartAndEndTimeIfNotPresent(queryParamsDic);
                                }
                                return observableOf({ path: detectorPath, queryParams: queryParamsDic });
                            }))
                    }

                    if(detectorPath.indexOf('/analysis/supportTopicAnalysis/dynamic')>-1) {
                        queryParamsDic = this.addStartAndEndTimeIfNotPresent(queryParamsDic);
                    }
                    return observableOf({ path: detectorPath, queryParams: queryParamsDic });
                }))
            }));
        }));
    }
}