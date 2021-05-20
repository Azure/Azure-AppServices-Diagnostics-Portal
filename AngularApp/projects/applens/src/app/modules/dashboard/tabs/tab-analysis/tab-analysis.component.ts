import { Component, OnInit, OnChanges, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { DetectorListAnalysisComponent } from 'diagnostic-data';
import { DownTime, zoomBehaviors } from 'diagnostic-data';
import { ApplensCommandBarService } from '../../services/applens-command-bar.service';
import { ApplensGlobal } from 'projects/applens/src/app/applens-global';

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

  @ViewChild('detectorListAnalysis', { static: true }) detectorListAnalysis: DetectorListAnalysisComponent
  downtimeZoomBehavior = zoomBehaviors.Zoom;

  constructor(private _activatedRoute: ActivatedRoute, private _router: Router, private _diagnosticService: ApplensDiagnosticService,private _applensCommandBarService:ApplensCommandBarService,private _applensGlobal:ApplensGlobal) {
    this._activatedRoute.paramMap.subscribe(params => {
      this.analysisId = params.get('analysisId');
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
    this._applensCommandBarService.getDetectorMeatData(this.analysisId).subscribe(metaData =>{
      this._applensCommandBarService.emailToAuthor(metaData);
    });
  }

  openFeedback() {
    this._applensGlobal.openFeedback = true;
  }
}
