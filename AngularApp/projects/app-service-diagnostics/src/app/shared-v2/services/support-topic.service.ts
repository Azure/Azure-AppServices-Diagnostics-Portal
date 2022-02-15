
import { of as observableOf, Observable, of } from 'rxjs';
import { map, flatMap, catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DiagnosticService, DetectorMetaData, DetectorType, RenderingType, KeystoneInsight, TelemetryService } from 'diagnostic-data';
import * as momentNs from 'moment';
import { ResourceService } from './resource.service';
import { AuthService } from '../../startup/services/auth.service';

const moment = momentNs;

@Injectable()
export class SupportTopicService {

    protected detectorTask: Observable<DetectorMetaData[]>;
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

    private solutionOrchestratorConfig = {
        "14748": ["32629421"]
    };

    constructor(protected _http: HttpClient, protected _authService: AuthService, protected _diagnosticService: DiagnosticService, protected _resourceService: ResourceService, protected _telemetryService: TelemetryService) {
    }

    public getSelfHelpContentDocument(): Observable<any> {
        if (this.pesId && this.pesId.length > 0 && this.supportTopicId && this.supportTopicId.length > 0) {
            return this._authService.getStartupInfo().pipe(flatMap(res => {
                var selfHelpContentForSupportTopicUrl = this.selfHelpContentUrl + "&productId=" + encodeURIComponent(this.pesId) + "&topicId=" + encodeURIComponent(this.supportTopicId);
                const headers = new HttpHeaders({
                    'Authorization': `Bearer ${res.token}`
                });

                return this._http.get(selfHelpContentForSupportTopicUrl, {
                    headers: headers
                });
            }));
        }
        return observableOf(null);
    }


    getPathForSupportTopic(supportTopicId: string, pesId: string, searchTerm: string, sapSupportTopicId: string = "", sapProductId: string = ""): Observable<any> {

        this.supportTopicId = supportTopicId;
        this.sapSupportTopicId = sapSupportTopicId;
        this.sapProductId = sapProductId;
        return this._resourceService.getPesId().pipe(flatMap(pesId => {
            const redirectFrom = "supportTopic";
            var supportTopic:string = null;
            // Web App (Linux)\Networking\Configuring VNET integration with App Service: supportTopicId == "32542212" , sapSupportTopicId == "e46a61a3-caeb-38aa-89ea-f851e9d63652"
            // Web App (Windows)\Networking\Configuring VNET integration with App Service:  supportTopicId == "32542212" , sapSupportTopicId == "f9793673-0fe9-0109-52fa-8b166b645087"
            // Web App for Containers\Networking\Configuring VNET integration with App Service: supportTopicId == "32542212", sapSupportTopicId == "2b508ce1-e160-1a35-6355-71172d0af5b0"
            // Function App\Networking\Configuring VNET integration with Functions:  supportTopicId == "32630473", sapSupportTopicId == "2f550394-351c-4add-5807-eba6428dac71"
            if (supportTopicId == "32542212" || sapSupportTopicId == "e46a61a3-caeb-38aa-89ea-f851e9d63652" ||  sapSupportTopicId == "f9793673-0fe9-0109-52fa-8b166b645087" || sapSupportTopicId == "2b508ce1-e160-1a35-6355-71172d0af5b0"
            || supportTopicId == "32630473" || sapSupportTopicId == "2f550394-351c-4add-5807-eba6428dac71") {
                // WebApp/VNET integration with App Service or FunctionApp/Configuring VNET integration with AppService
                supportTopic = "VNet Integration";
                return observableOf({ path: 'tools/networkchecks', queryParams: { redirectFrom, supportTopic } });
            } else if (supportTopicId == "32820919" || sapSupportTopicId == "6baa322b-ef6b-f235-c0c0-82ff512602c4" || sapSupportTopicId == "1653e0e2-8249-fb67-6d0e-767fa14d79b2" || sapSupportTopicId == "bafd9de9-bbe7-5366-efbd-3e845db6e1ae"
            || supportTopicId == "32820562" || sapSupportTopicId == "8856038e-a071-236e-9823-41313ee4cb85") {
                // WebApp/Outbound Connectivity or FunctionApp/Outbound Connectivity
                supportTopic = "Outbound Connectivity";
                var kind = this._resourceService.resource.kind;
                if (kind.includes("container")) {
                    // container based App is not supported yet
                } else {
                    // non-container webapp/function app
                    return observableOf({ path: 'tools/networkchecks', queryParams: { redirectFrom, supportTopic } });
                }
            }

            this.pesId = pesId;
            this.detectorTask = this._diagnosticService.getDetectors();
            return this.detectorTask.pipe(flatMap(detectors => {
                let detectorPath = '';
                let queryParamsDic = { "searchTerm": searchTerm };

                if (detectors) {
                    var matchingDetector = null;
                    if (sapSupportTopicId != "")
                    {
                        matchingDetector = detectors.find(detector =>
                            detector.supportTopicList &&
                            detector.supportTopicList.findIndex(supportTopic => supportTopic.sapSupportTopicId === sapSupportTopicId) >= 0);

                        this._telemetryService.logEvent("GetDetectorWithSuppotTopic", {
                            "UseSapId": "1",
                            "SapSupportTopicId": sapSupportTopicId,
                            "SupportTopicId": supportTopicId,
                            "PesId": pesId,
                            "SapProductId": sapProductId,
                            "CaseSubject": searchTerm
                        });
                    }

                    if (matchingDetector == null){
                        matchingDetector = detectors.find(detector =>
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

                    if (matchingDetector) {
                        if (matchingDetector.type === DetectorType.Analysis) {
                            detectorPath = `/analysis/${matchingDetector.id}`;
                        } else {
                            detectorPath = `/detectors/${matchingDetector.id}`;
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

                                if (keywordsList && keywordsList.findIndex((keyword) => searchTerm.toLowerCase().indexOf(keyword) !== -1) !== -1) {
                                    queryParamsDic["keystoneDetectorId"] = keystoneDetectorId;
                                    keystoneSolutionApplied = true;
                                }

                                this._telemetryService.logEvent("KeywordsListForKeyStone", {
                                    "Keywords": keystoneInsight["Title"],
                                    "KeystoneSolutionApplied": String(keystoneSolutionApplied)
                                });
                            }

                            return { path: detectorPath, queryParams: queryParamsDic };
                        }),
                            catchError(err => {
                                // If there is an error getting keystone detector, render the matched dector without key stone solution
                                this._telemetryService.logEvent("KeystoneLoadingFailed", {
                                    "details": JSON.stringify(err)
                                });

                                return observableOf({ path: detectorPath, queryParams: queryParamsDic });
                            }))
                    }

                    return observableOf({ path: detectorPath, queryParams: queryParamsDic });
                }))
            }));
        }));
    }
}
