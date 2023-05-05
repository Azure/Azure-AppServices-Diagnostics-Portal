import { Injectable } from '@angular/core';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { DetectorMetaData, DetectorType, SupportTopic } from 'diagnostic-data';
import { ApplensDiagnosticService } from './applens-diagnostic.service';
import { CacheService } from '../../../shared/services/cache.service';
import { HttpClient } from '@angular/common/http';
import { catchError, mergeMap, map } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';
import { HttpMethod } from '../../../shared/models/http';


@Injectable()
export class ApplensSupportTopicService {
    private categoryKeywordsImagePathMapping = [
        {
            keyWords: ["scal"],
            path: "assets/img/SupportTopicImages/scale.png",
        },
        {
            keyWords: ["ip"],
            path: "assets/img/SupportTopicImages/ip.png",
        },
        {
            keyWords: ["code", "edit", "debug"],
            path: "assets/img/SupportTopicImages/code.png",
        },
        {
            keyWords: ["swap", "slot", "migrat", "mov"],
            path: "assets/img/SupportTopicImages/slot.png",
        },
        {
            keyWords: ["identity"],
            path: "assets/img/SupportTopicImages/identity.png",
        },
        {
            keyWords: ["best", "practice"],
            path: "assets/img/SupportTopicImages/best.png",
        },
        {
            keyWords: ["backup", "back up"],
            path: "assets/img/SupportTopicImages/backup.png",
        },
        {
            keyWords: ["health"],
            path: "assets/img/SupportTopicImages/health.png",
        },
        {
            keyWords: ["durable"],
            path: "assets/img/SupportTopicImages/durable.png",
        },
        {
            keyWords: ["problem"],
            path: "assets/img/SupportTopicImages/problem.png",
        },
        {
            keyWords: ["oss"],
            path: "assets/img/SupportTopicImages/oss.png",
        },
        {
            keyWords: ["down", "fail", "crash", "stop"],
            path: "assets/img/SupportTopicImages/fail.png",
        },
        {
            keyWords: ["availability"],
            path: "assets/img/SupportTopicImages/availability.png",
        },
        {
            keyWords: ["performance", "slow"],
            path: "assets/img/SupportTopicImages/performance.png",
        },
        {
            keyWords: ["ssl", "cert"],
            path: "assets/img/SupportTopicImages/ssl.png",
        },
        {
            keyWords: ["domain"],
            path: "assets/img/SupportTopicImages/domain.png",
        },
        {
            keyWords: ["authentication", "authenticate", "authorization"],
            path: "assets/img/SupportTopicImages/authentication.png",
        },
        {
            keyWords: ["deploy", "deployment"],
            path: "assets/img/SupportTopicImages/deploy.png",
        },
        {
            keyWords: ["connect"],
            path: "assets/img/SupportTopicImages/connect.png",
        },
        {
            keyWords: ["traffic"],
            path: "assets/img/SupportTopicImages/traffic.png",
        },
        {
            keyWords: ["monitor", "metrics"],
            path: "assets/img/SupportTopicImages/monitoring.png",
        },
        {
            keyWords: ["how", "information"],
            path: "assets/img/SupportTopicImages/how.png",
        },
        {
            keyWords: ["problem"],
            path: "assets/img/SupportTopicImages/problem.png",
        },
        {
            keyWords: ["vnet", "network", "connection"],
            path: "assets/img/SupportTopicImages/network.png",
        },
        {
            keyWords: ["dns"],
            path: "assets/img/SupportTopicImages/dns.png",
        },
        {
            keyWords: ["troubleshoot", "diagnos", "solv"],
            path: "assets/img/SupportTopicImages/troubleshoot.png",
        },
        {
            keyWords: ["api"],
            path: "assets/img/SupportTopicImages/api.png",
        },
        {
            keyWords: ["trigger", "bind"],
            path: "assets/img/SupportTopicImages/trigger.png",
        },
        {
            keyWords: ["portal"],
            path: "assets/img/SupportTopicImages/portal.png"
        },
        {
            keyWords: ["storage", "volume"],
            path: "assets/img/SupportTopicImages/storage.png"
        },
        {
            keyWords: ["manag", "setting"],
            path: "assets/img/SupportTopicImages/configure.png",
        },
        {
            keyWords: ["configur"],
            path: "assets/img/SupportTopicImages/configure.png",
        },
        {
            keyWords: ["creat", "develop", "development", "add"],
            path: "assets/img/SupportTopicImages/create.png",
        },
        {
            keyWords: ["application insight", "ai", "app insight"],
            path: "assets/img/SupportTopicImages/appinsight.png",
        },
        {
            keyWords: ["function", "adding functions"],
            path: "assets/img/SupportTopicImages/function.png",
        }
    ]

