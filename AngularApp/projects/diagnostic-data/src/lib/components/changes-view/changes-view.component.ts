import { Component, OnInit, Input } from '@angular/core';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DetectorControlService } from '../../services/detector-control.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { DetectorResponse, DiagnosticData, DataTableResponseObject, Rendering, RenderingType } from '../../models/detector';
import { Change, ChangeLevel } from '../../models/changesets';
import { animate, state, style, transition, trigger } from '@angular/animations';
import * as momentNs from 'moment';
import { ChangeAnalysisUtilities } from '../../utilities/changeanalysis-utilities';
import { DataTableUtilities } from '../../utilities/datatable-utilities';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { MatTableDataSource } from '@angular/material/table';

const moment = momentNs;
  @Component({
    selector: 'changes-view',
    templateUrl: './changes-view.component.html',
    styleUrls: ['./changes-view.component.scss'],
    animations: [
        trigger('changeRowExpand', [
          state('collapsed', style({height: '0px', minHeight: '0', visibility: 'hidden'})),
          state('expanded', style({height: '*', visibility: 'visible'})),
          transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
        ]),
      ],
  })
export class ChangesViewComponent extends DataRenderBaseComponent implements OnInit {

    @Input() changesetId: string = '';
    @Input() changesDataSet: DiagnosticData[];
    @Input() initiatedByList: any;
    changesResponse: DetectorResponse;
    dataSource: MatTableDataSource<Change>;
    displayedColumns = ['level', 'time', 'displayName', 'description', 'initiatedBy'];
    expandedElement: Change | null;
    tableItems: Change[];
    options = {
        theme: 'vs',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        minimap: {
          enabled: false
        },
        folding: true
      };
    changeLevelIcon = [{
        "imgSrc": "../../../assets/img/normalicon.png",
        "displayValue": "Normal"
    }, {
        "imgSrc": "../../../assets/img/importanticon.png",
        "displayValue": "Important"
    }];

    private _changeFeedbacks: Map<Change, boolean> = new Map<Change, boolean>();

    constructor(private diagnosticService: DiagnosticService, private detectorControlService: DetectorControlService, protected telemetryService: TelemetryService) {
        super(telemetryService);
     }

    ngOnInit() {
        this.tableItems = [];
        let changesDataItem = this.changesDataSet.find(set => (<Rendering>set.renderingProperties).type === RenderingType.ChangesView);
        if(changesDataItem && changesDataItem.table) {
            this.parseChangesData(changesDataItem.table);
        }
    }

    private parseChangesData(changesTable: DataTableResponseObject) {
        if(changesTable.rows.length > 0) {
            changesTable.rows.forEach(row => {
                let level: ChangeLevel = ChangeLevel[this.getChangeProperty(row, "level", changesTable)];
                let description = this.getChangeProperty(row, "description", changesTable);
                let oldValue    = this.getChangeProperty(row, "oldValue", changesTable);
                let newValue    = this.getChangeProperty(row, "newValue", changesTable);
                let displayName = this.getChangeProperty(row, "displayName", changesTable);
                let timestamp   = this.getChangeProperty(row, "timeStamp", changesTable);
                let jsonPath    = this.getChangeProperty(row, "jsonPath", changesTable);
                let initiatedBy = this.initiatedByList;
                this.tableItems.push({
                    "time":  moment.utc(timestamp).format("YYYY-MM-DD HH:mm"),
                    "level": level,
                    "levelIcon": this.getIconForLevel(level),
                    "displayName":ChangeAnalysisUtilities.prepareDisplayValueForTable(displayName),
                    "description": description == null || description == "" ? "N/A" : description,
                    'oldValue': oldValue,
                    'newValue': newValue,
                    'initiatedBy': ChangeAnalysisUtilities.getInitiatedByField(this.initiatedByList),
                    'jsonPath': jsonPath,
                    'originalModel': ChangeAnalysisUtilities.prepareValuesForDiffView(oldValue),
                    'modifiedModel': ChangeAnalysisUtilities.prepareValuesForDiffView(newValue),
                    'initiatedByList' : row['initiatedByList'] ? this.getInitiatedByUsers(row) : this.initiatedByList
                });
            });
            this.tableItems.sort((i1, i2) => i1.level - i2.level);
            this.expandedElement = this.tableItems[0];
            this.dataSource = new MatTableDataSource(this.tableItems);
        }
    }

    private getChangeProperty(row: any[], propertyName: string, changesTable: DataTableResponseObject): string {
        if(row.hasOwnProperty(propertyName)) {
            return row[propertyName];
        } else {
            let propertyIndex = DataTableUtilities.getColumnIndexByName(changesTable, propertyName, true);
            return propertyIndex >= 0 ? row[propertyIndex] : null;
        }
    }

    private getIconForLevel(level: ChangeLevel): string {
        switch(level){
            case ChangeLevel.Normal:
                return this.changeLevelIcon[0].imgSrc;
            case ChangeLevel.Important:
                return this.changeLevelIcon[1].imgSrc;
            case ChangeLevel.Noisy:
                return this.changeLevelIcon[2].imgSrc;
            default:
                return this.changeLevelIcon[0].imgSrc;
        }
    }

    applyFilter(filterValue: string) {
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    selectChange(changeItem: Change) {
        this.expandedElement = this.expandedElement === changeItem ? null : changeItem;

        let eventProps = this.getTelemetryPropertiesFromChange(changeItem);
        eventProps['isExpand'] = this.expandedElement === changeItem,

        this.logEvent(TelemetryEventNames.ChangeAnalysisChangeClicked, eventProps);
    }

    getFeedbackButtonClass(changeItem: Change, isHelpfulButton: boolean): string[] {
        let classNames: string[] = ["feedback-button"];

        let feedbackProvided = this._changeFeedbacks.has(changeItem);
        if (feedbackProvided) {
            classNames.push("disabled");

            let changeHelpful = this._changeFeedbacks.get(changeItem);
            if ((isHelpfulButton && !changeHelpful)
                || (!isHelpfulButton && changeHelpful)) {
                classNames.push("greyed-out");
            }
        }

        return classNames;
    }

    sendFeedback(changeItem: Change, isHelpful: boolean): void {
        let feedbackProvided = this._changeFeedbacks.has(changeItem);
        if (feedbackProvided) {
            return;
        }

        this._changeFeedbacks.set(changeItem, isHelpful);

        let eventProps = this.getTelemetryPropertiesFromChange(changeItem);
        eventProps['isHelpful'] = isHelpful.toString();

        this.logEvent(TelemetryEventNames.ChangeAnalysisChangeFeedbackClicked, eventProps);
   }

    private getTelemetryPropertiesFromChange(changeItem: Change): any {
        let eventProps = {
            'changeLevel': changeItem.level,
            'dataSource': ChangeAnalysisUtilities.getDataSourceFromChangesetId(this.changesetId),
            'displayName': changeItem.displayName,
            'jsonPath': changeItem.jsonPath,
            'changeTimestamp': changeItem.time,
            'oldValueLength': changeItem.originalModel.code.length.toString(),
            'newValueLength': changeItem.modifiedModel.code.length.toString()
        };

        return eventProps;
    }

    getInitiatedByUsers(row: any[]): any[] {
        return row['initiatedByList'].length > 0 ? row['initiatedByList'] : ['Unable to Determine'];
    }
}

