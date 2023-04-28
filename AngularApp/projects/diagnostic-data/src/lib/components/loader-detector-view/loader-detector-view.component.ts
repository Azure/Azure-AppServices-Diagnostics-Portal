import { Component, Inject, Input, OnInit } from '@angular/core';
import { DiagnosticDataConfig, DIAGNOSTIC_DATA_CONFIG } from '../../config/diagnostic-data-config';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { Guid } from '../../utilities/guid';
import { ISpinnerProps } from 'office-ui-fabric-react';


@Component({
    selector: 'loader-detector-view',
    templateUrl: './loader-detector-view.component.html',
    styleUrls: ['./loader-detector-view.component.scss'],
    template: 'Loading Message 4: {{LoadingMessage4}}'
})


export class LoaderDetectorViewComponent implements OnInit {

    @Input() set LoadingMessage1(message: string) {
        this.setLoadingString(message, 0);
    }
    @Input() set LoadingMessage2(message: string) {
        this.setLoadingString(message, 1);
    };
    @Input() set LoadingMessage3(message: string) {
        this.setLoadingString(message, 2);
    };
    @Input() set LoadingMessage4(message: string) {
        this.setLoadingString(message, 3)
    };
    @Input() Source: string;
    message: string = "loading detector view";
    imgSrc: string = "assets/img/loading-detector-view/fetching_logs.svg";
    
    delay: number = 2000;
    timer: any = 0;
    i: number = 0;
    startLoadingTimeInMilliSeconds: any;
    endLoadingTimeInMilliSeconds: any;
    duration: any;
    trackingEventId: any;
    isPublic: boolean = false;

    isTimeout: boolean = false;
    timeoutTimer: any = null;
    readonly timeoutInMS: number = 120 * 1000;

    loadingStages: LoadingStage[] = [
        {
            duration: 2000,
            imgSrc: "assets/img/loading-detector-view/fetching_logs.svg",
            loadingString: "Fetching properties and logs ..."
        },
        {
            duration: 2000,
            imgSrc: "assets/img/loading-detector-view/analyzing_data.svg",
            loadingString: "Analyzing data ..."
        },
        {
            duration: 3000,
            imgSrc: "assets/img/loading-detector-view/checking_health.svg",
            loadingString: "Checking resource health ..."
        },
        {
            duration: 3000,
            imgSrc: "assets/img/loading-detector-view/generating_report.svg",
            loadingString: "Generating report ..."
        }
    ];

    loadingString: string = this.loadingStages[0].loadingString;

    spinnerStyles: ISpinnerProps['styles'] = {
        label: { fontSize: "16px" }
    }

    constructor(private telemetryService: TelemetryService, @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
        this.isPublic = config?.isPublic;
    }


    ngOnInit() {
        this.trackingEventId = Guid.newGuid();
        this.loading();
        this.checkLoadingTimeout();
    }

    // This is the loading function for each stage. We set a random time out for each stage.
    loading() {
        window.clearTimeout(this.timer);

        // Display the next loading stage after a random timeout
        this.timer = setTimeout(() => {
            if (this.i < this.loadingStages.length) {
                this.delay = this.i === 0 ? 0 : this.random(this.loadingStages[this.i - 1].duration);
                this.imgSrc = this.loadingStages[this.i].imgSrc;
                this.loadingString = this.loadingStages[this.i].loadingString;
                this.i++;
                this.loading();
            }
        }, this.delay);
    }

    // Generate a random delay to load the next stage, the random number will be at least 1000 miliseconds in case the random number is too small.
    random(n): number {
        return Math.random() * n + 1000;
    }

    ngOnDestroy() {
        window.clearTimeout(this.timer);
        this.endLoadingTimeInMilliSeconds = Date.now();
        let endLoadingTimeISOString = new Date().toISOString();
        this.duration = this.endLoadingTimeInMilliSeconds - this.startLoadingTimeInMilliSeconds;
        this.telemetryService.logEvent(TelemetryEventNames.LoadingDetectorViewEnded, { "TrackingEventId": this.trackingEventId, "EndLoadingTime": endLoadingTimeISOString, "Duration": this.duration });

        window.clearTimeout(this.timeoutTimer);
    }

    ngAfterViewInit() {
        this.startLoadingTimeInMilliSeconds = Date.now();
    }

    setLoadingString(loadingString: string, loadingStageIndex: number) {
        if (!loadingString) return;
        this.loadingString = loadingString;
        this.loadingStages[loadingStageIndex].loadingString = loadingString;
    }

    checkLoadingTimeout() {
        this.isTimeout = false;
        this.timeoutTimer = setTimeout(() => {
            if (!this.isTimeout) {
                this.isTimeout = true;
                this.telemetryService.logEvent(TelemetryEventNames.LoadingTimeOut, {
                    source: this.Source,
                    isPublic: `${this.isPublic}`
                });
            }
        }, this.timeoutInMS);
    }
}

export interface LoadingStage {
    duration: number,
    imgSrc: string,
    loadingString: string
}
