import { Component, OnInit } from '@angular/core';
import {AdalService} from 'adal-angular4';
import {IncidentAssistanceService} from '../../services/incident-assistance.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import {PanelType} from "office-ui-fabric-react";

@Component({
  selector: 'incidentvalidation',
  templateUrl: './incidentvalidation.component.html',
  styleUrls: ['./incidentvalidation.component.scss']
})
export class IncidentValidationComponent implements OnInit {
  pageLoading: boolean= true;
  alternateContent: string = null;
  isEnabled: boolean = false;
  incidentId: string = null;
  displayLoader: boolean = false;
  incidentInfo: IncidentInfo;
  validationButtonDisabled: boolean = true;
  updateButtonDisabled: boolean = true;
  updatedSuccessfully: boolean = false;
  incidentValidationStatus: boolean = false;
  footerMessage: string = null;
  footerMessageType: string = "none";
  userId: string = null;
  solutions: any = null;
  showSolutions: boolean = false;
  panelType = Number(String(PanelType.custom));
  loaderMessage = null;

  constructor(private _incidentAssistanceService: IncidentAssistanceService, private _route: ActivatedRoute, private _telemetryService: TelemetryService, private _router: Router, private _adalService: AdalService) {}

  ngOnInit() {
    let alias = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    this.userId = alias.replace('@microsoft.com', '').toLowerCase();
    this.incidentId = this._route.snapshot.params['incidentId'].trim();
    this._telemetryService.logPageView(TelemetryEventNames.IncidentAssistancePage, {IncidentId: this.incidentId, userId: this.userId});
    if (this.incidentId && this.incidentId.length>0){
      this.pageLoading = true;
      this.displayLoader = true;
      this._incidentAssistanceService.isIncidentAssistanceEnabled().subscribe((res) => {
        this.displayLoader = false;
        this.isEnabled = res.body;
        if (this.isEnabled) {
          this.getIncidentData();
        }
        else{
          this._telemetryService.logEvent(TelemetryEventNames.IncidentAssistancePage, {"IsEnabled": this.isEnabled.toString()});
          this.alternateContent = "Incident assistance feature is currently disabled in AppLens";
          this.pageLoading = false;
        }
      }, (err) => {
        this.displayLoader = false;
      });
    }
    else{
      this.alternateContent = "A valid incident id was not provided in the url path.";
    }
  }

  hideSolutions() {
    this.showSolutions = false;
  }

  refreshButtonStatus() {
    this.validationButtonDisabled = this.incidentValidationStatus || this.incidentInfo.validationResults.every(x => x.value==x.oldValue);
    this.updateButtonDisabled = !this.incidentValidationStatus || this.updatedSuccessfully;
  }

  setIncidentInfo(payload){
    if (payload && payload.validationResults && payload.validationResults.length>0){
      payload.validationResults.forEach(x => {
        x["oldValue"] = x.value;
      });
    }
    this.incidentInfo = payload;
  }

  getIncidentData() {
    this.displayLoader = true;
    this._incidentAssistanceService.getIncident(this.incidentId).subscribe(res => {
      this.displayLoader = false;
      var result = JSON.parse(res.body);
      this.pageLoading = false;
      this.setIncidentInfo(result);
      this.incidentValidationStatus = result.validationResults.every(x => x.validationStatus);
      this._telemetryService.logEvent(TelemetryEventNames.IncidentAssistanceLoaded, {"IncidentId": this.incidentInfo.incidentId, "ValidationStatus": this.incidentValidationStatus.toString(), userId: this.userId});
      if (!this.incidentValidationStatus){
        this.footerMessage = "Some validations have failed. Please correct the info and click on 'Check Validation' button.";
        this.footerMessageType = "error";
      }
    },
    (err) => {
      this.displayLoader = false;
      this.alternateContent = `Failed to load incident information. ${err.error}`;
    });
  }

