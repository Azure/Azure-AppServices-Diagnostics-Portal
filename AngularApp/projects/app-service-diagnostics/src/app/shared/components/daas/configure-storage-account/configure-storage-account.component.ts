import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { SiteDaasInfo } from '../../../models/solution-metadata';
import { DaasService } from '../../../services/daas.service';
import { DaasValidationResult, ValidateSasUriResponse, ValidateStorageAccountResponse } from '../../../models/daas';
import { Globals } from '../../../../globals'
import { SharedStorageAccountService } from '../../../../shared-v2/services/shared-storage-account.service';
import { TelemetryService } from 'projects/diagnostic-data/src/lib/services/telemetry/telemetry.service';

@Component({
  selector: 'configure-storage-account',
  templateUrl: './configure-storage-account.component.html',
  styleUrls: ['./configure-storage-account.component.scss']
})
export class ConfigureStorageAccountComponent implements OnInit {

  constructor(private _daasService: DaasService, private globals: Globals,
    private _sharedStorageAccountService: SharedStorageAccountService,
    private telemetryService: TelemetryService) {
    this.JSON = JSON;
    this._sharedStorageAccountService.changeEmitted$.subscribe(newStorageAccount => {
      this.chosenStorageAccount = newStorageAccount.name;
      if (this.chosenStorageAccount) {
        this.error = null;
        this.validateStorageConfigurationResponse = null;
      }

      if (newStorageAccount.connectionString) {
        this.validationResult.BlobSasUri = '';
        this.validationResult.ConnectionString = newStorageAccount.connectionString ? newStorageAccount.connectionString : '';
        this.validationResult.Validated = true;
        this.StorageAccountValidated.emit(this.validationResult);
      }

    });
  }

  @Input() siteToBeDiagnosed: SiteDaasInfo;
  @Input() sessionInProgress: boolean;
  @Input() useDiagServerForLinux: boolean = false;
  @Output() StorageAccountValidated: EventEmitter<DaasValidationResult> = new EventEmitter<DaasValidationResult>();

  chosenStorageAccount: string;
  checkingBlobSasUriConfigured: boolean = true;
  validationResult: DaasValidationResult = new DaasValidationResult();
  validateStorageConfigurationResponse: any;
  error: any;
  JSON: any;

  toggleStorageAccountPanel() {
    this.globals.openCreateStorageAccountPanel = !this.globals.openCreateStorageAccountPanel;
    this.telemetryService.logEvent("OpenCreateStorageAccountPanel");
    this.telemetryService.logPageView("CreateStorageAccountPanelView");
  }

  ngOnInit() {

    this.checkingBlobSasUriConfigured = true;

    this._daasService.getStorageConfiguration(this.siteToBeDiagnosed, this.useDiagServerForLinux).subscribe(daasStorageConfiguration => {
      if (!this.useDiagServerForLinux && (daasStorageConfiguration.ConnectionString || daasStorageConfiguration.SasUri)) {
        this._daasService.validateSasUri(this.siteToBeDiagnosed).subscribe(resp => {
          this.checkingBlobSasUriConfigured = false;
          if (resp.IsValid) {
            this.validateStorageConfigurationResponse = null;
            if (daasStorageConfiguration.SasUri) {
              this.chosenStorageAccount = this._daasService.getStorageAccountNameFromSasUri(daasStorageConfiguration.SasUri);
            } else if (daasStorageConfiguration.ConnectionString) {
              this.chosenStorageAccount = this._daasService.getStorageAccountNameFromConnectionString(daasStorageConfiguration.ConnectionString);
            }

            this.validationResult.ConnectionString = daasStorageConfiguration.ConnectionString;
            this.validationResult.BlobSasUri = daasStorageConfiguration.SasUri;
            this.validationResult.Validated = true;
            this.StorageAccountValidated.emit(this.validationResult);
          } else {
            this.validateStorageConfigurationResponse = resp;
          }
        });
      } else if (this.useDiagServerForLinux && daasStorageConfiguration.ConnectionString) {
        this._daasService.validateStorageAccount(this.siteToBeDiagnosed).subscribe(resp => {
          this.checkingBlobSasUriConfigured = false;
          if (resp.IsValid) {
            this.validateStorageConfigurationResponse = null;
            this.chosenStorageAccount = resp.StorageAccount;
            this.validationResult.ConnectionString = daasStorageConfiguration.ConnectionString;
            this.validationResult.Validated = true;
            this.StorageAccountValidated.emit(this.validationResult);
          } else {
            this.validateStorageConfigurationResponse = resp;
          }
        });
      } else {
        this.checkingBlobSasUriConfigured = false;
      }
    },
      error => {
        this.checkingBlobSasUriConfigured = false;
        this.error = error;
      });
  }

  isString(obj: any): boolean {
    return (typeof obj) === "string";
  }

  getException(validateStorageConfigurationResponse: any) {

    if (this.useDiagServerForLinux) {
      return validateStorageConfigurationResponse.UnderlyingException
    }
    return validateStorageConfigurationResponse.Exception;
  }

}