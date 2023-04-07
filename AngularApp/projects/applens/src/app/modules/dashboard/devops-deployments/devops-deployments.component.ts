import { Component, Input, OnInit } from '@angular/core';
import { DevopsConfig } from '../../../shared/models/devopsConfig';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { CommitStatus, DevOpsState } from '../../../shared/models/devopsCommitStatus';
import { forkJoin, Observable } from 'rxjs';
import { DataTableResponseColumn, DataTableResponseObject, ResourceDescriptor, TableColumnOption, TableFilterSelectionOption } from 'diagnostic-data';
import { MessageBarType } from 'office-ui-fabric-react';
import { Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import * as momentNs from 'moment';

const moment = momentNs;
@Component({
  selector: 'devops-deployments',
  templateUrl: './devops-deployments.component.html',
  styleUrls: ['./devops-deployments.component.scss']
})
export class DevopsDeploymentsComponent implements OnInit {
  currentDevopsConfig: DevopsConfig;
  response:any[] = [];
  pullRequests: [];
  resourceId: string = "";
  table: DataTableResponseObject = null;
  loadingTable: boolean = false;
  columnOptions: TableColumnOption[] = [
    {
        name: "State",
        selectionOption: TableFilterSelectionOption.Multiple
    },
    {
      name: "Type",
      selectionOption: TableFilterSelectionOption.Multiple
    }
  ];

  constructor(private _diagnosticsService:ApplensDiagnosticService, private _router:Router, private _adalService: AdalService) { }

  ngOnInit(): void {
   
    this.loadingTable = true;
    this.resourceId = this._diagnosticsService.resourceId;
    let alias = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    // fetch all commits on the path.
    let provider = ResourceDescriptor.parseResourceUri(this.resourceId).provider;
    let type = ResourceDescriptor.parseResourceUri(this.resourceId).type;
    this._diagnosticsService.getDevopsConfig(`${provider}/${type}`).subscribe(config => {
        this.currentDevopsConfig = config;
    });
    this._diagnosticsService.getDevopsChangeList("/", this.resourceId).subscribe((data: any[]) => {
      let recentCommits = data.slice(0, 10);
      let commitObservable = [];
      let activePRObservable = this._diagnosticsService.getDevopsPullRequest(`${provider}/${type}`);
      commitObservable.push(activePRObservable);
      recentCommits.forEach(version => {
        commitObservable.push(this._diagnosticsService.getDevopsCommitStatus(version["commitId"], this.resourceId));
      });


      forkJoin(commitObservable).subscribe((res: any[]) => {
        this.response = res;
      }, error => {
        this.response.concat([]);
        this.loadingTable = false;
      }, () => {
        this.table = this.generatePendingChangesTables(this.response);
        this.loadingTable = false;
      });  
      });            
  }

  private generatePendingChangesTables(resultSet:any[]) {
    const columns: DataTableResponseColumn[] = [
      { columnName: "Type"},
      { columnName: "Description & Link" },      
      { columnName: "Creation Date"},
      { columnName: "State" },
      {columnName: "Commit/Branch"}
  ];
    
  let rows: any[][] = [];
  if (resultSet.length > 0 ) {   
    let pullRequestRows = this.generatePullRequestRows(resultSet[0]);
    rows = rows.concat(pullRequestRows);
    for(var start = 1;start<resultSet.length; start++) {      
      let deploymentRows = this.generatePendingDeploymentsRows(resultSet[start]);
      rows = rows.concat(deploymentRows); 
    }
  }
  const dataTableObject: DataTableResponseObject = {
    columns: columns,
    rows: rows
  }
  return dataTableObject;
  }

  private generatePullRequestRows(resultSet:any[]):any[][] {
    let rows: any[][] = [];
    resultSet.forEach(element => {
      let sourceBranch:string = element['sourceRefName'];
      let sourceBranchTrim = sourceBranch.replace('refs/heads/', '');
      let title:string = element['title'];
      let link:string = element['remoteUrl'];
      let creationDate = element['creationDate'];
      let displayCreationDate = moment(creationDate).format('MMM Do YY'); 
      let rowElement = `<markdown><a href="${link}" target="_blank">${title}</a></markdown>`;
       // Note: this logic will work for branches created with following pattern : dev/<user_alias>/<entitytype>/<entityid>, eg: dev/microsoftalias/detector/mydetector or dev/microsoftalias/gist/mygist
       let branchUserName = sourceBranchTrim.startsWith('dev/') ? sourceBranchTrim.split("/")[1] : sourceBranchTrim;
      if (sourceBranchTrim.indexOf('dev') > -1 && title != undefined && title != '' && link != undefined && link != '') {  
        let rowElement = `<markdown><a href="${link}" target="_blank">${title}</a></markdown>`;
        sourceBranch = sourceBranch.replace('refs/heads/','');
        let entityid = sourceBranchTrim.split("/")[3];
        let entityType = sourceBranchTrim.split("/")[2];
        let path = entityType.toLocaleLowerCase() == 'gist' ? `${this.resourceId}/gists/${entityid}?branchInput=${sourceBranch}` : `${this.resourceId}/detectors/${entityid}/edit?branchInput=${sourceBranch}`;
        let sourceClickContent =  `<markdown> <a href="${link}" target="_blank"> ${sourceBranch}</a></markdown>`;
        rows.push(["Pull Request",  rowElement, displayCreationDate, "Active", sourceClickContent]); 
      }          
    });
    return rows;
  }
  private generatePendingDeploymentsRows(devopsStatuses: CommitStatus[]):any[][] {
 
    let rows: any[][] = [];
    devopsStatuses.forEach(status => {
      if (status.state != DevOpsState.Succeeded) {
        
          let gitCommitWithLink = '';
         let releaseCreationDate = status.creationDate;
         let displayReleaseDate = moment(releaseCreationDate).format('MMM Do YY'); 
          let displayCommitSha = status.commitId.substring(0,8);
          gitCommitWithLink = 
          `<markdown>
          <a href="https://dev.azure.com/${this.currentDevopsConfig.organization}/${this.currentDevopsConfig.project}/_git/${this.currentDevopsConfig.repository}/commit/${status.commitId}">${displayCommitSha}</a>
          </markdown>`;
          const displayReleaseUrl =
          `<markdown>
              <a href="${status.targetUrl}">${status.description}</a>
          </markdown>`;
          rows.push(["Release",   displayReleaseUrl, displayReleaseDate, DevOpsState[status.state], gitCommitWithLink]);
       
      }
    });
  
    return rows;
  }

  
}
