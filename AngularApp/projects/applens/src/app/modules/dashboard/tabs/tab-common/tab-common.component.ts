import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ChildActivationEnd, NavigationEnd, Router } from '@angular/router';
import { IButtonProps, IDialogContentProps } from 'office-ui-fabric-react';
import { DiagnosticApiService } from 'projects/applens/src/app/shared/services/diagnostic-api.service';
import { ResourceService } from 'projects/applens/src/app/shared/services/resource.service';
import { DetectorMetadataService } from 'projects/diagnostic-data/src/lib/services/detector-metadata.service';
import { combineLatest } from 'rxjs';
import { distinct } from 'rxjs-compat/operator/distinct';
import { mergeMap } from 'rxjs-compat/operator/mergeMap';
import { filter, merge } from 'rxjs/operators';
import { Tab, TabKey } from '../tab-key';

@Component({
  selector: 'tab-common',
  templateUrl: './tab-common.component.html',
  styleUrls: ['./tab-common.component.scss']
})
export class TabCommonComponent implements OnInit {
  selectedTabKey: string;
  enabledDetectorDevelopment: boolean = true;
  graduationEnabled: boolean = false;
  TabKey = TabKey;
  isWorkflow: boolean = false;
  detectorAuthor: string = '';
  detectorDescription: string = '';
  detectorDevelopmentEnvironment: string = 'prod';
  PPEHostname: string = '';
  PPELink: string = '';

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _diagnosticApiService: DiagnosticApiService, private resourceService: ResourceService, private _detectorMetadataService: DetectorMetadataService) {
    this._activatedRoute.firstChild.data.subscribe(data => {
      const key: string = data["tabKey"];
      this.selectedTabKey = key;
    });

    this._activatedRoute.data.subscribe(data => {
      if (data["isWorkflow"] && data["isWorkflow"] === true) {
        this.isWorkflow = true;
      }
    });
    _detectorMetadataService.getAuthor().subscribe(auth => {
      this.detectorAuthor = auth;
    });
    _detectorMetadataService.getDescription().subscribe(desc => {
      this.detectorDescription = desc;
    });
  }

  ngOnInit() {
    this._diagnosticApiService.getDetectorDevelopmentEnv().subscribe(env => {
      this.detectorDevelopmentEnvironment = env;
    });
    this._activatedRoute.params.subscribe(param => {
      this._diagnosticApiService.getPPEHostname().subscribe(host => {
        this.PPEHostname = host;
        this.PPELink = `${this.PPEHostname}${this._router.url.replace('?', '/edit?')}`;
      });
    })
    this._diagnosticApiService.getEnableDetectorDevelopment().subscribe(enabledDetectorDevelopment => {
      this.enabledDetectorDevelopment = enabledDetectorDevelopment;
    });
    //hide commit history
    this._diagnosticApiService.getDevopsConfig(`${this.resourceService.ArmResource.provider}/${this.resourceService.ArmResource.resourceTypeName}`).subscribe(config => {
      this.graduationEnabled = (config.graduationEnabled);// ? {display: "none"} : {};
    });
    this._router.events.pipe(filter(event => event instanceof ChildActivationEnd)).subscribe(e => {
      const key: string = this._activatedRoute.firstChild.snapshot.data["tabKey"];
      this.selectedTabKey = key;
    });
  }

  navigateToData(ev: any) {
    const key: string = ev.item.props.itemKey;

    switch (key) {
      case TabKey.Data:
        this._router.navigate(["./"], {
          relativeTo: this._activatedRoute,
          queryParamsHandling: "preserve"
        });
        break;
      case TabKey.Develop:
        if (this.graduationEnabled && this.detectorDevelopmentEnvironment === 'Prod'){
          window.open(this.PPELink, "_blank");
          this._router.navigate(["./"], {
            relativeTo: this._activatedRoute,
            queryParamsHandling: "preserve"
          });
        }
        else {
          this._router.navigate(["edit"], {
            relativeTo: this._activatedRoute,
            queryParamsHandling: "preserve"
          });
        }
        break;
      case TabKey.DataSources:
        this._router.navigate(["datasource"], {
          relativeTo: this._activatedRoute,
          queryParamsHandling: "preserve"
        });
        break;
      case TabKey.CommitHistory:
        this._router.navigate(["changelist"], {
          relativeTo: this._activatedRoute,
          queryParamsHandling: "preserve"
        });
        break;
      case TabKey.Monitoring:
        this._router.navigate(["monitoring"], {
          relativeTo: this._activatedRoute,
          queryParamsHandling: "preserve"
        });
        break;
      case TabKey.Analytics:
        this._router.navigate(["analytics"], {
          relativeTo: this._activatedRoute,
          queryParamsHandling: "preserve"
        });
        break;
    }
  }
}


