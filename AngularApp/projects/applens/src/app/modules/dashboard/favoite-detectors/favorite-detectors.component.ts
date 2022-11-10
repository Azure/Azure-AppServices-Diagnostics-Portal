import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DetectorMetaData, DetectorType, HealthStatus, TelemetryEventNames, TelemetryService } from 'diagnostic-data';
import { IIconProps, IPanelProps, PanelType } from 'office-ui-fabric-react';
import { FavoriteDetectors } from '../../../shared/models/user-setting';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { UserSettingService } from '../services/user-setting.service';

@Component({
  selector: 'favorite-detectors',
  templateUrl: './favorite-detectors.component.html',
  styleUrls: ['./favorite-detectors.component.scss']
})
export class FavoriteDetectorsComponent implements OnInit {

  constructor(private _userSettingService: UserSettingService, private _applensDiagnosticService: ApplensDiagnosticService, private _router: Router, private _activatedRoute: ActivatedRoute, private _telemetryService: TelemetryService) { }
  HealthStatus = HealthStatus;
  allDetectors: DetectorMetaData[] = [];
  favoriteDetectorsForDisplay: DetectorMetaData[] = [];
  unPinnedIconStyles: IIconProps['styles'] = {
    root: {
      height: "16px",
      width: "16px",
      color: "#0078D4",
      cursor: "pointer"
    }
  };

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


  ngOnInit() {
    this._applensDiagnosticService.getDetectors().subscribe(detectors => {
      this.allDetectors = detectors;
      this._userSettingService.getUserSetting().subscribe(userSetting => {
        const favoriteDetectors = userSetting.favoriteDetectors;
        this.favoriteDetectorsForDisplay = this.filterDetectors(favoriteDetectors);
      });
    });
  }

  public navigate(detector: DetectorMetaData) {
    this._telemetryService.logEvent(TelemetryEventNames.FavoriteDetectorClicked, { 'detectorId': detector.id, 'location': 'OverViewPage' });
    if (detector.type === DetectorType.Detector) {
      this._router.navigate([`./detectors/${detector.id}`], { relativeTo: this._activatedRoute });
    } else {
      this._router.navigate([`./analysis/${detector.id}`,], { relativeTo: this._activatedRoute });
    }
  }

  public removeDetector(e: Event, detector: DetectorMetaData) {
    e.stopPropagation();
    this.panelMessage = "";
    this.panelHealthStatus = HealthStatus.Success;

    this._telemetryService.logEvent(TelemetryEventNames.FavoriteDetectorRemoved, { 'detectorId': detector.id, 'location': 'OverViewPage' });

    this._userSettingService.removeFavoriteDetector(detector.id).subscribe(_ => {
      this.autoDismissPanel();
      this.panelHealthStatus = HealthStatus.Success;
      this.panelMessage = `Successfully unpinned from overview page`;
    }, err => {
      this.autoDismissPanel();
      this.panelHealthStatus = HealthStatus.Critical;
      this.panelMessage = `Some issue happened while unpinning, Please try again later`;
    });
  }

  private filterDetectors(favoriteDetectors: FavoriteDetectors): DetectorMetaData[] {
    const favoriteDetectorIds = Object.keys(favoriteDetectors);
    const detectors = this.allDetectors.filter(detector => {
      return favoriteDetectorIds.indexOf(detector.id) > -1 && favoriteDetectors[detector.id].type === detector.type;
    });

    detectors.forEach(d => {
      if (!d.category) d.category = "Uncategorized";
    });
    this.sortFavoriteDetectorsForDisplay(detectors);
    return detectors;
  }

  private sortFavoriteDetectorsForDisplay(detectors: DetectorMetaData[]): void {
    detectors.sort((a, b) => {
      if (a.category === b.category) return a.name > b.name ? 1 : -1;
      else return a.category > b.category ? 1 : -1;
    });
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
