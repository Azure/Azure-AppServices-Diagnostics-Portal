import { Component, OnInit } from '@angular/core';
import {AdalService} from 'adal-angular4';
import {IncidentAssistanceService} from '../../services/incident-assistance.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TelemetryService, TelemetryEventNames, HealthStatus } from 'diagnostic-data';
import {PanelType, IDropdownOption, IDropdownProps, ITextFieldStyles} from "office-ui-fabric-react";

@Component({
  selector: 'template-management',
  templateUrl: './template-management.component.html',
  styleUrls: ['./template-management.component.scss']
})
export class TemplateManagementComponent implements OnInit {
  pageLoading: boolean= true;
  alternateContent: string = null;
  isEnabled: boolean = false;
  allOnboardedTeams: any[] = [];
  selectedTeam: OnboardedTeam = null;
  teamTemplate: string = null;
  displayLoader: boolean = false;
  validationButtonDisabled: boolean = true;
  updateButtonDisabled: boolean = true;
  updatedSuccessfully: boolean = false;
  footerMessage: string = null;
  footerMessageType: string = "none";
  userId: string = null;
  loaderMessage = null;
  panelType = Number(String(PanelType.custom));

  templateLoadError: string = null;

  selectedTeamId: string = null;
  testButtonDisabled: boolean = true;
  
  showTestBlade: boolean = false;
  teamIncidentsForTest: IncidentInfo[] = [];
  testIncidentId: string = null;
  validationResponse: any = {};
  testinIncidentLoader: boolean = false;
  testIncidentError: string = null;
  errorButtonStatus = HealthStatus.Critical;

  narrowTextFieldStyles: Partial<ITextFieldStyles> = { fieldGroup: { width: 200 } };

