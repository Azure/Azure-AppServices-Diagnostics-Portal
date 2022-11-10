import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SupportTopicItem, SupportTopicResult } from '../resource-home/resource-home.component';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { MarkdownService } from 'ngx-markdown';
import { Location } from '@angular/common';

@Component({
    selector: 'self-help-content',
    templateUrl: './self-help-content.component.html',
    styleUrls: ['./self-help-content.component.scss']
})
export class SelfHelpContentComponent implements OnInit {
    pesId: string = "";
    supportTopicId: string = "";
    selfHelpPath: string = "microsoft.web";
    selfHelpContent: string = undefined;
    title: string = "";

    constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _http: HttpClient, private _resourceService: ResourceService, private _diagnosticService: ApplensDiagnosticService, private _supportTopicService: ApplensSupportTopicService, private _markdownService: MarkdownService, private _location: Location) { }

    ngOnInit() {
        this.pesId = this._activatedRoute.snapshot.params['pesId'];
        this.supportTopicId = this._activatedRoute.snapshot.params['supportTopicId'];
        this.selfHelpPath = this._supportTopicService.getSelfHelpPath();

        this._diagnosticService.getSelfHelpContent(this.pesId, this.supportTopicId, this.selfHelpPath).subscribe((res: string) => {
            this.selfHelpContent = res == undefined || res === '' ? "No self help documentation is found" : res;
        });
    }

    navigateTo(path: string) {
        let navigationExtras: NavigationExtras = {
            queryParamsHandling: 'preserve',
            preserveFragment: true,
            relativeTo: this._activatedRoute
        };

        this._router.navigate([path], navigationExtras);
    }

    navigateBack() {
        this._location.back();
    }

}
