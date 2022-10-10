import { Component, OnInit } from '@angular/core';
import {AdalService} from 'adal-angular4';
import {SurveysService} from '../../services/surveys.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import {IChoiceGroupOption, IDropdownOption, PanelType} from "office-ui-fabric-react";
import { FabChoiceGroupComponent } from '@angular-react/fabric/lib/components/choice-group';

@Component({
  selector: 'takesurvey',
  templateUrl: './takesurvey.component.html',
  styleUrls: ['./takesurvey.component.scss']
})
export class TakeSurveyComponent implements OnInit {
  pageLoading: boolean= true;
  isEnabled: boolean = false;
  alternateContent: string = null;
  displayLoader: boolean = false;
  surveyInfo: SurveyInfo;
  caseId: string = null;
  submitButtonDisabled: boolean = false;
  footerMessage: string = null;
  footerMessageType: string = "none";
  userId: string = null;
  showCaseDetails: boolean = false;
  backupLink: string = null;
  panelType = Number(String(PanelType.medium));
  dropDownStyle = {
    label: {
      fontWeight: 700
    }
  };
  choiceGroupStyle = {
    label: {
      fontWeight: 700
    }
  };
  textFieldStyle = {
    subComponentStyles: {
      label: {
        root: {fontWeight: 700}
      }
    }
  };
  solutionFound: IChoiceGroupOption = {key: "y", text: "Yes"};
  solutionFoundOptions: FabChoiceGroupComponent['options'] = [
    {key: "y", text: "Yes", styles: {field: {fontWeight: 400}}},
    {key: "n", text: "No", styles: {field: {fontWeight: 400}}}
  ];
  detectorHelped: IChoiceGroupOption = {key: "y", text: "Yes detectors helped"};
  detectorHelpedOptions = [
      {key: "y", text: "Yes detectors helped", styles: {field: {fontWeight: 400}}},
      {key: "n", text: "Detectors did not help", styles: {field: {fontWeight: 400}}}
  ];
  selectedDetectors: IDropdownOption[] = [];
  customSolution: string = "";

  solutionFoundOptionChange(event) {
    this.solutionFound = event.option;
  }
  detectorHelpedOptionChange(event) {
    this.detectorHelped = event.option;
    if (event.option.key=="y") {
      this.customSolution = "";
    }
  }

  addToSelectedDetectors(obj) {
    var idx = this.selectedDetectors.findIndex(x => x.key==obj.key);
    if (idx>=0) {
      return;
    }
    else {
      this.selectedDetectors.push(obj);
    }
  }

  removeFromSelectedDetectors(obj) {
    var idx = this.selectedDetectors.findIndex(x => x.key==obj.key);
    if (idx<0) {
      return;
    }
    else{
      this.selectedDetectors.splice(idx, 1);
    }
  }

  setSelectedDetectors(event) {
    if (event.option) {
      if (event.option.selected==true) {
        this.addToSelectedDetectors({key: event.option.key, text: event.option.text});
      }
      else{
        this.removeFromSelectedDetectors({key: event.option.key, text: event.option.text});
      }
    }
  }

  showDetails(event){
    event.preventDefault();
    this.showCaseDetails = true;
  }

  hideDetails(){
    this.showCaseDetails = false;
  }

  constructor(private _surveysService: SurveysService, private _route: ActivatedRoute, private _telemetryService: TelemetryService, private _router: Router, private _adalService: AdalService) {}

  ngOnInit() {
    let alias = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    this.userId = alias.replace('@microsoft.com', '').toLowerCase();
    this.caseId = this._route.snapshot.params['caseId'];
    this._telemetryService.logPageView(TelemetryEventNames.SurveyPageLoaded, {CaseId: this.caseId, userId: this.userId});
    if (this.caseId && this.caseId.length>0){
      this.pageLoading = true;
      this.displayLoader = true;
      this._surveysService.isSurveyFeatureEnabled().subscribe((res) => {
        this.displayLoader = false;
        this.isEnabled = res.body;
        if (this.isEnabled) {
          this.getSurveyData();
        }
        else{
          this._telemetryService.logEvent(TelemetryEventNames.SurveyLoadStatus, {Loaded: "false", CaseId: this.caseId, IsEnabled: this.isEnabled.toString()});
          this.alternateContent = "AppLens Survey feature is currently disabled";
          this.pageLoading = false;
        }
      }, (err) => {
        this.displayLoader = false;
        this.alternateContent = "AppLens Survey feature seems to have encountered an issue.";
      });
    }
    else{
      this.alternateContent = "Unable to load survey because valid case id was not provided in the url path.";
    }
  }