  editorOptions: any = null;
  lightOptions = {
    theme: 'vs',
    language: 'json',
    fontSize: 14,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false
    },
    folding: true
  };

  darkOptions = {
    theme: 'vs-dark',
    language: 'json',
    fontSize: 14,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false
    },
    folding: true
  };

  fabDropdownOptions: IDropdownOption[] = [];
  fabDropdownStyles: IDropdownProps["styles"] = {
    dropdownItemsWrapper: {
      maxHeight: '30vh'
    },
  }

  constructor(private _incidentAssistanceService: IncidentAssistanceService, private _route: ActivatedRoute, private _telemetryService: TelemetryService, private _router: Router, private _adalService: AdalService) {
    this.editorOptions = this.lightOptions;
  }

  ngOnInit() {
    let alias = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    this.userId = alias.replace('@microsoft.com', '').toLowerCase();
    this._telemetryService.logPageView(TelemetryEventNames.ICMTemplateManagementPage, {userId: this.userId});
    this.pageLoading = true;
    this.displayLoader = true;
    this._incidentAssistanceService.isIncidentAssistanceEnabled().subscribe((res) => {
      this.displayLoader = false;
      this.isEnabled = res.body;
      if (this.isEnabled) {
        this.getOnboardedTeams();
      }
      else{
        this._telemetryService.logEvent(TelemetryEventNames.ICMTemplateManagementPage, {"IsEnabled": this.isEnabled.toString()});
        this.alternateContent = "Incident assistance feature is currently disabled in AppLens";
        this.pageLoading = false;
      }
    }, (err) => {
      this.alternateContent = "An error occurred in loading the page, please try again. If the error persists, please contact AppLens team.";
      this.displayLoader = false;
    });
  }

  getOnboardedTeams(){
    this.pageLoading = true;
    this.displayLoader = true;
    this._incidentAssistanceService.getOnboardedTeams().subscribe((res) => {
      this.displayLoader = false;
      let onboardedTeams = JSON.parse(res.body);
      if (onboardedTeams.length>0){
        onboardedTeams.forEach(team => {
          if (team.type.length>0) {
            team.type.forEach(type => {
              this.fabDropdownOptions.push({key: team.teamId + "++" + type.toString(), text: team.teamName + " (" + type.toString() + ")"});
              this.allOnboardedTeams.push({teamId: team.teamId, teamName: team.teamName, incidentType: type});
            });
          }
          else {
            this.fabDropdownOptions.push({key: team.teamId + "++" + team.type[0].toString(), text: team.teamName + " (" + team.type[0].toString() + ")"});
            this.allOnboardedTeams.push({teamId: team.teamId, teamName: team.teamName, incidentType: team.type[0]});
          }
          this.selectedTeamId = this.fabDropdownOptions[0].key.toString();
        });
        this.pageLoading = false;
      }
      else {
        this.pageLoading = false;
        this.alternateContent = "You do not have access to any AppLens ICM Automation team templates. Please contact your team's ICM admin.";
      }
    }, (err) => {
      this.displayLoader = false;
      this.pageLoading = false;
      this.alternateContent = "An error occurred in loading the page, please try again. If the error persists, please contact AppLens team.";
    });
  }

  setSelectedTeam(dropdownId, selectedTeam){
    this.selectedTeamId = dropdownId;
    this.selectedTeam = {
      teamId: selectedTeam.teamId.split("++")[0],
      teamName: selectedTeam.teamName,
      incidentType: selectedTeam.incidentType
    };
    this.teamTemplate = null;
    this.getTeamTemplate();
  }

  selectDropdownKey(e: { option: IDropdownOption, index: number }) {
    let teamId = e.option.key.toString().split("++")[0];
    let incidentType = e.option.key.toString().split("++")[1];
    const selectedTeam = this.allOnboardedTeams.find(team => team.teamId === teamId && team.incidentType === incidentType);
    this.setSelectedTeam(e.option.key, selectedTeam);
  }

  getTeamTemplate() {
    this.resetGlobals();
    this.displayLoader = true;
    this._incidentAssistanceService.getTeamTemplate(this.selectedTeam.teamId, this.selectedTeam.incidentType.toString()).subscribe(res => {
      this.displayLoader = false;
      this.pageLoading = false;
      var result = res.body;
      if (result.length>0){
        this.teamTemplate = JSON.parse(result);
        this.testButtonDisabled = false;
      }
      this._telemetryService.logEvent(TelemetryEventNames.ICMTeamTemplateLoaded, {"TeamId": this.selectedTeam.teamId, "IncidentType": this.selectedTeam.incidentType.toString(), userId: this.userId});
    },
    (err) => {
      this.displayLoader = false;
      this.templateLoadError = err.error.length < 100? err.error: `Failed to load the template. ${err.error}`;
    });
  }

  onTestClick() {
    this.showTestBlade = true;
    this.testinIncidentLoader = true;
    this.loaderMessage = `Fetching recent incidents from your team...`;
    this._incidentAssistanceService.getIncidentsForTeam(this.selectedTeam.teamId, this.selectedTeam.incidentType.toString()).subscribe((res) => {
      this.loaderMessage = null;
      this.testinIncidentLoader = false;
      if (res && res.body && res.body.length>0) {
        this.teamIncidentsForTest = res.body;
      }
    } , (err) => {
      this.loaderMessage = null;
      this.testinIncidentLoader = false;
    });
  }

  hideTestBlade(){
    this.showTestBlade = false;
  }

  onTestIncidentClick(){
    var body = {
      "incidentId": this.testIncidentId.trim(),
      "validationTemplate": JSON.parse(this.teamTemplate)
    };
    this.resetTestIncidentVariables();
    this.testinIncidentLoader = true;
    this.loaderMessage = `Testing against incident ${this.testIncidentId.trim()}`;
    this._incidentAssistanceService.testTemplateWithIncident(body).subscribe(res => {
      this.testinIncidentLoader = false;
      var result = JSON.parse(res.body);
      if (result){
        this.validationResponse = {
          action: result.action,
          postMessage: result.discussionEntry          
        };
        this.updateButtonDisabled = false;
      }
    },
    (err) => {
      this.testinIncidentLoader = false;
      this.testIncidentError = err.error.length>200? "An error occurred": err.error;
    });
  }

  onUpdateClick() {
    if (!this.updateButtonDisabled){
      var body = JSON.parse(this.teamTemplate);
      this.resetGlobals();
      this.displayLoader = true;
      this._incidentAssistanceService.updateTeamTemplate(this.selectedTeam.teamId, this.selectedTeam.incidentType.toString(), body).subscribe(res => {
        this.displayLoader = false;
        var result = res.body;
        this.updatedSuccessfully = true;
        this.updateButtonDisabled = true;
        this.footerMessage = "Team template has been updated successfully."
        this.footerMessageType = "success";
        this._telemetryService.logEvent(TelemetryEventNames.ICMTeamTemplateUpdate, {"TeamId": this.selectedTeam.teamId, "IncidentType": this.selectedTeam.incidentType.toString(), "Status": "success", userId: this.userId});
      },
      (err) => {
        this.displayLoader = false;
        this._telemetryService.logEvent(TelemetryEventNames.ICMTeamTemplateUpdate, {"TeamId": this.selectedTeam.teamId, "IncidentType": this.selectedTeam.incidentType.toString(), "Status": "failed", "ErrorMessage": err.error, userId: this.userId});
        this.footerMessage = `Failed to update team template because of ${err.error}`;
        this.footerMessageType = "error";
      });
    }
  }

  resetLoadedTeam(){

  }

  resetGlobals(){
    this.teamIncidentsForTest = [];
    this.alternateContent = null;
    this.templateLoadError = null;
    this.footerMessage = null;
    this.footerMessageType = "none";
    this.loaderMessage = null;
  }

  resetTestIncidentVariables(){
    this.loaderMessage = null;
    this.validationResponse = {};
    this.testIncidentError = null;
  }
}

interface OnboardedTeam{
  teamId: string;
  teamName: string;
  incidentType: IncidentType;
}

interface IncidentInfo{
  incidentId: string;
  title: string;
}

enum IncidentType{
  CRI,
  LSI
}