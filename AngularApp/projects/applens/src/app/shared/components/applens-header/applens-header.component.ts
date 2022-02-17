import { Component, Injector, OnInit, Optional } from '@angular/core';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { AdalService } from 'adal-angular4';
import { ISearchBoxProps } from 'office-ui-fabric-react';
import { SearchService } from '../../../modules/dashboard/services/search.service';
import { ResourceInfo } from '../../models/resources';
import { DiagnosticApiService } from '../../services/diagnostic-api.service';

@Component({
  selector: 'applens-header',
  templateUrl: './applens-header.component.html',
  styleUrls: ['./applens-header.component.scss']
})
export class ApplensHeaderComponent implements OnInit {
  userPhotoSource: string = "";
  applensLogo: string = "../../../../assets/img/Applens-Logo.svg";
  resourceInfo: ResourceInfo = new ResourceInfo();
  envTag: string = "";
  searchValue: string = "";
  searchStyles: ISearchBoxProps['styles'] = {
    root: {
      minWidth: "250px"
    },
    clearButton: {
      display: "none"
    }
  };


  constructor(private _adalService: AdalService, private _diagnosticApiService: DiagnosticApiService, private _activatedRoute: ActivatedRoute, private _router: Router, @Optional() public _searchService?: SearchService) { }

  ngOnInit() {
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
}
