
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
    private supportTopicConfig = {
        "14748": ["32444077", "32444080", "32444081", "32444082", "32444083", "32444084", "32550703", "32581614", "32542209", "32629421", "32581628", "32542213", "32581612", "32581611", "32608648", "32748875", "32581617", "32784809", "32581620"],
        "16170": ["32748875", "32581620", "32588770", "32581617", "32542209", "32581614", "32581628", "32588771", "32629421", "32542213", "32588773", "32608648", "32444081", "32444082", "32444083", "32444084", "32568904", "32444080"],
        "16072": ["32518046", "32518048", "32518049", "32630465", "32598329", "32630473"],
        "15791": ["32742513", "32742533", "32742541", "32742544", "32742497", "32742498", "32742516", "32742517", "32742559", "32742560", "32742556", "32742557", "32742492", "32742493", "32742496", "32742511", "32742530", "32742531", "32742554", "32742561", "32742562", "32742495", "32742514", "32742525", "32742537", "32742558", "32742539", "32742540", "32745577", "32742512", "32758024", "32742499", "32742509", "32742500", "32742505", "32748899", "32742520", "32742522", "32742524", "32742545", "32742538", "32742504"],
        "15551": ["32632390", "32632389", "32632430", "32632396", "32632397", "32632401", "32632431", "32632436", "32632434", "32632406", "32632389", "32632390", "32632430", "32632393", "32632398", "32632403", "32632409", "32632413", "32632414", "32632415", "32632385", "32632418", "32632419", "32632422", "32632424", "32632438", "32632399", "32632408", "32632421", "32632426", "32632405", "32683732", "32632427", "32632386", "32632387", "32632388", "32632395", "32632404", "32632416", "32632402", "32632420", "32632425", "32632428", "32632432", "32632437", "32632407", "32740235", "32740236", "32740237", "32740238", "32740239", "32740240", "32740234"]
    };

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
        "14748": ["32629421"]
    };

    constructor(protected _http: HttpClient, protected _authService: AuthService, protected _diagnosticService: DiagnosticService, protected _resourceService: ResourceService, protected _telemetryService: TelemetryService, protected _armService: ArmService) {
    }

    private cleanSelfHelpContentApollo(selfHelpResponse) {
        let docContent = selfHelpResponse.properties.content;
        let result = cleanApolloSolutions(docContent);
        return result;
    }

    private getSelfHelpContentApollo(): Observable<any> {
        if (this.pesId && this.pesId.length > 0 && this.sapSupportTopicId && this.sapSupportTopicId.length > 0) {

            // To generate a unique apollo search Id, we use resource name, current timestamp and a guid.
            let apolloResourceId = `${this._resourceService.resource.name}-${Math.floor(Date.now() / 1000)}-${uuid()}`;
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
                        "LegacyTopicId": this.supportTopicId
                    }
                }
            };
            let resourceUri = `${this._resourceService.resource.id}/${this.apolloApiConfig.apolloResourceProvider}/${apolloResourceId}`;
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

    private cleanSelfHelpContentLegacy(selfHelpResponse) {
        if (selfHelpResponse && selfHelpResponse.length > 0) {
            var htmlContent = selfHelpResponse[0]["htmlContent"];
            // Custom javascript code to remove top header from support document html string
            var tmp = document.createElement("DIV");
            tmp.innerHTML = htmlContent;
            var h2s = tmp.getElementsByTagName("h2");
            if (h2s && h2s.length > 0) {
                h2s[0].remove();
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
            this.detectorTask = this._diagnosticService.getDetectors();
            return this.detectorTask.pipe(flatMap(detectors => {
                let detectorPath = '';
                let queryParamsDic = { "searchTerm": searchTerm };

                if (detectors) {

                    var matchingDetectors = [];
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
                        if (matchingDetectors.length === 1 && matchingDetectors[0] && matchingDetectors[0].id) {
                            if (matchingDetectors[0].type === DetectorType.Analysis) {
                                detectorPath = `/analysis/${matchingDetectors[0].id}`;
                            } else {
                                detectorPath = `/detectors/${matchingDetectors[0].id}`;
                            }
                        }
                        else {
                            if ((this._resourceService.subscriptionId == "c258f9c0-3d64-4761-8697-cab631f28422")
                                && this.solutionOrchestratorConfig && this.solutionOrchestratorConfig[this.pesId]
                                && this.solutionOrchestratorConfig[this.pesId].length > 0 && this.solutionOrchestratorConfig[this.pesId].findIndex(s => s == this.supportTopicId) >= 0) {
                                detectorPath = `solutionorchestrator`;
                                return observableOf({ path: detectorPath, queryParams: queryParamsDic });
                            }
                            else {
                                detectorPath = `/analysis/supportTopicAnalysis/dynamic`;
                            }
                        }
                    }
                    else {
                        if ((this._resourceService.subscriptionId == "c258f9c0-3d64-4761-8697-cab631f28422")
                            && this.solutionOrchestratorConfig && this.solutionOrchestratorConfig[this.pesId]
                            && this.solutionOrchestratorConfig[this.pesId].length > 0 && this.solutionOrchestratorConfig[this.pesId].findIndex(s => s == this.supportTopicId) >= 0) {
                            detectorPath = `solutionorchestrator`;
                            return observableOf({ path: detectorPath, queryParams: queryParamsDic });
                        }
                        else {
                            detectorPath = `/analysis/searchResultsAnalysis/search`;
                        }
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
                                    "KeystoneSolutionApplied": String(keystoneSolutionApplied)
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