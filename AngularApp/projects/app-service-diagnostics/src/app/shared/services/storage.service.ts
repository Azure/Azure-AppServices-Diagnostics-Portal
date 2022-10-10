import { Injectable } from '@angular/core';
import { ArmService } from './arm.service';
import { UriElementsService } from './urielements.service';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ResponseMessageCollectionEnvelope, ResponseMessageEnvelope } from '../models/responsemessageenvelope';
import { StorageAccount, StorageKeys, NewStorageAccount, SasUriPostBody, SasUriPostResponse, NewContainer } from '../models/storage';
import * as moment from 'moment';
import { HttpResponse } from '@angular/common/http';
import { ArmResource } from '../../shared-v2/models/arm';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor(private _armClient: ArmService, private _uriElementsService: UriElementsService) { }
  private apiVersion: string = "2019-06-01";

  getStorageAccounts(subscriptionId: string): Observable<StorageAccount[]> {
    let url = this._uriElementsService.getStorageAccountsUrl(subscriptionId);
    return this._armClient.getResource<any>(url, this.apiVersion).pipe(
      map((response: ResponseMessageCollectionEnvelope<any>) =>
        response.value.map((item: ResponseMessageEnvelope<any>) => {
          let account = new StorageAccount();
          account.id = item.id;
          account.kind = item.kind;
          account.location = item.location;
          account.name = item.name;
          account.type = item.type;
          return account;
        })));
  }

  getStorageAccountKey(storageAccountId: string): Observable<StorageKeys> {
    let url = this._uriElementsService.getStorageAccountKeyUrl(storageAccountId);
    return this._armClient.postResourceWithoutEnvelope<StorageKeys, any>(url, null, this.apiVersion).pipe(
      map((response: StorageKeys) => {
        return response;
      }));
  }

  createStorageAccount(subscriptionId: string, resourceGroupName: string, accountName: string, location: string): Observable<string> {
    let url = this._uriElementsService.createStorageAccountsUrl(subscriptionId, resourceGroupName, accountName.toLowerCase());
    let requestBody = new NewStorageAccount();
    requestBody.location = location;
    return this._armClient.putResourceFullResponse(url, requestBody, true, this.apiVersion).pipe(
      map((response: HttpResponse<{}>) => {
        let locationHeader = response.headers.get('Location');
        if (locationHeader != null) {
          return locationHeader;
        }
      }));
  }

  //https://docs.microsoft.com/en-us/rest/api/storagerp/blobcontainers/create
  createContainerIfNotExists(storageAccountId: string, containerName: string): Observable<boolean> {
    let url = this._uriElementsService.getStorageContainerUrl(storageAccountId, containerName.toLowerCase());

    return this._armClient.getResourceFullResponse<ArmResource>(url, true, this.apiVersion).pipe(
      map(containerResp => {
        if (containerResp.ok && containerResp.body.properties && !containerResp.body.properties.deleted) {
          return true;
        }
      }), catchError(error => {

        //
        // If the container does not exist or if it is marked as
        // deleted we will get an error and we can try creating it 
        //

        let requestBody = new NewContainer();
        return this._armClient.putResourceFullResponse(url, requestBody, true, this.apiVersion).pipe(
          map(response => {
            if (response && response.ok) {
              return true;
            }
          }));
      })
    );
  }

  // https://docs.microsoft.com/en-us/rest/api/storagerp/storageaccounts/listaccountsas
  generateSasKey(storageAccountResourceUri: string, storageAccountkey: string): Observable<string> {
    let postBody = new SasUriPostBody();
    postBody.signedServices = "bqt";
    postBody.signedResourceTypes = "co";
    postBody.signedPermission = "acdlpruw";
    postBody.signedProtocol = "http,https";
    postBody.signedExpiry = moment.utc().add(10, 'years').toISOString();
    postBody.signedStart = moment.utc().toISOString();
    let url = this._uriElementsService.createSasUri(storageAccountResourceUri);

    return this._armClient.postResourceFullResponse<SasUriPostResponse>(url, postBody, true, this.apiVersion)
      .pipe(map(response => {
        if (response && response.body) {
          return response.body.accountSasToken;
        }
      }));
  }

  randomHash(): string {
    //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    return Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5);
  }

  getNewStorageAccoutName(siteName: string): string {
    const searchRegExp = /-/gi;
    siteName = siteName.replace(searchRegExp, '');
    siteName = siteName.substring(0, siteName.length > 6 ? 6 : siteName.length);
    return siteName + this.randomHash().toLowerCase();
  }


}