  onSubmit() {
    if (!this.validationButtonDisabled){
      var body = {
        "IncidentId": this.incidentInfo.incidentId,
        "ValidationResults": this.incidentInfo.validationResults.map(x => {return {Name: x.name, Value: x.value};})
      };
      this.resetGlobals();
      this.displayLoader = true;
      this.loaderMessage = "Checking validations";
      setTimeout(() => {if (this.loaderMessage == "Checking validations") {this.loaderMessage = "Running Diagnostics";}}, 3000);
      this._incidentAssistanceService.validateIncident(body).subscribe(res => {
        this.loaderMessage = null;
        this.displayLoader = false;
        var result = JSON.parse(res.body);
        if (result.validationStatus) {
          if (result.solutions && result.solutions.length>2) {
            this.solutions = JSON.parse(result.solutions);
          }
          this.incidentValidationStatus = true;
          this.footerMessage = "All validations have passed.";
          this.footerMessageType = "success";
          this.incidentInfo.validationResults.forEach(x => {x.validationStatus = true; x.oldValue = x.value;});
          this.refreshButtonStatus();
          if (this.solutions && this.solutions.length>0) {
            setTimeout(() => {this.showSolutions = true;}, 300);
          }
        }
        else {
          this.onValidationFailed(result);
        }
        this._telemetryService.logEvent(TelemetryEventNames.IncidentValidationCheck, {"IncidentId": this.incidentInfo.incidentId, "ValidationStatus": this.incidentValidationStatus.toString(), "Status": "success", userId: this.userId});
      },
      (err) => {
        this.loaderMessage = null;
        this.displayLoader = false;
        this._telemetryService.logEvent(TelemetryEventNames.IncidentValidationCheck, {"IncidentId": this.incidentInfo.incidentId, "Status": "failed", "ErrorMessage": err.error, userId: this.userId});
        this.footerMessage = `Failed to validate incident. ${err.error}`;
        this.footerMessageType = "error";
      });
    }
  }

  onUpdateClick() {
    if (!this.updateButtonDisabled){
      var body = {
        "IncidentId": this.incidentInfo.incidentId,
        "ValidationResults": this.incidentInfo.validationResults.map(x => {return {Name: x.name, Value: x.value};})
      };
      this.resetGlobals();
      this.displayLoader = true;
      this._incidentAssistanceService.updateIncident(body).subscribe(res => {
        this.displayLoader = false;
        var result = JSON.parse(res.body);
        if (result.updationStatus) {
          this.updatedSuccessfully = true;
          this.updateButtonDisabled = true;
          this.footerMessage = "Incident has been updated successfully and will be investigated by the team."
          this.footerMessageType = "success";
        }
        else {
          this.updatedSuccessfully = false;
          if (result.validationStatus) {
            this.footerMessage = `Incident updation has failed. ${result.errorMessage}`;
            this.footerMessageType = "error";
          }
          else {
            this.onValidationFailed({incidentId: result.incidentId, title: result.title, validationResults: result.validationResults});
          }
        }
        this._telemetryService.logEvent(TelemetryEventNames.IncidentValidationCheck, {"IncidentId": this.incidentInfo.incidentId, "UpdationStatus": this.updatedSuccessfully.toString(), "Status": "success", userId: this.userId});
      },
      (err) => {
        this.displayLoader = false;
        this._telemetryService.logEvent(TelemetryEventNames.IncidentValidationCheck, {"IncidentId": this.incidentInfo.incidentId, "Status": "failed", "ErrorMessage": err.error, userId: this.userId});
        this.footerMessage = `Failed to update incident because of ${err.error}`;
        this.footerMessageType = "error";
      });
    }
  }

  onValidationFailed(incidentInfo){
    this.incidentValidationStatus = false;
    this.footerMessage = "Some validations have failed. Please try again.";
    this.footerMessageType = "error";
    this.setIncidentInfo(incidentInfo);
    this.refreshButtonStatus();
  }

  resetGlobals(){
    this.alternateContent = null;
    this.footerMessage = null;
    this.footerMessageType = "none";
    this.loaderMessage = null;
  }
}

interface IncidentInfo{
  incidentId: string;
  title: string;
  validationResults: ValidationResult[];
}

interface ValidationResult{
  name: string;
  value: string;
  oldValue: string;
  validationStatus: boolean;
  validationMessage: string;
}

interface ValidationUpdateResponse extends IncidentInfo{
  validationStatus: boolean;
  updationStatus: boolean;
  errorMessage: string;
  successMessage: string;
}