import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataTableResponseObject, DetectorControlService, DetectorMetaData, DetectorType, DiagnosticData, Rendering, RenderingType } from 'diagnostic-data';
import { ApplensDiagnosticService } from '../../services/applens-diagnostic.service';
import { promptType, workflowNodeData, stepVariable } from "diagnostic-data";
import { WorkflowService } from '../services/workflow.service';
import WorkflowNodeBaseClass from '../node-base-class';

@Component({
  selector: 'detector-node',
  templateUrl: './detector-node.component.html',
  styleUrls: ['./detector-node.component.scss', '../node-styles.scss']
})
export class DetectorNodeComponent extends WorkflowNodeBaseClass implements OnInit {

  promptTypes: string[] = [promptType.automatic, promptType.onClick];
  loadingDetectors: boolean = false;
  loadingDetector: boolean = false;
  workflowNodeDetectors: DetectorMetaData[] = [];
  error: any;

  @Input() data: workflowNodeData;

  constructor(private _workflowServicePrivate: WorkflowService, private _applensDiagnosticService: ApplensDiagnosticService,
    private _route: ActivatedRoute, private _detectorControlService: DetectorControlService) {
    super(_workflowServicePrivate);
  }

  ngOnInit(): void {
    this.loadingDetectors = true;
    this.error = null;
    this._applensDiagnosticService.getDetectors().subscribe(detectors => {
      this.workflowNodeDetectors = detectors.filter(x => x.type === DetectorType.WorkflowNode);
      this.loadingDetectors = false;
    }, error => {
      this.loadingDetectors = false;
      this.error = error;
    });
  }

  editDetector() {
    this.data.isEditing = true;
  }

  changeDetector(event) {
    this.updateCurrentDetector(event.target.value);
  }

  updateCurrentDetector(detectorId: string) {
    this.data.detectorId = detectorId;
    this.data.variables = [];
    let idNumber = this._workflowServicePrivate.getIdNumberForNode(this, detectorId);
    this.data.name = this.data.detectorId + idNumber;

    this.loadDetector();
  }

  loadDetector() {
    let allRouteQueryParams = this._route.snapshot.queryParams;
    let additionalQueryString = '';
    let knownQueryParams = ['startTime', 'endTime'];
    Object.keys(allRouteQueryParams).forEach(key => {
      if (knownQueryParams.indexOf(key) < 0) {
        additionalQueryString += `&${key}=${encodeURIComponent(allRouteQueryParams[key])}`;
      }
    });

    this.loadingDetector = true;
    this._applensDiagnosticService.getDetector(this.data.detectorId, this._detectorControlService.startTimeString, this._detectorControlService.endTimeString, this._detectorControlService.shouldRefresh, this._detectorControlService.isInternalView, additionalQueryString).subscribe(detectorResponse => {
      this.loadingDetector = false;
      let dataSet = detectorResponse.dataset.find(x => x.renderingProperties.type === RenderingType.WorkflowResult);
      if (dataSet != null) {
        this.parseData(dataSet);
      }
    }, error => {
      this.error = error;
      this.loadingDetector = false;
    });
  }

  private parseData(dataSet: DiagnosticData) {
    let table: DataTableResponseObject = dataSet.table;
    let rendering: Rendering = dataSet.renderingProperties;
    this.data.variables = [];

    if (table.rows.length > 0) {

      let statusColIndex: number = 0;
      let markdownColIndex: number = 1;
      let variablesColIndex: number = 2;

      this.data.description = rendering.description;
      this.data.status = table.rows[0][statusColIndex];
      this.data.markdownText = table.rows[0][markdownColIndex];

      let variables: stepVariable[] = JSON.parse(table.rows[0][variablesColIndex]);
      variables.forEach(element => {

        //
        // Append the node name to the variable name to ensure
        // that variables from detectors are unique across workflow
        //

        element.name = this.data.name + '_' + element.name;
        this.data.variables.push(element);
      });
    }
  }

  refreshVariables() {
    if (this.data.detectorId != 'choosedetector') {
      this.loadDetector();
    }
  }
}
