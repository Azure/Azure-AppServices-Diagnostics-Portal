import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import {
  DataTableResponseColumn,
  DataTableResponseObject
} from 'diagnostic-data';
import { ResourceService } from '../../../shared/services/resource.service';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';

@Component({
  selector: 'user-active-pullrequests',
  templateUrl: './user-active-pullrequests.component.html',
  styleUrls: [
    './user-active-pullrequests.component.scss',
    '../category-page/category-page.component.scss'
  ]
})
export class UserActivePullrequestsComponent implements OnInit {
  userId: string = '';
  pullRequests: [];
  table: DataTableResponseObject = null;
  errorMessage: string = '';
  resourceId: string = '';
  constructor(
    private _diagnosticApiService: ApplensDiagnosticService,
    private resourceService: ResourceService,
    private _adalService: AdalService,
    private router: Router
  ) {}

  ngOnInit() {
    this.resourceId = this._diagnosticApiService.resourceId;
    let alias =
      Object.keys(this._adalService.userInfo.profile).length > 0
        ? this._adalService.userInfo.profile.upn
        : '';
    this.userId = alias.replace('@microsoft.com', '');
    this._diagnosticApiService
      .getDevopsPullRequest(
        `${this.resourceService.ArmResource.provider}/${this.resourceService.ArmResource.resourceTypeName}`
      )
      .subscribe(
        (pullRequestResponse) => {
          this.pullRequests = pullRequestResponse;
          this.table = this.createTable(this.pullRequests);
          this.errorMessage = '';
        },
        (error) => {
          this.errorMessage =
            'Unable to fetch active pull requests. Please retry after sometime';
        }
      );
  }

  private createTable(pullrequests: []) {
    const columns: DataTableResponseColumn[] = [
      { columnName: 'Pull Request Link' },
      { columnName: 'Source Branch' }
    ];
    let rows: any[][] = [];
    pullrequests.forEach((element) => {
      let sourceBranch: string = element['sourceRefName'];
      let sourceBranchTrim = sourceBranch.replace('refs/heads/', '');
      let title: string = element['title'];
      let link: string = element['remoteUrl'];
      // Note: this logic will work for branches created with following pattern : dev/<user_alias>/<entitytype>/<entityid>, eg: dev/microsoftalias/detector/mydetector or dev/microsoftalias/gist/mygist
      let branchUserName = sourceBranchTrim.startsWith('dev/')
        ? sourceBranchTrim.split('/')[1]
        : sourceBranchTrim;
      if (
        branchUserName.toLocaleLowerCase() == this.userId.toLocaleLowerCase() &&
        title != undefined &&
        title != '' &&
        link != undefined &&
        link != ''
      ) {
        let rowElement = `<markdown><a href="${link}" target="_blank">${title}</a></markdown>`;
        sourceBranch = sourceBranch.replace('refs/heads/', '');
        let entityid = sourceBranchTrim.split('/')[3];
        let entityType = sourceBranchTrim.split('/')[2];
        let path =
          entityType.toLocaleLowerCase() == 'gist'
            ? `${this.resourceId}/gists/${entityid}?branchInput=${sourceBranch}`
            : `${this.resourceId}/detectors/${entityid}/edit?branchInput=${sourceBranch}`;
        let sourceClickContent = `<p> ${sourceBranch}  <a href="${path}" target="_blank">(Click here to edit in AppLens) </a></p>`;
        rows.push([rowElement, sourceClickContent]);
      }
    });

    const dataTableObject: DataTableResponseObject = {
      columns: columns,
      rows: rows
    };
    return dataTableObject;
  }
}
