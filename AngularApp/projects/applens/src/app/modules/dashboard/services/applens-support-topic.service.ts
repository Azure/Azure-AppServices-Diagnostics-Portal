import { Injectable } from '@angular/core';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';
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
            keyWords: ["creat", "develop", "development", "add"],
            path: "assets/img/SupportTopicImages/create.png",
        },
        {
            keyWords: ["troubleshoot", "diagnos", "solv"],
            path: "assets/img/SupportTopicImages/troubleshoot.png",
        },
        {
            keyWords: ["configur", "manag", "setting"],
            path: "assets/img/SupportTopicImages/configure.png",
        },
        {
            keyWords: ["storage", "volume"],
            path: "assets/img/SupportTopicImages/storage.png",
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

    public getSupportTopics(): Observable<any> {
        let pesId = this._resourceService.pesId;
        return this._diagnosticApiService.getSupportTopics(pesId);
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
        let pesId = this._resourceService.pesId;
        let requestBody = this._resourceService.getRequestBody();
        if (pesId === '14748') {
            if (requestBody.Kind === "functionapp") {
                selfHelpPath = "microsoft.function";
            }
        }
        return selfHelpPath;
    }


    getPathForSupportTopic(supportTopicId: string, pesId: string): Observable<string> {
        return this._diagnosticApiService.getDetectors().pipe(map(detectors => {
            let detectorPath = '';

            if (detectors) {
                const matchingDetector = detectors.find(detector =>
                    detector.supportTopicList &&
                    detector.supportTopicList.findIndex(supportTopic => supportTopic.id === supportTopicId) >= 0);

                if (matchingDetector) {
                    detectorPath = `/detectors/${matchingDetector.id}`;
                }
            }
            return detectorPath;
        }));
    }
}
