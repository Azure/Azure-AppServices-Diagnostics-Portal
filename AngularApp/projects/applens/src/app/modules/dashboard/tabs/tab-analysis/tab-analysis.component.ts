import { Component, OnInit, OnChanges, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { DetectorListAnalysisComponent, DetectorType, HealthStatus, TelemetryEventNames, TelemetryService } from 'diagnostic-data';
import { DownTime, zoomBehaviors } from 'diagnostic-data';
import { ApplensCommandBarService } from '../../services/applens-command-bar.service';
import { ApplensGlobal } from 'projects/applens/src/app/applens-global';
import { IPanelProps, PanelType } from 'office-ui-fabric-react';

@Component({
  selector: 'tab-analysis',
  templateUrl: './tab-analysis.component.html',
  styleUrls: ['./tab-analysis.component.scss']
})

export class TabAnalysisComponent implements OnInit {

  analysisId: string;
  detectorName: string;
  downTime: DownTime;
  readonly stringFormat: string = 'YYYY-MM-DDTHH:mm';

  pinnedDetector: boolean = false;
  get pinUnpinDetectorText() {
    return this.pinnedDetector ? "UnPin" : "Pin"
  }

  get pinUnpinDetectorIcon() {
    return this.pinnedDetector ? "Unpin" : "Pinned"
  }

  panelStyles: IPanelProps['styles'] = {
    root: {
      height: "60px",
    },
    content: {
      padding: "0px"
    }
  };

  PanelType = PanelType;
  panelHealthStatus = HealthStatus.Success;
  panelTimer = null;
  showPanel: boolean = false;
  panelMessage: string = "";

  @ViewChild('detectorListAnalysis', { static: true }) detectorListAnalysis: DetectorListAnalysisComponent
  downtimeZoomBehavior = zoomBehaviors.Zoom;

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router, private _diagnosticService: ApplensDiagnosticService, private _applensCommandBarService: ApplensCommandBarService, private _applensGlobal: ApplensGlobal, private _telemetryService: TelemetryService) {
    this._activatedRoute.paramMap.subscribe(params => {
      this.analysisId = params.get('analysisId');
      this._diagnosticService.getDetectorMetaDataById(this.analysisId).subscribe(metaData => {
        if (metaData) this._applensGlobal.updateHeader(metaData.name);
      });
      this._applensCommandBarService.getUserSetting().subscribe(userSetting => {
        if (userSetting && userSetting.favoriteDetectors) {
          const favoriteDetectorIds = Object.keys(userSetting.favoriteDetectors);
          this.pinnedDetector = favoriteDetectorIds.findIndex(d => d.toLowerCase() === this.analysisId.toLowerCase()) > -1;
        }
      });
    });

  }

  onUpdateDowntimeZoomBehavior(zoomBehavior: zoomBehaviors) {
    this.downtimeZoomBehavior = zoomBehavior;
  }

  ngOnInit() {
  }
  onActivate(event) {
    window.scroll(0, 0);
  }

  onDowntimeChanged(event: DownTime) {
    this.detectorListAnalysis.downTime = event;
    if (this._activatedRoute == null || this._activatedRoute.firstChild == null || !this._activatedRoute.firstChild.snapshot.paramMap.has('detector') || this._activatedRoute.firstChild.snapshot.paramMap.get('detector').length < 1) {
      this._router.navigate([`./`], {
        relativeTo: this._activatedRoute,
        queryParams: { startTimeChildDetector: event.StartTime.format(this.stringFormat), endTimeChildDetector: event.EndTime.format(this.stringFormat) },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  }

  refreshPage() {
    this._applensCommandBarService.refreshPage();
  }

  emailToAuthor() {
    this._applensCommandBarService.getDetectorMeatData(this.analysisId).subscribe(metaData => {
      this._applensCommandBarService.emailToAuthor(metaData);
    });
  }

  openFeedback() {
    this._applensGlobal.openFeedback = true;
  }

  addOrRemoveDetector() {
    this.showPanel = false;
    this.panelMessage = "";
    this.panelHealthStatus = HealthStatus.Success;

    if (this.pinnedDetector) {
      this._telemetryService.logEvent(TelemetryEventNames.FavoriteDetectorRemoved, { 'detectorId': this.analysisId, 'location': 'CommandBar' });
      this.removeFavoriteDetector();
    } else {
      this._telemetryService.logEvent(TelemetryEventNames.FavoriteDetectorAdded, { 'detectorId': this.analysisId, 'location': 'CommandBar' });
      this.addFavoriteDetector();
    }
  }

  private addFavoriteDetector() {
    this._applensCommandBarService.addFavoriteDetector(this.analysisId, DetectorType.Analysis).subscribe(message => {
      this.setPanelStatusAndMessage(HealthStatus.Success, message);
    }, error => {
      this.setPanelStatusAndMessage(HealthStatus.Critical, error);
    })
  }


  private removeFavoriteDetector() {
    this._applensCommandBarService.removeFavoriteDetector(this.analysisId).subscribe(message => {
      this.setPanelStatusAndMessage(HealthStatus.Success, message);
    }, err => {
      this.setPanelStatusAndMessage(HealthStatus.Critical, err);
    })
  }

  private setPanelStatusAndMessage(status: HealthStatus, message: string) {
    this.panelHealthStatus = status;
    this.panelMessage = message;
    this.autoDismissPanel();
  }

  private autoDismissPanel() {
    this.showPanel = true;
    if (this.panelTimer !== null) {
      clearTimeout(this.panelTimer);
    }
    this.panelTimer = setTimeout(() => {
      this.showPanel = false;
    }, 3000);
  }
}
