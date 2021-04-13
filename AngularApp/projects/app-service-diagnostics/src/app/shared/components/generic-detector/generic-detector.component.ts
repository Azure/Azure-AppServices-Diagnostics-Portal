import { Router } from '@angular/router';
import { Component, Input, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TelemetryService, FeatureNavigationService, DiagnosticService, DetectorMetaData, DetectorType } from 'diagnostic-data';
import { AuthService } from '../../../startup/services/auth.service';
import { Subscription } from 'rxjs';
import { ResourceService } from '../../../shared-v2/services/resource.service';

@Component({
    selector: 'generic-detector',
    templateUrl: './generic-detector.component.html',
    styleUrls: ['./generic-detector.component.scss'],
    providers: [
        FeatureNavigationService
    ]
})
export class GenericDetectorComponent implements OnDestroy {
    detector: string;
    analysisDetector: string;
    navigateSub: Subscription;
    analysisMode: boolean = false;
    isCaseSubmissionSolutionIFrame: boolean = false;
    hideDetectorControl: boolean = false;
    constructor(private _activatedRoute: ActivatedRoute, private _diagnosticService: DiagnosticService, private _resourceService: ResourceService, private _authServiceInstance: AuthService, protected _telemetryService: TelemetryService,
        private _navigator: FeatureNavigationService, private _router: Router) {
        this._activatedRoute.paramMap.subscribe(params => {
            let currAnalysisId = params.get('analysisId');
            let currDetetctor = params.get('detectorName');
            let drilldownDetector = params.get('drilldownDetectorName');
            if (!!currAnalysisId) {
                this.analysisDetector = currAnalysisId;
                if (!!currDetetctor) {
                    this.detector = currDetetctor;
                }
                else {
                    this.detector = currAnalysisId;
                }
            }
            else {
                if (!!currDetetctor) {
                    this.detector = currDetetctor;
                }else if(!!drilldownDetector) {
                    this.detector = drilldownDetector;
                    this.hideDetectorControl = true;
                }
            }

            this.navigateSub = this._navigator.OnDetectorNavigate.subscribe((detector: string) => {
                if (detector) {
                    let detectorMetaData: DetectorMetaData = this._diagnosticService.getDetectorById(detector);
                    if (detectorMetaData.type === DetectorType.Detector) {
                        this._router.navigate([`../../detectors/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
                    } else if (detectorMetaData.type === DetectorType.Analysis) {
                        this._router.navigate([`../../analysis/${detector}`], { relativeTo: this._activatedRoute, queryParamsHandling: 'merge' });
                    }
                }
            });

            this._activatedRoute.data.subscribe(data => {
                this.analysisMode = data['analysisMode'];
            })

            this._authServiceInstance.getStartupInfo().subscribe(startUpInfo => {
                if (startUpInfo) {
                    this.isCaseSubmissionSolutionIFrame = startUpInfo.isIFrameForCaseSubmissionSolution != undefined ? startUpInfo.isIFrameForCaseSubmissionSolution : false;
                }
            });

            this._telemetryService.logEvent("GenericDetectorViewLoaded", {
                'AnalysisMode': String(this.analysisMode),
                'DetectorId': this.detector,
                'AnalysisDetector': this.analysisDetector,
            });
        });
    }

    ngOnDestroy() {
        this.navigateSub.unsubscribe();
    }
}
