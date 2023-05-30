import { Component, OnInit, forwardRef, Inject } from '@angular/core';
import { INavigationItem } from '../../models/inavigationitem';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../startup/services/auth.service';

@Component({
  selector: 'tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss']
})
export class TabsComponent implements OnInit {

  public navigationItems: INavigationItem[];
    constructor(private _router: Router, private _activatedRoute: ActivatedRoute,private _authService: AuthService) {
    this.navigationItems = [];
  }

  ngOnInit() {
    this._router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(event => {
      const navigationTitleStr: string = 'navigationTitle';
      let currentRoute = this._activatedRoute.root;
      while (currentRoute.children[0] !== undefined) {
        currentRoute = currentRoute.children[0];
      }

      if (currentRoute.snapshot.data.hasOwnProperty(navigationTitleStr)) {

        let navigationTitle = currentRoute.snapshot.data[navigationTitleStr].toString();

        if (navigationTitle.indexOf(':') >= 0) {
          const parameterName = navigationTitle.replace(':', '');
          if (currentRoute.snapshot.params.hasOwnProperty(parameterName)) {
            navigationTitle = currentRoute.snapshot.params[parameterName];
          }
        }

        const url = this._router.url.split('?')[0];
        let existingTab = this.navigationItems.find(item => item.url.split('?')[0] === url);
        let analysisTab = this.getAnalysisTabIfAnalysisDetector(url);
        if (analysisTab) {
          existingTab = analysisTab;
        }
        var allParams = {}
        Object.keys(currentRoute.snapshot.params).forEach(key => allParams[key] = currentRoute.snapshot.params[key]);
        Object.keys(currentRoute.snapshot.queryParams).forEach(key => allParams[key] = currentRoute.snapshot.queryParams[key]);

        if (!existingTab) {
          existingTab = {
            title: navigationTitle,
            url: url,
            params: allParams,
            isActive: false
          };

          this.navigationItems.push(existingTab);
        }

        this.selectTab(existingTab);
      }
    });
  }

  getAnalysisTabIfAnalysisDetector(url: string) {
    if (url.indexOf("/analysis/") >=0 && url.indexOf("/detectors/") >= 0 && url.indexOf("/legacy/") === -1) {
      let detectorWithAnalysisPath = url.split("/analysis/")[1];
      if (detectorWithAnalysisPath.indexOf("/detectors/") > 0) {
        if (detectorWithAnalysisPath.indexOf("/") > 0) {
          let urlArray = url.split("/");
          if (urlArray.length > 1) {
            urlArray.splice(urlArray.length - 2);
            let analysisUrl = urlArray.join("/");
            let existingTab = this.navigationItems.find(item => item.url.split('?')[0] === analysisUrl);
            return existingTab;
          }
        }
      }
    }
  }

  selectTab(tab: INavigationItem) {

    if (tab.isActive) {
      // Tab is already active.
      return;
    }

    this.navigationItems.forEach(element => {
      element.isActive = false;
    });

    tab.isActive = true;
    //this._logger.LogTabOpened(tab.title);
  }

  closeTab(index: number): void {

    // We dont want to close the first tab.
    if (index > 0) {
      const tab = this.navigationItems[index];
      this.navigationItems.splice(index, 1);
      // this._logger.LogTabClosed(tab.title);
      if (tab.isActive) {
        this._router.navigateByUrl(this.navigationItems[index - 1].url);
      }
    }
    }

    navigateTab(index: number): void {

        if (index >= 0) {
            const tab = this.navigationItems[index];
            if (!tab.isActive) {
                this._router.navigateByUrl(tab.url);
            }
        }
    }


}
