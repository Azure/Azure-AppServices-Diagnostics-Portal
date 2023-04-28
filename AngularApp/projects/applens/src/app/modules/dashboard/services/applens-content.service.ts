import { Injectable } from '@angular/core';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { Observable, of, Subject, ReplaySubject } from 'rxjs';
import 'rxjs/add/observable/of';
import { HttpClient } from '@angular/common/http';
import { mergeMap } from 'rxjs/operators';
import { ResourceService } from '../../../shared/services/resource.service';
import {globalExcludedSites} from "diagnostic-data";

@Injectable()
export class ApplensContentService {
    content: any[] = [
        // {
        //   title: 'Tutorial: Bind an existing custom SSL certificate to Azure Web Apps',
        //   description: 'Azure Web Apps provides a highly scalable, self-patching web hosting service. This tutorial shows you how to bind a custom SSL certificate that you purchased from a trusted certificate authority to Azure Web Apps. When you\'re finished, you\'ll be able to access your web app at the HTTPS endpoint of your custom DNS domain.',
        //   link: 'https://docs.microsoft.com/en-us/azure/app-service/app-service-web-tutorial-custom-ssl'
        // },
        // {
        //   title: 'Buy and Configure an SSL Certificate for your Azure App Service',
        //   description: 'This tutorial shows you how to secure your web app by purchasing an SSL certificate for your Azure App Service, securely storing it in Azure Key Vault, and associating it with a custom domain.',
        //   link: 'https://docs.microsoft.com/en-us/azure/app-service/web-sites-purchase-ssl-web-site'
        // }
      ];

    constructor(private _http: HttpClient, private _backendApi: DiagnosticApiService, private _resourceService: ResourceService,) { 
    }

    public getContent(searchString?: string): Observable<any[]> {
        const searchResults = searchString ? this.content.filter(article => {
            return article.title.indexOf(searchString) != -1
            || article.description.indexOf(searchString) != -1;
        }) : this.content;

        return of(searchResults);
    }

    public searchWeb(questionString: string, resultsCount: string = '3', useStack: boolean = true, preferredSites: string[] = [], excludedSites: string[] = globalExcludedSites): Observable<any> {

        const searchSuffix = this._resourceService.searchSuffix;
        var preferredSitesSuffix = preferredSites.map(site => `site:${site}`).join(" OR ");
        if (preferredSitesSuffix && preferredSitesSuffix.length>0){
            preferredSitesSuffix = ` AND (${preferredSitesSuffix})`;
        }

        var excludedSitesSuffix = excludedSites.map(site => `NOT (site:${site})`).join(" AND ");
        if (excludedSitesSuffix && excludedSitesSuffix.length>0){
            excludedSitesSuffix = ` AND (${excludedSitesSuffix})`;
        }

        const query = encodeURIComponent(`${questionString} AND ${searchSuffix}${preferredSitesSuffix}${excludedSitesSuffix}`);
        return this._backendApi.get<string>(`api/bing/search?q=${query}&count=${resultsCount}`);
    }
}
