import { AdalService } from 'adal-angular4';
import { Subscription, Observable } from 'rxjs';
import { Component, OnDestroy, OnInit, Pipe, PipeTransform } from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import * as momentNs from 'moment';
import { DetectorControlService, FeatureNavigationService, DetectorMetaData, DetectorType } from 'diagnostic-data';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { UserInfo } from '../user-profile/user-profile.component';
import { StartupService } from '../../../shared/services/startup.service';
import { SearchService } from '../services/search.service';
import { v4 as uuid } from 'uuid';
import { environment } from '../../../../environments/environment';
import {DiagnosticApiService} from '../../../shared/services/diagnostic-api.service';
import { ObserverService } from '../../../shared/services/observer.service';
import { ICommandBarProps, PanelType } from 'office-ui-fabric-react';
import { filter } from 'rxjs/operators';
import { ApplensGlobal } from '../../../applens-global';
import { L2SideNavType } from '../l2-side-nav/l2-side-nav.component';

@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnDestroy {
  startTime: momentNs.Moment;
  endTime: momentNs.Moment;

  contentHeight: string;

  navigateSub: Subscription;
  userId: string = "";
  userName: string = "";
  displayName: string="";
  userPhotoSource: string = undefined;

  currentRoutePath: string[];
  resource: any;
  keys: string[];
  observerLink: string="";
  showUserInformation: boolean;
  resourceReady: Observable<any>;
  resourceDetailsSub: Subscription;
  openResourceInfoPanel: boolean = false;
  type: PanelType = PanelType.custom;
  width: string = "850px";

  panelStyles: any = {
      root: {
          marginTop: '50px',
      }
  }

  commandBarStyles: ICommandBarProps["styles"] = {
    root: {
      padding: "0px"
    }
  };

  title:string = "";
  showL2SideNav:boolean = false;
  detectors:DetectorMetaData[] = [];

  constructor(public resourceService: ResourceService, private _detectorControlService: DetectorControlService,
    private _router: Router, private _activatedRoute: ActivatedRoute, private _navigator: FeatureNavigationService,
    private _diagnosticService: ApplensDiagnosticService, private _adalService: AdalService, public _searchService: SearchService, private _diagnosticApiService: DiagnosticApiService, private _observerService: ObserverService,private _applensGlobal:ApplensGlobal) {
    this.contentHeight = (window.innerHeight - 50) + 'px';

    this.navigateSub = this._navigator.OnDetectorNavigate.subscribe((detector: string) => {
      if (detector) {
        this._router.navigate([`./detectors/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });

        this._diagnosticService.getDetectors().subscribe(detectors => {
          // this.detectors = detectors;
          // let detectorMetaData: DetectorMetaData = detectors.find(d => d.id.toLowerCase() === detector.toLowerCase());
          // if (detectorMetaData) {
          //   if (detectorMetaData.type === DetectorType.Detector) {
          //     this._router.navigate([`./detectors/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
          //   } else if (detectorMetaData.type === DetectorType.Analysis) {
          //     this._router.navigate([`./analysis/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
          //   }
          // }
        });
      }
    });

    // Add time params to route if not already present
    if (!this._activatedRoute.queryParams['startTime'] || !this._activatedRoute.queryParams['endTime']) {
      let routeParams = {
        'startTime': this._detectorControlService.startTime.format('YYYY-MM-DDTHH:mm'),
        'endTime': this._detectorControlService.endTime.format('YYYY-MM-DDTHH:mm')
      }
      // If browser URL contains detectorQueryParams, adding it to route
      if (!this._activatedRoute.queryParams['detectorQueryParams']) {
        routeParams['detectorQueryParams'] = this._activatedRoute.snapshot.queryParams['detectorQueryParams'];
      }
      if (!this._activatedRoute.queryParams['searchTerm']){
        this._searchService.searchTerm = this._activatedRoute.snapshot.queryParams['searchTerm'];
        routeParams['searchTerm'] = this._activatedRoute.snapshot.queryParams['searchTerm'];
      }

      this._router.navigate([], { queryParams: routeParams, queryParamsHandling: 'merge', relativeTo: this._activatedRoute });
    }

    if((this.showUserInformation = environment.adal.enabled)){
      let alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
      this.userId = alias.replace('@microsoft.com', '');
      this._diagnosticService.getUserPhoto(this.userId).subscribe(image => {
        this.userPhotoSource = image;
      });

      this._diagnosticService.getUserInfo(this.userId).subscribe((userInfo: UserInfo) => {
        this.userName = userInfo.givenName;
        this.displayName = userInfo.displayName;
      });
    }
  }

  ngOnInit() {
    this._diagnosticService.getDetectors().subscribe(detectors => {
      this.detectors = detectors;
    })



    this._applensGlobal.openL2SideNavSubject.subscribe(type => {
      this.showL2SideNav = type !== L2SideNavType.None;
    });

    if (!!this._activatedRoute && !!this._activatedRoute.snapshot && !!this._activatedRoute.snapshot.queryParams && !!this._activatedRoute.snapshot.queryParams['l'])
    {
        this._diagnosticApiService.effectiveLocale = this._activatedRoute.snapshot.queryParams['l'].toString().toLowerCase();
    }
  }


  triggerSearch(){
    this._searchService.searchTerm = this._searchService.searchTerm.trim();
    if (this._searchService.searchIsEnabled && this._searchService.searchTerm && this._searchService.searchTerm.length>3){
      this.navigateTo(`search`, {searchTerm: this._searchService.searchTerm}, 'merge');
    }
  }

  navigateTo(path: string, queryParams?: any, queryParamsHandling?: any) {
    let navigationExtras: NavigationExtras = {
        queryParamsHandling: queryParamsHandling || 'preserve',
        preserveFragment: true,
        relativeTo: this._activatedRoute,
        queryParams: queryParams
    };

    this._router.navigate([path], navigationExtras);
  }

  doesMatchCurrentRoute(expectedRoute: string) {
    return this.currentRoutePath && this.currentRoutePath.join('/') === expectedRoute;
  }

  navigateToUserPage() {
    this.navigateTo(`users/${this.userId}`);
  }

  openResourceInfoModal() {
    if (this.keys.indexOf('VnetName') == -1 && this.resourceReady != null && this.resourceDetailsSub == null)
    {
      this.resourceDetailsSub = this.resourceReady.subscribe(resource => {
        if (resource) {
          this._observerService.getSiteRequestDetails(this.resource.SiteName, this.resource.InternalStampName).subscribe(siteInfo => {
            this.resource['VnetName'] = siteInfo.details.vnetname;
            this.keys.push('VnetName');

            if (this.resource['IsLinux'])
            {
              this.resource['LinuxFxVersion'] = siteInfo.details.linuxfxversion;
              this.keys.push('LinuxFxVersion');
            }
          });
        }
      });
    }
    this.openResourceInfoPanel = true;
  }

  copyToClipboard(item, event) {
    let listener = (e: ClipboardEvent) => {
      e.clipboardData.setData('text/plain', (item));
      e.preventDefault();
    };

    document.addEventListener('copy', listener);
    document.execCommand('copy');
    document.removeEventListener('copy', listener);

    event.target.src = "/assets/img/copy-icon-copied.png";
    setTimeout(() => {
      event.target.src = "/assets/img/copy-icon.png";
    }, 3000);
  }


  ngOnDestroy() {
    this.navigateSub.unsubscribe();
  }

  getTitle():string {
    let title = "";
    const parms = this._activatedRoute.firstChild.snapshot.params;
    if(parms["detector"] || parms["analysisId"]){
      const id = parms["detector"] || parms["analysisId"];
      const data = this.detectors.find(d => d.id === id);
      title = data ? data.name : "" ;
    }else {
      title = "Overview"
    }
    return title;
  }
}

@Pipe({name: 'formatResourceName'})
export class FormatResourceNamePipe implements PipeTransform {
    transform(resourceName: string): string {
        let displayedResourceName = resourceName;
        if (resourceName && resourceName.length >= 35)
        {
            displayedResourceName = resourceName.substring(0, 35).concat("...");
        }

        return displayedResourceName;
    }
}
