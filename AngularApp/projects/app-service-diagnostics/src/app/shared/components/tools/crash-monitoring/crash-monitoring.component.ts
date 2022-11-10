import { Component, OnInit, ViewChild } from '@angular/core';
import { IDatePickerProps, IDropdownOption, SelectableOptionMenuItemType, ICalloutProps } from 'office-ui-fabric-react';
import * as momentNs from 'moment';
import { addMonths, addDays } from 'office-ui-fabric-react/lib/utilities/dateMath/DateMath';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { SiteService } from '../../../services/site.service';
import { DaasService } from '../../../services/daas.service';
import { Globals } from '../../../../globals'
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { SharedStorageAccountService } from 'projects/app-service-diagnostics/src/app/shared-v2/services/shared-storage-account.service';
import { CrashMonitoringSettings } from '../../../models/daas';
import { DirectionalHint } from 'office-ui-fabric-react/lib/Tooltip';
import { CrashMonitoringAnalysisComponent } from './crash-monitoring-analysis/crash-monitoring-analysis.component';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ITooltipOptions } from '@angular-react/fabric/lib/components/tooltip';

@Component({
  selector: 'crash-monitoring',
  templateUrl: './crash-monitoring.component.html',
  styleUrls: ['./crash-monitoring.component.scss']
})
export class CrashMonitoringComponent implements OnInit {

  @ViewChild('crashMonitoringAnalysisRef') crashMonitoringAnalysis: CrashMonitoringAnalysisComponent;

  constructor(private _siteService: SiteService,
    private _daasService: DaasService, private globals: Globals, private telemetryService: TelemetryService,
    private _sharedStorageAccountService: SharedStorageAccountService) {
    this._sharedStorageAccountService.changeEmitted$.subscribe(newStorageAccount => {
      this.chosenStorageAccount = newStorageAccount.name;
      this.blobSasUriEnvironmentVariable = newStorageAccount.sasUri;
      if (this.chosenStorageAccount) {
        this.validationError = "";
        this.storageConfiguredAsAppSetting = true;
      }
    })
  }

  today: Date = new Date(Date.now());
  memoryDumpOptions: IDropdownOption[] = [];

  maxDate: Date = this.convertUTCToLocalDate(addMonths(this.today, 3));
  minDate: Date = this.convertUTCToLocalDate(this.today);
  startDate: Date = this.minDate;
  endDate: Date = addDays(this.startDate, 15);
  startClock: string;
  endClock: string;

  siteToBeDiagnosed: SiteDaasInfo;
  error: any;
  status: toolStatus = toolStatus.Loading;
  errorMessage: string;
  toolStatus = toolStatus;
  validationError: string = "";
  updatingStorageAccounts: boolean = false;
  chosenStorageAccount: string = "";
  storageConfiguredAsAppSetting: boolean = false;

  chosenStartDateTime: Date;
  chosenEndDateTime: Date;
  selectedDumpCount: string = "3";
  monitoringEnabled: boolean = false;
  crashMonitoringSettings: CrashMonitoringSettings = null;
  collapsed: boolean = false;
  blobSasUriEnvironmentVariable: string = "";

  // For tooltip display
  directionalHint = DirectionalHint.rightTopEdge;
  toolTipStyles = { 'backgroundColor': 'black', 'color': 'white', 'border': '0px' };

  toolTipOptionsValue: ITooltipOptions = {
    calloutProps: {
      styles: {
        beak: this.toolTipStyles,
        beakCurtain: this.toolTipStyles,
        calloutMain: this.toolTipStyles
      }
    },
    styles: {
      content: this.toolTipStyles,
      root: this.toolTipStyles,
      subText: this.toolTipStyles
    }
  }

  formatDate: IDatePickerProps['formatDate'] = (date) => {
    return momentNs(date).format('YYYY-MM-DD');
  };

