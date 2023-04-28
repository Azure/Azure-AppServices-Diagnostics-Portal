import { Component, Inject, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DiagnosticData, DataTableResponseObject, DetectorResponse, RenderingType, DataTableResponseColumn } from '../../models/detector';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { DiagnosticService } from '../../services/diagnostic.service';
import { Router} from '@angular/router';
import { DataSet, Timeline} from 'vis';
import { DetectorControlService } from '../../services/detector-control.service';
import * as moment from 'moment';
import { Subscription, interval } from 'rxjs';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { SettingsService} from '../../services/settings.service';
import { ChangeAnalysisUtilities } from '../../utilities/changeanalysis-utilities';
import { DataTableUtilities } from '../../utilities/datatable-utilities';
import { ChangeAnalysisService} from '../../services/change-analysis.service';

@Component({
  selector: 'changesets-view',
  templateUrl: './changesets-view.component.html',
  styleUrls: ['./changesets-view.component.scss',
'../insights/insights.component.scss']
})
export class ChangesetsViewComponent extends DataRenderBaseComponent implements OnInit,OnDestroy {
    isPublic: boolean;
    changeSetText: string = '';
    scanDate: string = '';
    selectedChangeSetId: string = '';
    changesDataSet: DiagnosticData[];
    loadingChangesTable: boolean = false;
    loadingChangesTimeline: boolean = false;
    changesTableError: string = '';
    sourceGroups = new DataSet([
        {id: 1, content: '<strong> Properties </strong>'},
        {id: 2, content: '<strong> Code </strong>'}
    ]);
    scanStatusMessage: string = '';
    allowScanAction: boolean = false;
    changeSetsCache = {};
    subscription: Subscription;
    scanState: string = '';
    showViewChanges: boolean = false;
    timeLineDataSet: any;
    changesTimeline: Timeline;
    changeSetsLocalCopy: {};
    initiatedBy: string[];
    changeSetsColumn: DataTableResponseColumn[];
    resourceChangeGroups: DiagnosticData;
    private readonly noScanMsg: string = 'No recent scans were performed on this web app.';

    constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, protected telemetryService: TelemetryService,
    protected changeDetectorRef: ChangeDetectorRef, protected diagnosticService: DiagnosticService,
    private detectorControlService: DetectorControlService, private settingsService: SettingsService,
     private router:Router, protected changeAnalysisService: ChangeAnalysisService) {
        super(telemetryService);
        this.isPublic = config && config.isPublic;
    }

    ngOnInit() {
    super.ngOnInit();
    this.changeAnalysisService.getResourceChangeGroups.subscribe(
        updatedChangeGroups => {
            if(updatedChangeGroups != '') {
                this.resourceChangeGroups = JSON.parse(updatedChangeGroups);
                this.processData(this.resourceChangeGroups);
            }
        });

    }

    protected processData(data: DiagnosticData) {
        super.processData(data);
        this.changeSetsColumn = data.table.columns;
        this.parseData(data.table);
    }

    private parseData(data: DataTableResponseObject) {
        let rows = data.rows;
        let resourceName = this.changeAnalysisService.getCurrentResourceName();
        let isAppService = this.changeAnalysisService.getAppService();
        if (rows.length > 0 && rows[0].length > 0) {
            let batchChanges = this.getBatchChanges(data);
            this.changeSetText = batchChanges.length === 1 ? `1 change detected` : `${batchChanges.length} changes have been detected`;
            this.changeSetText = resourceName != '' ? this.changeSetText + ` for ${resourceName}` : this.changeSetText;
            this.constructOrUpdateTimeline(data);
            if(!this.developmentMode) {
                this.initializeChangesView(data);
            }
            if(isAppService) {
                // Convert UTC timestamp to user readable date
                this.scanDate = rows[0][6] != '' ? 'Changes were last scanned on ' + moment.utc(rows[0][6]).format("YYYY-MM-DD HH:mm") : this.noScanMsg + ' Please enable Change Analysis using Change Analysis Settings.';
            } else {
                this.scanDate = rows[0][6] != '' ? 'Changes were last scanned on ' + moment.utc(rows[0][6]).format("YYYY-MM-DD HH:mm") : 'No recent scans were performed on this resource.';
            }

            if(this.isPublic) {
                this.checkInitialScanState();
             }
        } else {
            if(isAppService) {
                 this.scanDate = this.noScanMsg + ' Please enable Change Analysis using Change Analysis Settings.';
            } else {
                this.scanDate = '';
            }
             this.changeSetText = `No changes have been detected`;
             this.changeSetText = resourceName != '' ? this.changeSetText + ` for ${resourceName}` : this.changeSetText;
             this.checkInitialScanState();
             if(this.changesTimeline) {
                 this.timeLineDataSet.clear();
                 this.changesDataSet = null;
                 this.loadingChangesTable = false;
                 this.changesTableError = '';
                 this.changeDetectorRef.detectChanges();
             }

        }
    }

    constructOrUpdateTimeline(data: DataTableResponseObject) {
        if(this.changesTimeline) {
            this.updateTimeline(data);
        } else {
            this.constructTimeline(data);
        }
    }

    updateTimeline(data: DataTableResponseObject) {
        this.timeLineDataSet.clear();
        let changeSets = data.rows;
        let updatedTimelineItems = [];
        changeSets.forEach(changeset => {
            this.changeSetsLocalCopy[changeset[0]] = changeset;
            updatedTimelineItems.push({
                id: changeset[0],
                content: ' ',
                start: changeset[3],
                group: ChangeAnalysisUtilities.findGroupBySource(changeset[2])
            })
        });
        this.timeLineDataSet.add(updatedTimelineItems);
    }

    private constructTimeline(data: DataTableResponseObject) {
        this.loadingChangesTimeline = true;
        let changeSets = data.rows;
        let timelineItems = [];
        this.changeSetsLocalCopy = {};
        changeSets.forEach(changeset => {
        this.changeSetsLocalCopy[changeset[0]] = changeset;
        timelineItems.push({
            id: changeset[0],
            content: ' ',
            start: changeset[3],
            group: ChangeAnalysisUtilities.findGroupBySource(changeset[2])
        });
        });
        this.loadingChangesTimeline = false;
        // DOM element where the Timeline will be attached
        let container = document.getElementById('timeline');

        this.timeLineDataSet = new DataSet(timelineItems);

        // Configuration for the Timeline
        let options = {
            maxHeight: 400,
            horizontalScroll: true,
            verticalScroll: true,
            // Set the timeline to show dates in UTC.
            moment: function (date) {
                return moment.utc(date);
              }
            };

        // Create a Timeline
        this.changesTimeline = new Timeline(container, this.timeLineDataSet, this.sourceGroups, options);
        this.changesTimeline.on('select', this.triggerChangeEvent);
    }

    private initializeChangesView(data: DataTableResponseObject) {
        if (data.rows.length == 0) {
            return;
        }

        let changeSetIdColumnIndex = DataTableUtilities.getColumnIndexByName(data, "ChangeSetId");
        let inputsColumnIndex = DataTableUtilities.getColumnIndexByName(data, "Inputs");
        let initiatedByColumnIndex = DataTableUtilities.getColumnIndexByName(data, "InitiatedBy");
        let latestChangeSetId = data.rows[0][changeSetIdColumnIndex];
        let latestChangeSet = data.rows[0][inputsColumnIndex];
        this.selectedChangeSetId = latestChangeSetId;
        // Send all changes row instead of latest row.
        if(latestChangeSet != null) {
            this.loadingChangesTable = true;
            this.changesTableError = '';
            this.changesDataSet = [{
               table:{
                    columns:[],
                    rows: this.getBatchChanges(data)
                    },
                renderingProperties: {
                    type: RenderingType.ChangesView,
                    title: "",
                    description: null
                }
            }];
            this.initiatedBy = this.changeSetsLocalCopy.hasOwnProperty(data.rows[0][0]) ? this.getInitiatedByUsers(this.changeSetsLocalCopy[data.rows[0][0]]) : [];
            this.changeDetectorRef.detectChanges();
            this.loadingChangesTable = false;
            this.changesTableError = '';
        }
    }

    // Trigger change event to set component properties
    // This is a hack to trigger angular event, because updating Angular component properties in callback of vis.js does not update the Angular UI
    // TODO: Find a better way of updating angular UI
    private triggerChangeEvent(properties: any): void {
        let domelement = <HTMLInputElement>document.getElementById("changeSetId");
        if(properties.items.length > 0 && typeof properties.items[0] != 'undefined') {
            domelement.value = properties.items[0];
            let event = new Event('change');
            domelement.dispatchEvent(event);
        }
    }

     refreshChangesTable(): void {
         this.logTimelineEventClick();
        let changeSetIdDom = <HTMLInputElement>document.getElementById("changeSetId");
        if(changeSetIdDom.value != undefined) {
            this.selectedChangeSetId =  changeSetIdDom.value;
            this.loadChangesTable(this.selectedChangeSetId);
        }
    }

    private loadChangesTable(changeSetId: string): void {
        this.loadingChangesTable = true;
        this.changesTableError = '';
        // Check cache first
        if (this.changeSetsCache.hasOwnProperty(changeSetId)) {
            this.changesDataSet = this.changeSetsCache[changeSetId];
            this.initiatedBy = this.changeSetsLocalCopy.hasOwnProperty(changeSetId) ? this.getInitiatedByUsers(this.changeSetsLocalCopy[changeSetId]) : [];
            // Angular change detector does not check contents of array itself, so manually trigger the ui to update.
            this.changeDetectorRef.detectChanges();
            this.loadingChangesTable = false;
            this.changesTableError = '';
        } else {
            let queryParams = `&fId=102&btnId=9&inpId=5&val=${encodeURIComponent(changeSetId)}`;
            if(!this.changeAnalysisService.getAppService()) {
                let dependentResourceId = this.changeAnalysisService.getResouceUri();
                let sub = ChangeAnalysisUtilities.getSubscription(dependentResourceId);
                let resourceGroups = ChangeAnalysisUtilities.getResourceGroup(dependentResourceId);
                let provider = ChangeAnalysisUtilities.getResourceType(dependentResourceId);
                let resourceName = ChangeAnalysisUtilities.getResourceName(dependentResourceId, provider);
                queryParams += `&inpId=1&val=${encodeURIComponent(sub)}&inpId=2&val=${encodeURIComponent(resourceGroups)}&inpId=3&val=${encodeURIComponent(provider)}&inpId=4&val=${encodeURIComponent(resourceName)}`;
            }

            this.diagnosticService.getDetector(this.detector, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
            true, this.detectorControlService.isInternalView, queryParams).subscribe((response: DetectorResponse) =>{
            this.changeSetsCache[changeSetId] = response.dataset;
            this.changesDataSet = this.changeSetsCache[changeSetId];
            this.initiatedBy = this.changeSetsLocalCopy.hasOwnProperty(changeSetId) ?  this.getInitiatedByUsers(this.changeSetsLocalCopy[changeSetId]) : [];
            this.changeDetectorRef.detectChanges();
            this.loadingChangesTable = false;
            this.changesTableError = '';
        }, (error: any) => {
            this.loadingChangesTable = false;
            this.changesTableError = 'Unable to load changes for the selected change group. Please try refresh or try after sometime';
        });
        }
    }

     scanNow():void {
        this.logOndemandScanClick();
        this.scanState = "Submitting";
        this.scanStatusMessage = "Submitting scan request...";
        this.allowScanAction = false;
        let queryParams = `&fId=103&btnId=9&inpId=5&val=submitscan`;
        if(!this.changeAnalysisService.getAppService()) {
            let dependentResourceId = this.changeAnalysisService.getResouceUri();
            let sub = ChangeAnalysisUtilities.getSubscription(dependentResourceId);
            let resourceGroups = ChangeAnalysisUtilities.getResourceGroup(dependentResourceId);
            let provider = ChangeAnalysisUtilities.getResourceType(dependentResourceId);
            let resourceName = ChangeAnalysisUtilities.getResourceName(dependentResourceId, provider);
            queryParams += `&inpId=1&val=${encodeURIComponent(sub)}&inpId=2&val=${encodeURIComponent(resourceGroups)}&inpId=3&val=${encodeURIComponent(provider)}&inpId=4&val=${encodeURIComponent(resourceName)}`;
        }
        this.diagnosticService.getDetector(this.detector,  this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
            true, this.detectorControlService.isInternalView, queryParams).subscribe((response: DetectorResponse) => {
                let dataset = response.dataset;
                let table = dataset[0].table;
                let rows = table.rows;
                let submissionState = rows[0][1];
                this.scanState = submissionState;
                // Request has been submitted, update the UI with the state.
                this.setScanState(submissionState);
                if (submissionState == 'NotEnabled') {
                    if(this.subscription) {
                        this.subscription.unsubscribe();
                    }
                    this.setScanState("");
                    this.scanStatusMessage = 'Unable to submit scan request. Please check if you have enabled scan for code changes in settings and try again.';
                } else {
                    // Start polling every 15 secs to see the progress.
                    this.subscription = interval(15000).subscribe(res => {
                        this.pollForScanStatus();
                    });
                }
            }, (error: any) => {
                this.scanState = "";
                this.scanStatusMessage = "Unable to submit scan request. Please refresh or try again after sometime";
        });
    }

    private checkInitialScanState() {
        if (this.scanDate.startsWith(this.noScanMsg)) {
            this.scanDate = this.noScanMsg;
        }
        this.scanStatusMessage = "Checking recent scan status...";
        this.scanState = "Polling";
        this.allowScanAction = false;
        let queryParams = `&fId=103&btnId=9&inpId=5&val=checkscan`;
        if(!this.changeAnalysisService.getAppService()) {
            let dependentResourceId = this.changeAnalysisService.getResouceUri();
            let sub = ChangeAnalysisUtilities.getSubscription(dependentResourceId);
            let resourceGroups = ChangeAnalysisUtilities.getResourceGroup(dependentResourceId);
            let provider = ChangeAnalysisUtilities.getResourceType(dependentResourceId);
            let resourceName = ChangeAnalysisUtilities.getResourceName(dependentResourceId, provider);
            queryParams += `&inpId=1&val=${encodeURIComponent(sub)}&inpId=2&val=${encodeURIComponent(resourceGroups)}&inpId=3&val=${encodeURIComponent(provider)}&inpId=4&val=${encodeURIComponent(resourceName)}`;
        }
        this.diagnosticService.getDetector(this.detector, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
            true, this.detectorControlService.isInternalView, queryParams).subscribe((response: DetectorResponse) => {
                let dataset = response.dataset;
                let table = dataset[0].table;
                let rows = table.rows;
                let submissionState = rows[0][1];
                this.scanState = submissionState;
                if (submissionState == "Completed") {
                    this.setScanState(submissionState);
                    let completedTime = rows[0][3];
                    let currentMoment = moment();
                    let completedMoment = moment(completedTime);
                    let diff = currentMoment.diff(completedMoment, 'seconds');
                    // If scan has been completed more than a minute ago, display default message
                    if (diff >= 60) {
                        this.setDefaultScanStatus();
                    } else {
                        this.scanStatusMessage = "Scanning is complete. Click the below button to view the latest changes now.";
                        this.allowScanAction = true;
                        this.showViewChanges = true;
                    }
                } else if (submissionState == "No active requests") {
                    this.setScanState("");
                    this.setDefaultScanStatus();
                } else {
                    this.subscription = interval(5000).subscribe(res => {
                        this.pollForScanStatus();
                    });
                }
            }, (error: any) => {
                // Stop timer in case of any error
                if (this.subscription) {
                    this.subscription.unsubscribe();
                }
                this.scanState = "";
                this.setScanState("");
            });
    }

    private pollForScanStatus() {
        this.scanStatusMessage = "Monitoring scan status...";
        this.scanState = "Polling";
        this.allowScanAction = false;
        let queryParams = `&fId=103&btnId=9&inpId=5&val=checkscan`;
        if(!this.changeAnalysisService.getAppService()) {
            let dependentResourceId = this.changeAnalysisService.getResouceUri();
            let sub = ChangeAnalysisUtilities.getSubscription(dependentResourceId);
            let resourceGroups = ChangeAnalysisUtilities.getResourceGroup(dependentResourceId);
            let provider = ChangeAnalysisUtilities.getResourceType(dependentResourceId);
            let resourceName = ChangeAnalysisUtilities.getResourceName(dependentResourceId, provider);
            queryParams += `&inpId=1&val=${encodeURIComponent(sub)}&inpId=2&val=${encodeURIComponent(resourceGroups)}&inpId=3&val=${encodeURIComponent(provider)}&inpId=4&val=${encodeURIComponent(resourceName)}`;
        }
        this.diagnosticService.getDetector(this.detector, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
            true, this.detectorControlService.isInternalView, queryParams).subscribe((response: DetectorResponse) => {
                let dataset = response.dataset;
                let table = dataset[0].table;
                let rows = table.rows;
                let submissionState = rows[0][1];
                this.scanState = submissionState;
                // Inscan & Submitted is not a final state, so continue polling.
                if (submissionState == "InScan" || submissionState == "Submitted") {
                    this.setScanState(submissionState);
                } else {
                    // Completed or Failed is a final state, stop polling
                    this.setScanState(submissionState, rows[0][3]);
                    if(this.subscription) {
                        this.subscription.unsubscribe();
                    }
                }
            }, (error: any) => {
                // Stop timer in case of any error
                if(this.subscription) {
                    this.subscription.unsubscribe();
                }
                this.scanState = "";
                this.setScanState("");
            });
    }

    private setScanState(submissionState: string, completedTime?: string) {
        switch(submissionState) {
            case "Submitted":
            case "InScan":
                this.scanStatusMessage = "Scanning is in progress. This may take few minutes";
                this.allowScanAction = false;
                break;
            case "Completed":
                this.scanStatusMessage = "Scanning is complete. Click the below button to view the latest changes now.";
                this.allowScanAction = true;
                this.showViewChanges = true;
                break;
            case "Failed":
                this.scanStatusMessage = "The last scan request failed. Click the below button to submit new scan request";
                this.allowScanAction = true;
                this.showViewChanges = false;
                break;
            default:
                this.setDefaultScanStatus();
                break;
        }
    }

    // Gets icon class for scan message based on scan state.
    getScanStatusClass() {
        let currentScanState = this.scanState;
        switch(currentScanState) {
            case "Polling":
            return {
                'fa-circle-o-notch' : true,
                'fa-spin': true,
                'spin-icon': true
            };
            case "Submitting":
            return {
                'fa-circle-o-notch' : true,
                'fa-spin': true,
                'spin-icon': true
            };
            case "Submitted":
            return {
                'fa-circle-o-notch' : true,
                'fa-spin': true,
                'spin-icon': true
            };
            case "InScan":
            return {
                'fa-circle-o-notch' : true,
                'fa-spin': true,
                'spin-icon': true
            };
            case "Completed":
            return {
                'fa-check': true
            }
            case "Failed":
            return {
                'fa-times-circle': true
            }
            default:
            return {

            }
        }
    }

    refreshTimeline(): void {
        this.loadingChangesTimeline = true;
        this.scanStatusMessage = "Fetching scan results...";
        this.scanState = "Polling";
        this.allowScanAction = false;
        let queryParams = `&fId=102&btnId=9&inpId=5&val=*`;
        if(!this.changeAnalysisService.getAppService()) {
            let dependentResourceId = this.changeAnalysisService.getResouceUri();
            let sub = ChangeAnalysisUtilities.getSubscription(dependentResourceId);
            let resourceGroups = ChangeAnalysisUtilities.getResourceGroup(dependentResourceId);
            let provider = ChangeAnalysisUtilities.getResourceType(dependentResourceId);
            let resourceName = ChangeAnalysisUtilities.getResourceName(dependentResourceId, provider);
            queryParams += `&inpId=1&val=${encodeURIComponent(sub)}&inpId=2&val=${encodeURIComponent(resourceGroups)}&inpId=3&val=${encodeURIComponent(provider)}&inpId=4&val=${encodeURIComponent(resourceName)}`;
        }
        this.diagnosticService.getDetector(this.detector, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
        true, this.detectorControlService.isInternalView, queryParams).subscribe((response: DetectorResponse) =>{
            // Reload timeline with latest changes
            let newChangeRows = response.dataset[0]['table'];
            let newTimelineItems = [];
            if(this.changesTimeline) {
            this.timeLineDataSet.clear();
            newChangeRows.rows.forEach(row => {
                let existingItem = this.timeLineDataSet.get(row[0]);
                // Add to timeline if it doesnt exist.
                if(!existingItem) {
                    newTimelineItems.push({
                    id: row[0],
                    content: ' ',
                    start: row[3],
                    group: ChangeAnalysisUtilities.findGroupBySource(row[2])
                });
                }
            });

            this.timeLineDataSet.add(newTimelineItems);
            this.loadingChangesTimeline = false;
            this.initializeChangesView(newChangeRows);
            } else {
                this.constructTimeline(newChangeRows);
                this.initializeChangesView(newChangeRows);
            }
            let totalItems = newChangeRows.rows.length;
            if(totalItems > 0) {
                let batchChanges = this.getBatchChanges(newChangeRows);
                this.changeSetText = batchChanges.length + ' changes have been detected';
                // Convert UTC timestamp to user readable date
                this.scanDate = 'Changes were last scanned on ' + moment.utc(newChangeRows.rows[0][6]).format("YYYY-MM-DD HH:mm");
            } else {
                this.changeSetText = 'No changes detected';
            }
            this.setDefaultScanStatus();
        }, (error: any) => {
            this.scanStatusMessage = "Unable to get scan results";
            this.scanState = '';
        });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if(this.changesTimeline) {
            this.changesTimeline.destroy();
        }
    }

    setDefaultScanStatus(): void {
        this.scanStatusMessage = "Click the below button to to scan your resource and get the latest changes";
        this.allowScanAction = true;
        this.showViewChanges = false;
        this.scanState = '';
    }

    logTimelineEventClick(): void {
        let eventProps = {
            'Detector': this.detector
        };
        this.logEvent(TelemetryEventNames.ChangeAnalysisTimelineClicked, eventProps);
    }

    logOndemandScanClick(): void {
        let eventProps = {
            'Detector': this.detector,
        }
        this.logEvent(TelemetryEventNames.OndemandScanClicked, eventProps);
    }

    navigateToSettings(): void {
        let path = this.settingsService.getUrlToNavigate();
        this.router.navigateByUrl(path);
   }


   getColumnIndexByName(searchColumnName: string):number {
        return this.changeSetsColumn.findIndex(column => column.columnName.toLowerCase() === searchColumnName.toLowerCase());
    }

    getInitiatedByUsers(changeSet: any[]):any[] {
        let initiatedByListIndex = this.getColumnIndexByName('initiatedByList');
        let initiatedByIndex = this.getColumnIndexByName('initiatedBy');
        if(initiatedByListIndex >= 0) {
            return changeSet[initiatedByListIndex].length > 0 ? changeSet[initiatedByListIndex] : ['Unable to Determine'];
        }
        if(changeSet[initiatedByIndex] === null || changeSet[initiatedByIndex] === "") {
            return ["N/A"];
        }
        return [changeSet[initiatedByIndex]];
    }

    getBatchChanges(data: DataTableResponseObject): any[][] {
        let changeDetails = [];
        let columnIndex = DataTableUtilities.getColumnIndexByName(data, "Inputs");
        data.rows.forEach(row => {
            if (row[columnIndex] != null && row[columnIndex].length > 0) {
                changeDetails = changeDetails.concat(row[columnIndex]);
            }
        });
        return changeDetails;
    }
}
