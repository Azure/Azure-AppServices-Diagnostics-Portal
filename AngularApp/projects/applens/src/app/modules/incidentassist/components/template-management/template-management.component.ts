import { Component, OnInit } from '@angular/core';
import {AdalService} from 'adal-angular4';
import { NgxSmartModalService } from 'ngx-smart-modal';
import {IncidentAssistanceService} from '../../services/incident-assistance.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TelemetryService, TelemetryEventNames, HealthStatus } from 'diagnostic-data';
import {PanelType, IDropdownOption, IDropdownProps, ITextFieldStyles} from "office-ui-fabric-react";
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  teamTemplateAuthors: string = null;
  templateAuthors: string = null;
  templateAuthorsSuccessMessage: string = null;
  templateAuthorsErrorMessage: string = null;
  displayLoader: boolean = false;
  validationButtonDisabled: boolean = true;
  updateButtonDisabled: boolean = true;
  updatedSuccessfully: boolean = false;
  footerMessage: string = null;
  footerMessageType: string = "none";
  retryMessage: string = "Please try again. If the error persists, please contact AppLens team.";
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
  testingIncidentLoader: boolean = false;
  testIncidentError: string = null;
  successButtonStatus = HealthStatus.Success;
  errorButtonStatus = HealthStatus.Critical;

  narrowTextFieldStyles: Partial<ITextFieldStyles> = { fieldGroup: { width: 200 } };

  testIcon: any = { iconName: 'TestCase' };
  updateIcon: any = { iconName: 'Save' };
  permissionsIcon: any = { iconName: 'Permissions' };

  checklistIcon: any = { iconName: 'CheckList' };
  availableValidationsError: string = null;
  availableValidations: AvailableValidation[] = [];
  showAvailableValidations: boolean = false;

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

  constructor(private _incidentAssistanceService: IncidentAssistanceService, private _route: ActivatedRoute, private ngxSmartModalService: NgxSmartModalService, private _telemetryService: TelemetryService, private _router: Router, private _adalService: AdalService) {
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
      this.alternateContent = `An error occurred in loading the page. ${this.retryMessage}`;
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
        this.fabDropdownOptions = [{key: "None", text: "None"}];
        this.allOnboardedTeams = [{key: "None", text: "None"}];
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
        this.alternateContent = "You do not have access to any AppLens ICM Automation team templates. Please contact your team's AppLens ICM Assistance admin.";
      }
    }, (err) => {
      this.displayLoader = false;
      this.pageLoading = false;
      if (err.status == 404) {
        this.alternateContent = `${err.error} ${this.retryMessage}`;
      }
      else {
        this.alternateContent = `An error occurred in loading the page. ${this.retryMessage}`;
      }
    });
  }

  resetLoadedTeam() {
    this.selectedTeamId = null;
    this.selectedTeam = null;
    this.teamTemplate = null;
    this.templateAuthors = null;
    this.teamTemplateAuthors = null;
    this.templateAuthorsErrorMessage = null;
    this.validationButtonDisabled = true;
    this.updateButtonDisabled = true;
    this.updatedSuccessfully = false;
    this.testButtonDisabled = true;  
    this.showTestBlade = false;
    this.showAvailableValidations = false;
    this.availableValidations = [];
    this.resetTestBladeData();
  }

  setSelectedTeam(dropdownId, selectedTeam){
    if (dropdownId != this.selectedTeamId) {
      this.resetLoadedTeam();
      this.selectedTeamId = dropdownId;
      this.selectedTeam = {
        teamId: selectedTeam.teamId.split("++")[0],
        teamName: selectedTeam.teamName,
        incidentType: selectedTeam.incidentType
      };
      this.getTeamTemplate();
    }
  }

  selectDropdownKey(e: { option: IDropdownOption, index: number }) {
    if (e.option.key == "None") {
      this.resetLoadedTeam();
      this.selectedTeamId = "None";
      return;
    }
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
    this.testingIncidentLoader = true;
    this.loaderMessage = `Fetching recent incidents from your team...`;
    this._incidentAssistanceService.getIncidentsForTeam(this.selectedTeam.teamId, this.selectedTeam.incidentType.toString()).subscribe((res) => {
      this.loaderMessage = null;
      this.testingIncidentLoader = false;
      if (res && res.body && res.body.length>0) {
        this.teamIncidentsForTest = res.body;
      }
    } , (err) => {
      this.loaderMessage = null;
      this.testingIncidentLoader = false;
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
    this.testingIncidentLoader = true;
    this.loaderMessage = `Testing against incident ${this.testIncidentId.trim()}`;
    this._incidentAssistanceService.testTemplateWithIncident(body).subscribe(res => {
      this.testingIncidentLoader = false;
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
      this.testingIncidentLoader = false;
      this.testIncidentError = err && err.error && err.error.length<200? err.error: "An error occurred";
      this.updateButtonDisabled = false;
    });
  }

  onUpdateClick() {
    if (!this.updateButtonDisabled){
      var body = JSON.parse(this.teamTemplate);
      this.loaderMessage = "Updating team template...";
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

  showPermissions(){
    this.loaderMessage = null;
    this.displayLoader = true;
    this._incidentAssistanceService.getTeamTemplateAuthors(this.selectedTeam.teamId, this.selectedTeam.incidentType.toString()).pipe(map((res: any) => {
      this.displayLoader = false;
      let data = JSON.parse(res.body);
      this.teamTemplateAuthors = data.authors;
      this.templateAuthors = data.authors;
      this.templateAuthorsErrorMessage = "";
      this.templateAuthorsSuccessMessage = "";
    }),
    catchError((err) => {
      this.displayLoader = false;
      this.templateAuthors = null;
      this.teamTemplateAuthors = null;
      this.templateAuthorsErrorMessage = "Error retrieving template authors.";
      this.templateAuthorsSuccessMessage = "";
      return of(null);
    })).subscribe(res => {
      setTimeout(() => {
        this.ngxSmartModalService.getModal('icmTemplatePermissionsModal').open();
      }, 100);
    });
  }

  updatePermissions(){
    if (this.templateAuthors && this.templateAuthors !== this.teamTemplateAuthors) {
      this._incidentAssistanceService.updateTeamTemplateAuthors(this.selectedTeam.teamId, this.selectedTeam.incidentType.toString(), {authors: this.templateAuthors}).subscribe((data: any) => {
        this.teamTemplateAuthors = this.templateAuthors;
        this.templateAuthorsErrorMessage = "";
        this.templateAuthorsSuccessMessage = "Template authoring permissions updated successfully.";
      },
      (err) => {
        this.templateAuthorsSuccessMessage = "";
        this.templateAuthorsErrorMessage = "Error updating template authoring permissions. Please try again.";
        return of(null);
      });
    }
  }

  closePermissions(){
    this.ngxSmartModalService.getModal('icmTemplatePermissionsModal').close();
  }

  openAvailableValidations(){
    this.loaderMessage = "Fetching list of available validations...";
    this.displayLoader = true;
    this._incidentAssistanceService.getAvailableValidations(this.selectedTeam.teamId, this.selectedTeam.incidentType.toString()).subscribe((res) => {
      this.displayLoader = false;
      this.loaderMessage = null;
      this.showAvailableValidations = true;
      this.availableValidations = JSON.parse(res.body);
    },
    (err) => {
      this.displayLoader = false;
      this.showAvailableValidations = true;
      this.availableValidationsError = "Error retrieving available validations. Please try again.";
    });
  }

  hideAvailableValidations(){
    this.showAvailableValidations = false;
  }

  resetGlobals(){
    this.teamIncidentsForTest = [];
    this.alternateContent = null;
    this.templateLoadError = null;
    this.footerMessage = null;
    this.footerMessageType = "none";
    this.loaderMessage = null;
  }

  resetTestBladeData() {
    this.teamIncidentsForTest = [];
    this.testIncidentId = null;
    this.resetTestIncidentVariables();
  }

  resetTestIncidentVariables(){
    this.loaderMessage = null;
    this.testingIncidentLoader = false;
    this.validationResponse = {};
    this.testIncidentError = null;
  }

  updateTemplateAuthors(e: { event: Event, newValue?: string }) {
    this.teamTemplateAuthors = e.newValue.toString();
  }

  updateTestIncidentId(e: { event: Event, newValue?: string }) {
    this.testIncidentId = e.newValue.toString();
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

interface AvailableValidation{
  name: string;
  usage: string;
  description: string;
}

enum IncidentType{
  CRI,
  LSI
}