  ngOnInit() {
    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
      this.status = toolStatus.CheckingBlobSasUri;
      this.getStorageAccountName().subscribe(storageAccountName => {
        this.chosenStorageAccount = storageAccountName;
        this._siteService.getCrashMonitoringSettings(site).subscribe(crashMonitoringSettings => {
          if (crashMonitoringSettings != null) {
            this.crashMonitoringSettings = crashMonitoringSettings;
            this.populateSettings(crashMonitoringSettings);
            this.monitoringEnabled = true;
            this.collapsed = true;
          }
          this.status = toolStatus.Loaded;
        });
      },
        error => {
          this.errorMessage = "Failed while checking configured storage account";
          this.status = toolStatus.Error;
          this.error = error;
        });

      this.startClock = this.getHourAndMinute(this.startDate);
      this.endClock = this.getHourAndMinute(this.endDate);

      this.initDumpOptions();
    });
  }

  getStorageAccountName(): Observable<string> {
    return this._daasService.getStorageConfiguration(this.siteToBeDiagnosed, false).pipe(
      map(storageConfig => {
        this.storageConfiguredAsAppSetting = storageConfig.IsAppSetting;
        return this.getStorageAccountNameFromSasUri(storageConfig.SasUri);
      }));
  }

  resetGlobals() {
    this.today = new Date(Date.now());

    this.maxDate = this.convertUTCToLocalDate(addMonths(this.today, 3));
    this.minDate = this.convertUTCToLocalDate(this.today)
    this.startDate = this.minDate;
    this.endDate = addDays(this.startDate, 15);
    this.startClock = this.getHourAndMinute(this.startDate);
    this.endClock = this.getHourAndMinute(this.endDate);
    this.monitoringEnabled = false;
    this.collapsed = false;
  }

  populateSettings(crashMonitoringSettings: CrashMonitoringSettings) {
    if (crashMonitoringSettings.MaxDumpCount && crashMonitoringSettings.MaxDumpCount < 6) {
      this.selectedDumpCount = crashMonitoringSettings.MaxDumpCount.toString();
    }

    let monitoringDates = this._siteService.getCrashMonitoringDates(crashMonitoringSettings);

    this.startDate = this.convertUTCToLocalDate(monitoringDates.start);
    this.endDate = this.convertUTCToLocalDate(monitoringDates.end);

    this.startClock = this.getHourAndMinute(this.startDate);
    this.endClock = this.getHourAndMinute(this.endDate);

    // Reset the minDate to avoid the UI displaying an error
    this.minDate = this.startDate;
  }

  getStorageAccountNameFromSasUri(blobSasUri: string): string {
    if (!blobSasUri) {
      return blobSasUri;
    }
    let blobUrl = new URL(blobSasUri);
    return blobUrl.host.split('.')[0];
  }

  initDumpOptions() {

    this.memoryDumpOptions = [];
    for (let index = 1; index < 6; index++) {
      this.memoryDumpOptions.push({
        key: index.toString(),
        text: index.toString(),
        ariaLabel: index.toString() + " dumps (s)",
        isSelected: index === 3 ? true : false
      });
    }
    this.selectedDumpCount = "3";
  }

  onSelectStartDateHandler(event: any) {
    if (event != null && event.date != null) {
      this.startDate = event.date;
    }
  }

  onSelectEndDateHandler(event: any) {
    if (event != null && event.date != null) {
      this.endDate = event.date;
    }
  }

  startMonitoring() {
    if (this.validateSettings()) {
      this.saveMonitoringSettings();
    }
  }

  validateSettings(): boolean {
    this.validationError = ""
    let isValid: boolean = true;
    if (!this.chosenStorageAccount || !this.storageConfiguredAsAppSetting) {
      this.validationError = "Please choose a storage account to save the memory dumps";
      return false;
    }
    if (this.getErrorMessageOnTextField(this.startClock) === "" && this.getErrorMessageOnTextField(this.endClock) === "") {
      var startTimeValues = this.startClock.split(":");
      var endTimeValues = this.endClock.split(":");

      this.chosenStartDateTime = this.getDateWithTime(this.startDate, startTimeValues);
      this.chosenEndDateTime = this.getDateWithTime(this.endDate, endTimeValues);

      if (this.chosenStartDateTime >= this.chosenEndDateTime) {
        isValid = false;
        this.validationError = "Start date and time cannot be greater than or equal to end date and time";
      }

      let durationInHours = momentNs.utc().diff(momentNs.utc(this.chosenStartDateTime), 'hours', true);
      if (durationInHours > 1) {
        isValid = false;
        this.validationError = "Start date and time cannot be lesser than current date and time";
      }

    } else {
      isValid = false;
      this.validationError = "Invalid Start time or Stop time";
    }
    return isValid;
  }

  getDateWithTime(date: Date, values: string[]): Date {
    let dateTime = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(values[0]), parseInt(values[1]), 0, 0));
    return dateTime
  }

  //Get HH:mm from date
  private getHourAndMinute(date: Date): string {
    return momentNs(date).format('HH:mm');
  }

  //convert ISO string(UTC time) to LocalDate with same year,month,date...
  private convertUTCToLocalDate(date: Date): Date {
    const moment = momentNs.utc(date);
    return new Date(
      moment.year(), moment.month(), moment.date(),
      moment.hour(), moment.minute()
    );
  }

  getErrorMessageOnTextField(value: string): string {
    var values = value.split(":");
    var errorMessage = "";
    if (!(values.length > 1 && +values[0] <= 24 && +values[1] <= 59)) {
      errorMessage = `Invalid time`;
    }
    return errorMessage;
  }

  toggleStorageAccountPanel() {
    this.globals.openCreateStorageAccountPanel = !this.globals.openCreateStorageAccountPanel;
    this.telemetryService.logEvent("OpenCreateStorageAccountPanel");
    this.telemetryService.logPageView("CreateStorageAccountPanelView");
  }

  saveMonitoringSettings() {
    this.status = toolStatus.SavingCrashMonitoringSettings;
    let crashMonitoringSettings = this.getCrashMonitoringSetting();
    this.logCrashMonitoringEnabled(crashMonitoringSettings);
    this._siteService.saveCrashMonitoringSettings(this.siteToBeDiagnosed, crashMonitoringSettings, this.blobSasUriEnvironmentVariable)
      .subscribe(resp => {
        this.crashMonitoringSettings = crashMonitoringSettings;
        this.status = toolStatus.SettingsSaved;
        this.monitoringEnabled = true;
        this.collapsed = true;
      },
        error => {
          this.status = toolStatus.Error;
          this.errorMessage = "Failed while saving crash monitoring settings for the current app. ";
          this.error = error;
        });
  }

  logCrashMonitoringEnabled(crashMonitoringSettings: CrashMonitoringSettings) {
    let eventProps = {
      'Settings': JSON.stringify(crashMonitoringSettings)
    }
    this.telemetryService.logEvent(TelemetryEventNames.CrashMonitoringEnabled, eventProps);
  }

  selectDumpCount(event: any) {
    this.selectedDumpCount = event.option.key;
  }

  getCrashMonitoringSetting(): CrashMonitoringSettings {
    let monitoringSettings: CrashMonitoringSettings = new CrashMonitoringSettings();
    let durationInHours = momentNs.utc(this.chosenEndDateTime).diff(momentNs.utc(this.chosenStartDateTime), 'hours', true);
    monitoringSettings.StartTimeUtc = momentNs.utc(this.chosenStartDateTime, momentNs.defaultFormatUtc).toISOString();
    monitoringSettings.MaxHours = durationInHours;
    monitoringSettings.MaxDumpCount = parseInt(this.selectedDumpCount);
    return monitoringSettings;
  }

  getErrorDetails(): string {
    return JSON.stringify(this.error);
  }

  getMonitoringSummary(): string {

    if (this.crashMonitoringSettings != null) {
      let monitoringDates = this._siteService.getCrashMonitoringDates(this.crashMonitoringSettings);
      return `${this.siteToBeDiagnosed.siteName} | ${this.formatDateToString(monitoringDates.start, true)} to ${this.formatDateToString(monitoringDates.end, true)} | ${this.crashMonitoringSettings.MaxDumpCount} memory dumps`;
    }
  }

  formatDateToString(date: Date, appendTime: boolean = false) {

    return appendTime ? momentNs.utc(date).format("YYYY-MM-DD HH:mm") : momentNs.utc(date).format("YYYY-MM-DD");
  }

  monitoringSettingsChanged(event: CrashMonitoringSettings) {
    this.crashMonitoringSettings = event;
    this.resetGlobals();
  }
}

export enum toolStatus {
  Loading,
  CheckingBlobSasUri,
  Loaded,
  SavingCrashMonitoringSettings,
  SettingsSaved,
  Error
}
