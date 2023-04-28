import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IPanelProps, PanelType } from 'office-ui-fabric-react';
import { forkJoin } from 'rxjs';
import { AdalService } from 'adal-angular4';
import { ResourceDescriptor } from 'diagnostic-data';
import { DevopsConfig } from '../../../shared/models/devopsConfig';
import { DiagnosticApiService } from '../../services/diagnostic-api.service';
import { ResourceService } from '../../services/resource.service';
import { CommitStatus, DevOpsState } from '../../models/devopsCommitStatus';

@Component({
  selector: 'devops-notification',
  templateUrl: './devops-notification.component.html',
  styleUrls: ['./devops-notification.component.scss']
})
export class DevopsNotificationComponent implements OnInit {

  currentDevopsConfig: DevopsConfig;
  userId:string = "";
  scenarioMessage:string = "";
  response:any[] = [];
  resourceId: string = "";
  showDevopsStatusMessage: boolean = false;
  PanelType = PanelType;
  devopsPanelStyles:  IPanelProps["styles"] = {
    root: {
      height: "100px",
    },
    content: {
      padding: "0px"
    },
    navigation: {
      height: "20px"
    }
  };
  bannerTimer:any = null;
  constructor(private _router:Router, private _adalService: AdalService, private _diagnosticsService:DiagnosticApiService, private resourceService:ResourceService) { }

  ngOnInit(): void {
    this.resourceId = this.resourceService.getCurrentResourceId();
    let alias = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    this.userId = alias.replace('@microsoft.com', '');
    // fetch all commits on the path.
    let provider = ResourceDescriptor.parseResourceUri(this.resourceId).provider;
    let type = ResourceDescriptor.parseResourceUri(this.resourceId).type;
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
      }, () => {
        this.generateBannerMessage(this.response);
      });  
      });  
  }

  generateBannerMessage(result:any[]) {
    let activePRCount = this.calculateActivePullRequests(result[0]);
    let failedOrPendingDeployments = 0; 
    // starting from index 1 here as the observable returns 0 index for PRs and starting from 1 for devops statuses APIs.
     for(var start = 1;start<result.length; start++) {      
      failedOrPendingDeployments +=  this.calculatePendingOrFailedDeployments(result[start]);
     }
    if ( activePRCount > 0 && failedOrPendingDeployments == 0 ) {
      this.showDevopsStatusMessage = true;
      this.scenarioMessage = 'One or more Pull Requests are active. Detector code changes will be reflected after your PR is merged and deployed.';
    } else if ( failedOrPendingDeployments > 0) {
      this.showDevopsStatusMessage = true;
      this.scenarioMessage = 'We could not update some of your detector(s) because there are some deployments that are pending or failed ';
    }
    else {
      this.showDevopsStatusMessage = false;
    }
  }

  calculateActivePullRequests(pullRequests: any[]):number {
    let filtered = pullRequests.filter((pr) => pr['sourceRefName'].indexOf('dev') > -1);
    return filtered.length;
  }

  calculatePendingOrFailedDeployments(devopsStatuses: CommitStatus[]):number {
    let filtered = devopsStatuses.filter((deployment) => deployment.state != DevOpsState.Succeeded);
    return filtered.length;
  }

  goToPendingDeployments() {
      this._router.navigateByUrl(`${this.resourceId}/deployments`);
  }

  closeNotification() {
    this.showDevopsStatusMessage = false;
  }

  onOpenNotification() {
    this.bannerTimer = setTimeout(() => {
      this.closeNotification();
    }, 10000);
  }

}
