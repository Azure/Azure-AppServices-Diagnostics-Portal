import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { PanelType, IChoiceGroupOption, IDropdownOption } from 'office-ui-fabric-react';
import { Globals } from '../../../globals';
import { StorageService } from '../../../shared/services/storage.service';
import { SiteService } from '../../../shared/services/site.service';
import { SiteDaasInfo } from '../../../shared/models/solution-metadata';
import { SharedStorageAccountService, StorageAccountProperties } from '../../../shared-v2/services/shared-storage-account.service';
import { StorageAccount } from '../../../shared/models/storage';
import { DaasService } from '../../../shared/services/daas.service';
import { ArmService } from '../../../shared/services/arm.service';
import { interval, Subscription } from 'rxjs';
import { WebSitesService } from '../../../resources/web-sites/services/web-sites.service';
import { OperatingSystem } from '../../../shared/models/site';

const BlobContainerName: string = "memorydumps";

@Component({
  selector: 'create-storage-account-panel',
  templateUrl: './create-storage-account-panel.component.html',
  styleUrls: ['./create-storage-account-panel.component.scss']
})
export class CreateStorageAccountPanelComponent implements OnInit {

  type: PanelType = PanelType.custom;
  width: string = "850px";
  error: any;
  creatingStorageAccount: boolean = false;
  siteToBeDiagnosed: SiteDaasInfo;
  newStorageAccountName: string;
  createNewMode: boolean = true;
  errorMessage: string = "";
  loadingStroageAccounts: boolean = true;
  defaultSelectedKey: string = "";
  selectedStorageAccount: StorageAccount = null;
  generatingSasUri: boolean = false;
  subscriptionId: string = "";
  resourceGroup: string = "";
  subscriptionName: string = "";
  private apiVersion: string = "2019-06-01";
  subscriptionOperationStatus: Subscription;
  pollCount: number = 0;
  isWindowsApp: boolean = true;

  storageAccounts: IDropdownOption[] = [];
  choiceGroupOptions: IChoiceGroupOption[] = [
    { key: 'CreateNew', text: 'Create new', defaultChecked: true, onClick: () => { this.createNewMode = true } },
    { key: 'ChooseExisting', text: 'Choose existing', onClick: () => { this.createNewMode = false } }
  ];


  constructor(public globals: Globals, private _storageService: StorageService, private _daasService: DaasService,
    private _siteService: SiteService, private _sharedStorageAccountService: SharedStorageAccountService,
    private _armService: ArmService, private _webSiteService: WebSitesService) {
    this.isWindowsApp = this._webSiteService.platform === OperatingSystem.windows;
  }

  ngOnInit() {

    this._siteService.getSiteDaasInfoFromSiteMetadata().subscribe(site => {
      this.siteToBeDiagnosed = site;
      this.subscriptionId = site.subscriptionId;
      this.subscriptionName = this.subscriptionId;
      this.resourceGroup = site.resourceGroupName;
      this._armService.getArmResource<any>("subscriptions/" + this.subscriptionId, this.apiVersion).subscribe(subscriptionResponse => {
        if (subscriptionResponse != null) {
          this.subscriptionName = subscriptionResponse.displayName;
        }
      });
      this._storageService.getStorageAccounts(this.siteToBeDiagnosed.subscriptionId).subscribe(resp => {
        this.loadingStroageAccounts = false;
        let storageAccounts = resp;
        this.initStorageAccounts(storageAccounts, this.getSiteLocation());
      },
        error => {
          this.errorMessage = "Failed to retrieve storage accounts";
          this.error = error;
        });
      this.newStorageAccountName = this._storageService.getNewStorageAccoutName(this._siteService.currentSiteStatic.name);
    });
  }

  initStorageAccounts(storageAccounts: StorageAccount[], currentLocation: string) {
    this.storageAccounts = [];
    let accountsCurrentLocation = storageAccounts.filter(x => x.location === currentLocation);

    for (let index = 0; index < accountsCurrentLocation.length; index++) {
      let isSelected = false;
      const acc = accountsCurrentLocation[index];
      if (index === 0) {
        isSelected = true;
      }
      this.storageAccounts.push({
        key: acc.name,
        text: acc.name,
        ariaLabel: acc.name,
        data: acc,
        isSelected: isSelected
      });

      if (isSelected) {
        this.defaultSelectedKey = acc.name;
        this.selectedStorageAccount = acc;
      }
    }
  }

