import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';
import { DiagnosticData, Rendering, DataTableResponseObject, DetectorResponse } from '../../models/detector';
import { Form, FormInput, InputType, FormButton, ButtonStyles, RadioButtonList, Dropdown, DateTimePicker } from '../../models/form';
import { DiagnosticService } from '../../services/diagnostic.service';
import { DetectorControlService } from '../../services/detector-control.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { DirectionalHint } from 'office-ui-fabric-react/lib/Tooltip';
import { IDropdownOption, IDropdown } from 'office-ui-fabric-react';
import { UriUtilities } from '../../utilities/uri-utilities';
import { QueryResponseService } from '../../services/query-response.service';
import * as moment from 'moment';
import { TimeUtilities } from '../../utilities/time-utilities';
import { GenericDetectorCopilotService } from '../../services/generic-detector-copilot.service';

@Component({
  selector: 'custom-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss']
})
export class FormComponent extends DataRenderBaseComponent {
  renderingProperties: Rendering;
  detectorForms: Form[] = [];
  isPublic: boolean;
  directionalHint = DirectionalHint.topLeftEdge;
  datasourcesKey: string = '';
  readonly maxInputLength = 150;

  startMoment: moment.Moment;

  @ViewChild('formDropdown') formdropDownRef: ElementRef<IDropdown>;
  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private _diagnosticService: DiagnosticService, private _router: Router, protected telemetryService: TelemetryService,
    private detectorControlService: DetectorControlService, private _queryResponseService: QueryResponseService,
    private activatedRoute: ActivatedRoute,
    private locationService: Location,
    private copilotService: GenericDetectorCopilotService
  ) {
    super(telemetryService);
    this.isPublic = config && config.isPublic;
  }

  protected processData(data: DiagnosticData) {
    super.processData(data);
    this.renderingProperties = <Rendering>data.renderingProperties;
    this.parseData(data.table);
    if (this.detectorControlService.detectorQueryParamsString != "" && !this.developmentMode) {
      this.setInputValues();
      this.getDetectorResponse();
    }
  }

  public isText(inputType: InputType) {
    return inputType === InputType.TextBox;
  }

  public isButton(inputType: InputType) {
    return inputType === InputType.Button;
  }

  public isRadioButtonList(inputType: InputType) {
    return inputType === InputType.RadioButton;
  }

  public isDropdown(inputType: InputType) {
    return inputType === InputType.DropDown;
  }

  public isDateTimePicker(inputType: InputType) {
    return inputType === InputType.DateTimePicker;
  }

  // parses the incoming data to render a form
  private parseData(data: DataTableResponseObject) {
    let totalForms = data.rows.length;
    if (totalForms > 0) {
      for (let i = 0; i < totalForms; i++) {
        this.detectorForms[i] = new Form();
        this.detectorForms[i].formId = data.rows[i][0];
        this.detectorForms[i].formTitle = data.rows[i][1];
        let formInputs = data.rows[i][2];
        for (let ip = 0; ip < formInputs.length; ip++) {
          if (formInputs[ip]["inputType"] === InputType.Button) {
            this.detectorForms[i].formButtons.push(new FormButton(
              `${this.detectorForms[i].formId}.${formInputs[ip]["inputId"]}`,
              formInputs[ip]["inputId"],
              formInputs[ip]["inputType"],
              formInputs[ip]["label"],
              formInputs[ip]["isRequired"],
              formInputs[ip]["buttonStyle"]
            ));
          }
          else if (formInputs[ip]["inputType"] === InputType.RadioButton) {
            this.detectorForms[i].formInputs.push(new RadioButtonList(
              `${this.detectorForms[i].formId}.${formInputs[ip]["inputId"]}`,
              formInputs[ip]["inputId"],
              formInputs[ip]["inputType"],
              formInputs[ip]["label"],
              formInputs[ip]["items"],
              formInputs[ip]["toolTip"] != undefined ? formInputs[ip]["toolTip"] : "",
              formInputs[ip]["tooltipIcon"] != "" ? formInputs[ip]["tooltipIcon"] : "fa-info-circle",
              formInputs[ip]["isVisible"] != undefined ? formInputs[ip]["isVisible"] : true
            ));
          }
          else if (this.isDropdown(formInputs[ip]["inputType"])) {
            this.detectorForms[i].formInputs.push(new Dropdown(
              `formDropdown-${this.detectorForms[i].formId}-${formInputs[ip]["inputId"]}`,
              formInputs[ip]["inputId"],
              formInputs[ip]["inputType"],
              formInputs[ip]["label"],
              formInputs[ip]["dropdownOptions"],
              formInputs[ip]["defaultSelectedKey"],
              formInputs[ip]["isMultiSelect"],
              formInputs[ip]["defaultSelectedKeys"],
              formInputs[ip]["toolTip"] != undefined ? formInputs[ip]["toolTip"] : "",
              formInputs[ip]["tooltipIcon"] != "" ? formInputs[ip]["tooltipIcon"] : "fa-info-circle",
              formInputs[ip]["children"] != undefined ? formInputs[ip]["children"] : [],
              formInputs[ip]["isVisible"] != undefined ? formInputs[ip]["isVisible"] : true,
              formInputs[ip]["submitOnSelection"] != undefined ? formInputs[ip]["submitOnSelection"] : false
            ));
            if(formInputs[ip]["submitOnSelection"] !=null && formInputs[ip]["submitOnSelection"] == true){
              if(formInputs[ip]["defaultSelectedKey"] != null && formInputs[ip]["defaultSelectedKey"] != ""){
                this.OnSubmitFormAction(this.detectorForms[i].formId, -1);
              }
            }
          }
          else if(this.isDateTimePicker(formInputs[ip]["inputType"])) {
            this.detectorForms[i].formInputs.push(new DateTimePicker(
              `${this.detectorForms[i].formId}.${formInputs[ip]["inputId"]}`,
              formInputs[ip]["inputId"],
              formInputs[ip]["inputType"],
              formInputs[ip]["label"],
              moment.utc(formInputs[ip]["defaultSelectedDateTime"]),
              moment.utc(formInputs[ip]["restrictToDate"]),
              formInputs[ip]["showDatePickerOnly"],
              formInputs[ip]["isVisible"] != undefined ?  formInputs[ip]["isVisible"] : true,
              formInputs[ip]["isRequired"] != undefined ?  formInputs[ip]["isRequired"] : false,
              formInputs[ip]["toolTip"] != undefined ? formInputs[ip]["toolTip"] : "",
              formInputs[ip]["tooltipIcon"] != "" ? formInputs[ip]["tooltipIcon"] : "fa-info-circle"
              ));
          }
          else {
            this.detectorForms[i].formInputs.push(new FormInput(
              `${this.detectorForms[i].formId}.${formInputs[ip]["inputId"]}`,
              formInputs[ip]["inputId"],
              formInputs[ip]["inputType"],
              formInputs[ip]["label"],
              formInputs[ip]["isRequired"],
              formInputs[ip]["toolTip"] != undefined ? formInputs[ip]["toolTip"] : "",
              formInputs[ip]["tooltipIcon"] != "" ? formInputs[ip]["tooltipIcon"] : "fa-info-circle",
              formInputs[ip]["isVisible"] != undefined ? formInputs[ip]["isVisible"] : true));
          }
        }
      }
    }
  }

  OnSubmitFormAction(formId: any, buttonId: any) {
    let formToExecute = this.detectorForms.find(form => form.formId == formId);
    if (formToExecute != undefined) {
      // validate inputs. If there are validation errors displayed, do not proceed to execution
      if (!this.validateInputs(formToExecute.formInputs)) {
        return;
      }
      // Setting loading indicator and removing the existing form response from the ui
      formToExecute.loadingFormResponse = true;
      formToExecute.formResponse = undefined;
      formToExecute.errorMessage = '';
      let queryParams = `&fId=${formId}&btnId=${buttonId}`;
      formToExecute.formInputs.forEach(ip => {
        if (ip.isVisible) {
          if (this.isDropdown(ip.inputType)) {
            let val = this.getQueryParamForDropdown(ip);
            queryParams += `&inpId=${ip.inputId}&val=${val}&inpType=${ip.inputType}&isMultiSelect=${ip["isMultiSelect"]}`;
          } else {
            queryParams += `&inpId=${ip.inputId}&val=${ip.inputValue}&inpType=${ip.inputType}`;
          }
        }
      });
      this.activatedRoute.queryParams.subscribe(allRouteParams => {
        queryParams = UriUtilities.addAdditionalQueryParams(allRouteParams, queryParams);
      });
      // Send telemetry event for Form Button click
      this.logFormButtonClick(formToExecute.formTitle);
      if (this.developmentMode) {
        // compile the code and show response
        var body = {
          script: this.executionScript
        };
        this._diagnosticService.getCompilerResponse(body, false, '', this.detectorControlService.startTimeString,
          this.detectorControlService.endTimeString, '', '', {
          formQueryParams: queryParams,
          scriptETag: this.compilationPackage.scriptETag,
          assemblyName: this.compilationPackage.assemblyName,
          getFullResponse: true
        })
          .subscribe((response: any) => {
            this.datasourcesKey = this._queryResponseService.appendDataSources(response.body, this.datasourcesKey);
            formToExecute.loadingFormResponse = false;
            if (response.body != undefined) {
              // If the script etag returned by the server does not match the previous script-etag, update the values in memory
              if (response.headers.get('diag-script-etag') != undefined && this.compilationPackage.scriptETag !== response.headers.get('diag-script-etag')) {
                this.compilationPackage.scriptETag = response.headers.get('diag-script-etag');
                this.compilationPackage.assemblyName = response.body.compilationOutput.assemblyName;
              }
              formToExecute.formResponse = response.body.invocationOutput;
              formToExecute.errorMessage = '';
            }
          }, ((error: any) => {
            formToExecute.loadingFormResponse = false;
            formToExecute.errorMessage = 'Something went wrong while loading data';
          }));
      } else {
        // Forms specific params
        let detectorParams = {
          'detectorId': this.detector,
          'fId': formId,
          'btnId': buttonId,
          'inputs': [],
        }
        formToExecute.formInputs.forEach(ip => {
          if (ip.isVisible) {
            if (this.isDropdown(ip.inputType)) {
              let val = this.getQueryParamForDropdown(ip);
              detectorParams.inputs.push({
                'inpId': ip.inputId,
                'val': val,
                'inpType': ip.inputType,
                'isMultiSelect': ip["isMultiSelect"]
              });
            } else {
              detectorParams.inputs.push({
                'inpId': ip.inputId,
                'val': ip.inputValue,
                'inpType': ip.inputType
              });
            }
          }
        });
        let detectorQueryParamsString = JSON.stringify(detectorParams);
        if (!this.isPublic) {
          let currentURL = new URL(window.location.href);
          currentURL.searchParams.set("detectorQueryParams", detectorQueryParamsString);
          this.locationService.go(currentURL.pathname + currentURL.search);
        }
        this.detectorControlService.setDetectorQueryParams(detectorQueryParamsString);
        this.getDetectorResponse();
      }
    }
  }

  setInputValues() {
    let detectorQueryParams = JSON.parse(this.detectorControlService.detectorQueryParamsString);
    if (detectorQueryParams != undefined && detectorQueryParams.detectorId == this.detector) {
      let formToSetValues = this.detectorForms.find(form => form.formId == detectorQueryParams.fId);
      detectorQueryParams.inputs.forEach(ip => {
        let inputElement = formToSetValues.formInputs.find(input => input.inputId == ip.inpId);
        inputElement.inputType = ip.inpType;
        if (this.isDropdown(ip.inpType)) {
          let selection = ip.val;
          let isMultiSelect = ip["isMultiSelect"];
          if (isMultiSelect) {
            inputElement["defaultSelectedKeys"] = selection.split(",");
            inputElement.inputValue = selection.split(",");
          } else {
            inputElement["defaultSelectedKey"] = selection;
            inputElement.inputValue = selection;
          }
          // Set visibility in case detector refreshed or opened with deep link
          inputElement.isVisible = true;
        } else if (this.isDateTimePicker(ip.inpType)) {
          (inputElement as DateTimePicker).selectedMoment = moment.utc(ip.val);
          inputElement.inputValue = ip.val;
        } else {
          inputElement.inputValue = ip.val;
        }
      });
    }
  }

  getDetectorResponse() {
    let detectorQueryParams = JSON.parse(this.detectorControlService.detectorQueryParamsString);
    if (detectorQueryParams != undefined && detectorQueryParams.detectorId == this.detector) {
      let formToExecute = this.detectorForms.find(form => form.formId == detectorQueryParams.fId);
      let queryParams = `&fId=${detectorQueryParams.fId}&btnId=${detectorQueryParams.btnId}`;
      detectorQueryParams.inputs.forEach(ip => {
        queryParams += `&inpId=${ip.inpId}&val=${ip.val}&inpType=${ip.inpType}`;
      });
      // Setting loading indicator and removing the existing form response from the ui
      formToExecute.loadingFormResponse = true;
      formToExecute.formResponse = undefined;
      formToExecute.errorMessage = '';

      this._diagnosticService.getDetector(this.detector, this.detectorControlService.startTimeString, this.detectorControlService.endTimeString,
        this.detectorControlService.shouldRefresh, this.detectorControlService.isInternalView, queryParams).subscribe((response: DetectorResponse) => {
          formToExecute.formResponse = response;
          formToExecute.errorMessage = '';
          formToExecute.loadingFormResponse = false;

          this.copilotService.processAsyncFormsResponse(formToExecute.formId, response);
        }, (error: any) => {
          formToExecute.loadingFormResponse = false;
          formToExecute.errorMessage = 'Something went wrong while loading data';
        });
    }
  }

  validateInputs(formInputs: FormInput[]): boolean {
    for (let input of formInputs) {
      const hasInputValue = input.inputValue != undefined && input.inputValue != "";
      if ((input.isRequired && !hasInputValue) || (hasInputValue && input.inputValue.length > this.maxInputLength)) {
        input.displayValidation = true;
        return false;
      } 
    }
    return true;
  }

  inputChanged(formInput: FormInput) {
    formInput.displayValidation = false;
  }

  getButtonClass(buttonStyle: ButtonStyles): string {
    switch (buttonStyle) {
      case ButtonStyles.Primary:
        return "btn btn-primary";
      case ButtonStyles.Secondary:
        return "btn btn-secondary";
      case ButtonStyles.Success:
        return "btn btn-success";
      case ButtonStyles.Danger:
        return "btn btn-danger";
      case ButtonStyles.Warning:
        return "btn btn-warning";
      case ButtonStyles.Info:
        return "btn btn-info";
      case ButtonStyles.Light:
        return "btn btn-light";
      case ButtonStyles.Dark:
        return "btn btn-dark";
      case ButtonStyles.Link:
        return "btn btn-link";
      default:
        return "btn btn-primary";
    }
  }

  logFormButtonClick(formTitle?: string) {
    var eventProps = {
      'Detector': this.detector,
      'DevelopmentMode': this.developmentMode,
      'FormTitle': formTitle ? formTitle : ""
    };
    this.logEvent(TelemetryEventNames.FormButtonClicked, eventProps);
  }

  setDropdownSelection(event: { option: IDropdownOption }) {
    let data = event.option["data"];
    let isMultiSelect = data["isMultiSelect"];
    let internalId = data["internalId"];
   
    let formId = internalId.split("-")[1];
    let inputId = internalId.split("-")[2];
    // Find matching form
    let form = this.detectorForms.find(f => f.formId == formId);
    // Find the input
    let formInput = form.formInputs.find(inp => inp.inputId == inputId);
    if (isMultiSelect) {
      formInput.inputValue = this.formdropDownRef["current"].selectedOptions;
    } else {
      formInput.inputValue = [];
      formInput.inputValue = [event.option['key']];
      let children = event.option['data']['children'];
      if (children) {
        this.changeVisibility(children, form.formInputs, formInput);
      }
    }
    let submitOnSelection = formInput["submitOnSelection"] ?? false;

    if(submitOnSelection){
      this.OnSubmitFormAction(formId, -1);
    }

  }

  getQueryParamForDropdown(formInput: FormInput): string {
    let val = '';
    if (formInput["isMultiSelect"] == true) {
      let keys = [];
      formInput.inputValue.forEach(element => {
        if (element.hasOwnProperty('key')) {
          keys.push(element['key']);
        } else {
          keys.push(element);
        }
      });
      val = keys.join(',');
    } else {
      val = formInput['inputValue'];
    }
    return val;
  }



  changeVisibility(selectedChildren: any, allInputs: FormInput[], currentDropdown: FormInput) {
    //set visibility of selected children of dropdown option to true
    selectedChildren.forEach(element => {
      let formInput = allInputs.find(ip => ip.inputId == element);
      if (formInput) formInput.isVisible = true;
    });
    // set visibility of other children linked with current dropdown to false
    let inputsToHide = currentDropdown["children"].filter(item => selectedChildren.indexOf(item) < 0);
    inputsToHide.forEach(element => {
      let formInput = allInputs.find(ip => ip.inputId == element);
      if (formInput) formInput.isVisible = false;
    });
  }

  onChangeSelectedMoment(selectedMoment: moment.Moment, formInput: DateTimePicker) {
    formInput.selectedMoment = selectedMoment.clone();
    formInput.inputValue = selectedMoment.clone().format(TimeUtilities.fullStringFormat);
  }

}
