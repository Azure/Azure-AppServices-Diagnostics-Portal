import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TelemetryService } from 'diagnostic-data';

@Component({
    selector: 'integrated-solutions-view',
    templateUrl: './integrated-solutions-view.component.html',
    styleUrls: ['./integrated-solutions-view.component.scss']
})
export class IntegratedSolutionsViewComponent implements OnInit {
    detector: string;
    analysisDetector: string;
    isAnalysisView: boolean = false;
    keystoneDetectorId = "";
    keystoneSolutionView: boolean = false;
    keystoneDetectorTitle: string = "Option 2: View diagnostic analysis";
    constructor(private _activatedRoute: ActivatedRoute, private _telemetryService: TelemetryService) { }

    ngOnInit() {
        this._activatedRoute.paramMap.subscribe(params => {
            let currAnalysisId = params.get('analysisId');
            let currDetetctor = params.get('detectorName');
            if (!!currAnalysisId) {
                this.isAnalysisView = true;
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
                }
            }

            this._activatedRoute.queryParamMap.subscribe((queryParams) => {
                this.keystoneDetectorId = queryParams.get('keystoneDetectorId');
                this.keystoneSolutionView = !!this.keystoneDetectorId;

                this._telemetryService.logEvent("IntegratedSolutionViewLoaded", {
                    'IsKeystoneSolutionView': String(this.keystoneSolutionView),
                    'KeystoneDetctorId': this.keystoneDetectorId,
                    'DetectorId': this.detector,
                    'AnalysisDetector': this.analysisDetector,
                    'IsAnalysisView': String(this.isAnalysisView)
                });
            });
        });

    }
}