  getSiteLocation() {
    let location = this._siteService.currentSiteStatic.location;
    location = location.replace(/\s/g, "").toLowerCase();
    return location;
  }

  dismissedHandler() {
    this.globals.openCreateStorageAccountPanel = false;
  }

  updateStorageAccount(e: { event: Event, newValue?: string }) {
    this.newStorageAccountName = e.newValue.toString();
  }

  saveChanges() {
    this.error = '';
    this.errorMessage = '';

    if (this.createNewMode) {
      this.creatingStorageAccount = true;
      this._storageService.createStorageAccount(this.siteToBeDiagnosed.subscriptionId, this.siteToBeDiagnosed.resourceGroupName, this.newStorageAccountName, this._siteService.currentSiteStatic.location)
        .subscribe(location => {

          // 
          // If someone tries to recreate an account with the same name,
          // the API will return a 200 but there will be no location header
          // We should treat it as success as the storage account already
          // exists
          //

          if (location != null) {
            this.subscriptionOperationStatus = interval(10000).subscribe(res => {
              this.checkAccountStatus(location);
            });
          } else {
            this.creatingStorageAccount = false;
          }

        },
          error => {
            this.creatingStorageAccount = false;
            this.error = error;
            this.errorMessage = "Failed to create a storage account";
          });
    } else {
      this.setBlobSasUri(this.selectedStorageAccount.id, this.selectedStorageAccount.name);
    }

  }

  checkAccountStatus(location: string) {
    this.pollCount++;
    if (this.pollCount > 20) {
      this.creatingStorageAccount = false;
      this.error = "The operation to create the storage account timed out. Please retry after some time or use an existing storage account";
      this.subscriptionOperationStatus.unsubscribe();
      return;
    }
    this._armService.getResourceFullUrl(location, true).subscribe((storageAccount: StorageAccount) => {
      if (storageAccount != null) {
        this.subscriptionOperationStatus.unsubscribe();
        this.creatingStorageAccount = false;
        this.setBlobSasUri(storageAccount.id, storageAccount.name);
      }
    });
  }

  setBlobSasUri(storageAccountId: string, storageAccountName: string) {
    this.generatingSasUri = true;
    this._storageService.createContainerIfNotExists(storageAccountId, BlobContainerName).subscribe(containerCreated => {
      if (containerCreated) {
        this._storageService.getStorageAccountKey(storageAccountId).subscribe(resp => {
          if (resp.keys && resp.keys.length > 0) {
            if (resp.keys[0].value == null) {
              this.generatingSasUri = false;
              this.error = "Failed to retrieve keys for this storage account. Please choose a different storage account or create a new one";
              return;
            }
            let storageKey = resp.keys[0].value;
            this.generateStorageConnectionString(storageAccountId, storageAccountName, storageKey);
          }
        },
          error => {
            this.errorMessage = "Failed while getting storage account key";
            this.generatingSasUri = false;
            this.error = error;
          });
      } else {
        this.errorMessage = "Failed to create storage account container";
        this.error = "Either the container does not exist or it is marked as deleted. Please try using a different storage account or retry the operation";
        this.generatingSasUri = false;
      }
    },
      error => {
        this.errorMessage = "Failed while creating storage account container";
        this.generatingSasUri = false;
        this.error = error;
      });

  }

  generateStorageConnectionString(storageAccountId: string, storageAccountName: string, storageKey: string) {

    let storageAccountProperties: StorageAccountProperties = new StorageAccountProperties();
    storageAccountProperties.name = storageAccountName;
    storageAccountProperties.connectionString = `DefaultEndpointsProtocol=https;AccountName=${storageAccountName};AccountKey=${storageKey};EndpointSuffix=${this._armService.storageUrl}`;
    this._daasService.setStorageConfiguration(this.siteToBeDiagnosed, storageAccountProperties, true).subscribe(resp => {
      this.generatingSasUri = false;
      this._sharedStorageAccountService.emitChange(storageAccountProperties);
      this.globals.openCreateStorageAccountPanel = false;
    }, error => {
      this.errorMessage = "Failed while updating Storage Connection string app setting";
      this.generatingSasUri = false;
      this.error = error;
    });
  }

  selectStorageAccount(event: any) {
    this.selectedStorageAccount = event.option.data;
  }

}