  setSurveyInfo(payload){
    this.surveyInfo = payload;
    if (this.surveyInfo && this.surveyInfo.caseInfo) {
      if (this.surveyInfo.caseInfo.caseDescription) {
        this.surveyInfo.caseInfo.caseDescription = this.surveyInfo.caseInfo.caseDescription.replace(/[\r\n]/g, "<br />");
        this.surveyInfo.caseInfo.caseDescription = this.surveyInfo.caseInfo.caseDescription.replace("\\n", "<br>");
      }
      if (this.surveyInfo.caseInfo.caseCause) {
        this.surveyInfo.caseInfo.caseCause = this.surveyInfo.caseInfo.caseCause.replace(/[\r\n]/g, "<br />");
        this.surveyInfo.caseInfo.caseCause = this.surveyInfo.caseInfo.caseCause.replace("\\n", "<br>");
      }
      if (this.surveyInfo.caseInfo.caseResText) {
        this.surveyInfo.caseInfo.caseResText = this.surveyInfo.caseInfo.caseResText.replace(/[\r\n]/g, "<br />");
        this.surveyInfo.caseInfo.caseResText = this.surveyInfo.caseInfo.caseResText.replace("\\n", "<br>");
      }
    }
  }

  getSurveyData() {
    this.displayLoader = true;
    this._surveysService.getSurvey(this.caseId).subscribe(res => {
      this.displayLoader = false;
      var result = JSON.parse(res.body);
      this.pageLoading = false;
      if (result && result.surveySubmitted) {
        this.alternateContent = `Survey for ${this.caseId} has already been submitted. Thank you for your response!`;
        this._telemetryService.logEvent(TelemetryEventNames.SurveyLoadStatus, {Loaded: "alreadysubmitted", CaseId: this.caseId, userId: this.userId});
      }
      else{
        this.setSurveyInfo(result);
        this._telemetryService.logEvent(TelemetryEventNames.SurveyLoadStatus, {Loaded: "true", CaseId: this.surveyInfo.caseInfo.caseId, userId: this.userId});
      }
    },
    (err) => {
      this.displayLoader = false;
      this.alternateContent = `Failed to load case survey information. ${err.msg}`;
    });
  }

  onSubmit() {
    var responseBody = {
      caseId: this.surveyInfo.caseInfo.caseId,
      caseInfo: this.surveyInfo.caseInfo,
      detectorsShown: this.surveyInfo.detectorsShown,
      surveySubmitted: true,
      answers: {
        solutionFound: this.solutionFound.text,
        detectorHelped: this.detectorHelped.text,
        selectedDetectors: this.selectedDetectors,
        customSolution: this.customSolution
      }
    };
    this.resetGlobals();
    this.displayLoader = true;
    this._surveysService.submitSurvey(responseBody).subscribe(res => {
      this.displayLoader = false;
      var result = JSON.parse(res.body);
      this.footerMessage = "Survey submitted successfully. Thank you for your response!";
      this.footerMessageType = "success";
      this.submitButtonDisabled = true;
      this._telemetryService.logEvent(TelemetryEventNames.SurveySubmitStatus, {CaseId: this.surveyInfo.caseInfo.caseId, Status: "success", userId: this.userId, Answers: JSON.stringify(responseBody.answers)});
    },
    (err) => {
      this.displayLoader = false;
      this._telemetryService.logEvent(TelemetryEventNames.SurveySubmitStatus, {CaseId: this.surveyInfo.caseInfo.caseId, Status: "failed", "ErrorMessage": err.error, userId: this.userId, Answers: JSON.stringify(responseBody.answers)});
      let emailBody = encodeURIComponent(`Survey Response for ${this.surveyInfo.caseInfo.caseId} : \n\n ${JSON.stringify(responseBody.answers, undefined, 4)} \n\nThanks`);
      this.backupLink = `<a href='mailto:applensv2team@microsoft.com?subject=Email Response on AppLens Case Surveys - Case ${this.surveyInfo.caseInfo.caseId}&body=${emailBody}'>Submit Response via Email</a>`;
      this.footerMessage = "There was an error submitting your response.";
      this.footerMessageType = "error";
    });
  }

  resetGlobals(){
    this.alternateContent = null;
    this.submitButtonDisabled = false;
    this.footerMessage = null;
    this.footerMessageType = "none";
  }
}

interface SurveyInfo{
  caseInfo: CaseInfo;
  detectorsShown: any[];
  surveySubmitted: boolean;
}

interface CaseInfo{
  caseId: string;
  caseTitle: string;
  caseDescription: string;
  caseCause: string;
  caseResText: string;
  resourceId: string;
  creationDate: string;
  resolutionDate: string;
  resolvedByAlias: string;
}