    protected detectorTask: Observable<DetectorMetaData[]>;

    constructor(private _diagnosticApiService: ApplensDiagnosticService, private _resourceService: ResourceService, private _http: HttpClient, private _cacheService: CacheService) {
    }

    public supportTopicId: string;
    public sapSupportTopicId: string;
    public pesId: string;

    public getSupportTopics(): Observable<any> {
        this.pesId = this._resourceService.pesId;
        return this._diagnosticApiService.getSupportTopics(this.pesId);
    }

    getCategoryImagePath(supportTopicL2Name: string): string {
        let imagePath = "";

        let item = this.categoryKeywordsImagePathMapping.find((item) => {
            if (supportTopicL2Name)
                return item.keyWords.findIndex((keyword) => {
                    return supportTopicL2Name.toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
                }) !== -1;
        });

        if (item != undefined) {
            imagePath = item.path;
        }
        return imagePath;
    }

    getCategoryImage(supportTopicL2Name: string, useCache: boolean = true, invalidateCache: boolean = false): Observable<any> {

        let imagePath = this.getCategoryImagePath(supportTopicL2Name);

        if (imagePath !== "") {
            let request = this._http.get(imagePath, { observe: 'response', responseType: 'blob' }).pipe(
                mergeMap(response => {
                    return of(imagePath);
                }),
                catchError(error => {
                    return of(``);
                })
            );

            return useCache ? this._cacheService.get(this.getCacheKey(HttpMethod.POST, imagePath), request, invalidateCache) : request;
        }
        else {
            return of(``);
        }
    }



    public getCacheKey(method: HttpMethod, path: string) {
        return `${HttpMethod[method]}-${path}`;
    }

    public getSelfHelpPath(): string {
        let selfHelpPath = this._resourceService.staticSelfHelpContent;
        this.pesId = this._resourceService.pesId;
        let resource = this._resourceService.getResourceByObserver();
        if (this.pesId === '14748') {
            if (resource.Kind === "functionapp") {
                selfHelpPath = "microsoft.function";
            }
        }
        return selfHelpPath;
    }

    getSelfHelpContentDocument(): Observable<any> {
        return of(null);
    }

    public getMatchingDetectors(): Observable<any[]> {
        if (this.supportTopicId || this.sapSupportTopicId) {
            return this._diagnosticApiService.getDetectors().pipe(map(detectors => {
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

    getPathForSupportTopic(supportTopicId: string, pesId: string, searchTerm: string, sapSupportTopicId: string = "", sapProductId: string = ""): Observable<string> {
        this.supportTopicId = supportTopicId;
        this.sapSupportTopicId = sapSupportTopicId;
        return this._diagnosticApiService.getDetectors().pipe(map(detectors => {
            let detectorPath = '';

            if (detectors) {
                var matchingDetectors: DetectorMetaData[] = [];
                if (sapSupportTopicId != "") {
                    matchingDetectors = detectors.filter(detector =>
                        detector.supportTopicList &&
                        detector.supportTopicList.findIndex(supportTopic => supportTopic.sapSupportTopicId === sapSupportTopicId || supportTopic.id === supportTopicId) >= 0);
                }

                if (matchingDetectors) {
                    if (matchingDetectors.length == 1 && matchingDetectors[0] && matchingDetectors[0].id) {
                        if (matchingDetectors[0].type == DetectorType.Analysis) {
                            detectorPath = `/analysis/${matchingDetectors[0].id}`;
                        } else if (matchingDetectors[0].type == DetectorType.Detector){
                            detectorPath = `/detectors/${matchingDetectors[0].id}`;
                        } else if (matchingDetectors[0].type == DetectorType.Workflow){
                            detectorPath = `/workflows/${matchingDetectors[0].id}`;
                        }
                    }
                }
            }
            return detectorPath;
        }));
    }
}