import { Component, Injector, OnInit, Optional } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { Subscription, Observable } from 'rxjs';
import { ISearchBoxProps } from 'office-ui-fabric-react';
import { SearchService } from '../../../modules/dashboard/services/search.service';
import { ResourceInfo } from '../../models/resources';
import { DiagnosticApiService } from '../../services/diagnostic-api.service';
import { StartupService } from '../../../shared/services/startup.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { ObserverService } from '../../../shared/services/observer.service';
import { PanelType } from 'office-ui-fabric-react';


@Component({
  selector: 'applens-header',
  templateUrl: './applens-header.component.html',
  styleUrls: ['./applens-header.component.scss']
})
export class ApplensHeaderComponent implements OnInit {
  resource: any;
  openResourceInfoPanel: boolean = false;
  keys: string[];
  resourceDetailsSub: Subscription;
  resourceReady: Observable<any>;
  observerLink: string="";
  userPhotoSource: string = "";
  applensLogo: string = "../../../../assets/img/Applens-Logo.svg";
  resourceInfo: ResourceInfo = new ResourceInfo();
  envTag: string = "";
  searchValue: string = "";
  searchStyles: ISearchBoxProps['styles'] = {
    root: {
      minWidth: "300px"
    },
    clearButton: {
      display: "none"
    }
  };

  type: PanelType = PanelType.custom;
  width: string = "850px";

  panelStyles: any = {
      root: {
          marginTop: '50px',
      }
  }


  constructor(private _adalService: AdalService, private startupService: StartupService, public resourceService: ResourceService,  private _observerService: ObserverService, private _diagnosticApiService: DiagnosticApiService, private _activatedRoute: ActivatedRoute, private _router: Router, @Optional() public _searchService?: SearchService) { }

  ngOnInit() {
    let serviceInputs = this.startupService.getInputs();

    this.resourceReady = this.resourceService.getCurrentResource();
    this.resourceReady.subscribe(resource => {
      if (resource) {
        this.resource = resource;

        if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/hostingenvironments' && this.resource && this.resource.Name)
        {
            this.observerLink = "https://wawsobserver.azurewebsites.windows.net/MiniEnvironments/"+ this.resource.Name;
            this._diagnosticApiService.GeomasterServiceAddress = this.resource["GeomasterServiceAddress"];
            this._diagnosticApiService.GeomasterName = this.resource["GeomasterName"];
        }
        else if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/sites')
        {
            this._diagnosticApiService.GeomasterServiceAddress = this.resource["GeomasterServiceAddress"];
            this._diagnosticApiService.GeomasterName = this.resource["GeomasterName"];
            this._diagnosticApiService.Location = this.resource["WebSpace"];
            this.observerLink = "https://wawsobserver.azurewebsites.windows.net/sites/"+ this.resource.SiteName;

            if (resource['IsXenon']) {
                this.resourceService.imgSrc = this.resourceService.altIcons['Xenon'];
            }
        }
        else if (serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.web/containerapps' ||
                 serviceInputs.resourceType.toString().toLowerCase() === 'microsoft.app/containerapps')
        {
          this._diagnosticApiService.GeomasterServiceAddress = this.resource.ServiceAddress;
          this._diagnosticApiService.GeomasterName = this.resource.GeoMasterName;
          this.observerLink = "https://wawsobserver.azurewebsites.windows.net/partner/containerapp/" + this.resource.ContainerAppName;
        }

        this.keys = Object.keys(this.resource);
      }
    });

    const alias = this._adalService.userInfo.profile ? this._adalService.userInfo.profile.upn : '';
    const userId = alias.replace('@microsoft.com', '');
    this._diagnosticApiService.getUserPhoto(userId).subscribe(image => {
      this.userPhotoSource = image;
    });

    if (this._activatedRoute.snapshot.queryParams["searchTerm"]) {
      const searchValue: string = this._activatedRoute.snapshot.queryParams["searchTerm"];
      this.searchValue = searchValue.trim();
    }

    if (this._activatedRoute.snapshot.data["info"]) {
      this.resourceInfo = this._activatedRoute.snapshot.data["info"];
    }
    this._diagnosticApiService.getDetectorDevelopmentEnv().subscribe(env => {
      this.envTag = `(${env})`;
    });
  }

  navigateToLandingPage() {
    window.location.href = "/"
  }

  triggerSearch() {
    this._searchService.searchTerm = this.searchValue;

    this._searchService.searchTerm = this._searchService.searchTerm.trim();

    const navigationExtras: NavigationExtras = {
      queryParamsHandling: "merge",
      preserveFragment: true,
      relativeTo: this._activatedRoute,
      queryParams: { searchTerm: this._searchService.searchTerm }
    };

    if (this._searchService.searchIsEnabled && this._searchService.searchTerm && this._searchService.searchTerm.length > 3) {
      this._router.navigate([`search`], navigationExtras);
    }
  }

  updateSearchValue(searchValue: { newValue: any }) {
    if (!!searchValue && !!searchValue.newValue && !!searchValue.newValue.currentTarget && !!searchValue.newValue.currentTarget.value) {
      this.searchValue = searchValue.newValue.currentTarget.value;
    }
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

  dismissedHandler() {
    this.openResourceInfoPanel = false;
}
}


