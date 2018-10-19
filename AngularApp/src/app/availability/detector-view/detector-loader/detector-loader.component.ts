import { Component, OnInit, ViewContainerRef, ViewChild, ComponentFactory, ComponentFactoryResolver, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DetectorViewBaseComponent } from '../detector-view-base/detector-view-base.component';
import { DetectorControlService, LoadingStatus } from '../../../../../node_modules/applens-diagnostics';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';
import { IDetectorResponse } from '../../../shared/models/detectorresponse';
import { SiteCpuAnalysisDetectorComponent } from '../detectors/site-cpu-analysis-detector/site-cpu-analysis-detector.component';
import { SiteMemoryAnalysisDetectorComponent } from '../detectors/site-memory-analysis-detector/site-memory-analysis-detector.component';
import { ThreadDetectorComponent } from '../detectors/thread-detector/thread-detector.component';
import { FrebAnalysisDetectorComponent } from '../detectors/freb-analysis-detector/freb-analysis-detector.component';
import { PhpLogAnalyzerComponent } from '../detectors/php-log-analyzer-detector/php-log-analyzer-detector.component';
import { DockerContainerIntializationComponent } from '../detectors/docker-container-start-stop-detector/docker-container-start-stop-detector.component';
import { CommittedMemoryUsageComponent } from '../detectors/committed-memory-detector/committed-memory-detector.component';
import { PageFileOperationsComponent } from '../detectors/page-operations-detector/page-operations-detector.component';
import { AspNetCoreComponent } from '../detectors/aspnetcore-detector/aspnetcore-detector.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'detector-loader',
  templateUrl: './detector-loader.component.html',
  styleUrls: ['./detector-loader.component.css'],
  entryComponents: [SiteCpuAnalysisDetectorComponent, SiteMemoryAnalysisDetectorComponent,ThreadDetectorComponent, FrebAnalysisDetectorComponent, PhpLogAnalyzerComponent, DockerContainerIntializationComponent, CommittedMemoryUsageComponent, PageFileOperationsComponent, AspNetCoreComponent, DetectorViewBaseComponent ],
})
export class DetectorLoaderComponent implements OnInit, OnDestroy {

  LoadingStatus = LoadingStatus;

  subscriptionId: string;
  resourceGroup: string;
  siteName: string;
  slotName: string;
  detectorName: string;
  category: string = 'availablility';

  loading: boolean;

  updateSubscription: Subscription;
  detectorSubscription: Subscription;

  detectorResponse: IDetectorResponse;

  dynamicDetectorInstance: DetectorViewBaseComponent;
  componentFactory: ComponentFactory<{}>;

  @ViewChild('dynamicDataContainer', { read: ViewContainerRef }) dynamicDetectorContainer: ViewContainerRef;

  constructor(private _activatedRoute: ActivatedRoute, private componentFactoryResolver: ComponentFactoryResolver, private _detectorControlService: DetectorControlService,
    private _appAnalysisService: AppAnalysisService) { }

  ngOnInit() {

    if (this._activatedRoute.parent.snapshot.params['subscriptionid'] != null) {
      this.subscriptionId = this._activatedRoute.parent.snapshot.params['subscriptionid'];
      this.resourceGroup = this._activatedRoute.parent.snapshot.params['resourcegroup'];
      this.siteName = this._activatedRoute.parent.snapshot.params['sitename'];
      this.siteName = this.siteName ? this.siteName : this._activatedRoute.parent.snapshot.params['resourcename'];
      this.slotName = this._activatedRoute.snapshot.params['slot'] ? this._activatedRoute.snapshot.params['slot'] : '';
    }
    else if (this._activatedRoute.snapshot.params['subscriptionid'] != null) {
      this.subscriptionId = this._activatedRoute.snapshot.params['subscriptionid'];
      this.resourceGroup = this._activatedRoute.snapshot.params['resourcegroup'];
      this.siteName = this._activatedRoute.snapshot.params['sitename'];
      this.siteName = this.siteName ? this.siteName : this._activatedRoute.snapshot.params['resourcename'];
      this.slotName = this._activatedRoute.snapshot.params['slot'] ? this._activatedRoute.snapshot.params['slot'] : '';
    }

    let component = this._activatedRoute.snapshot.data['detectorComponent'];
    this.componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);

    this.detectorName = component.getDetectorName();

    if (!this.detectorName || this.detectorName === '') {
      this.detectorName = this._activatedRoute.snapshot.params['detectorName'];
    }

    this.updateSubscription = this._detectorControlService.update.subscribe(isValidUpdate => {
      if (isValidUpdate) {
        this._refresh();
      }
    });
  }

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    
    this._clearRequestSubscriptions();
  }

  private _refresh() {
    this.loading = true;
    this.detectorResponse = null;
    this._clearRequestSubscriptions();
    this._getData(true);
  }

  private _getData(invalidateCache: boolean = false) {
    this.detectorSubscription = this._appAnalysisService.getDetectorResource(this.subscriptionId, this.resourceGroup, this.siteName, this.slotName, this.category, this.detectorName, invalidateCache, this._detectorControlService.startTimeString, this._detectorControlService.endTimeString)
      .subscribe(response => {
        this.dynamicDetectorContainer.clear();
        let componentRef = this.dynamicDetectorContainer.createComponent(this.componentFactory);
        this.dynamicDetectorInstance = <DetectorViewBaseComponent>(componentRef.instance);
        this.dynamicDetectorInstance.detectorResponseObject = response;
        this.loading = false;
      });
  }

  private _clearRequestSubscriptions() {
    if (this.detectorSubscription) {
        this.detectorSubscription.unsubscribe();
    }
  }
}
