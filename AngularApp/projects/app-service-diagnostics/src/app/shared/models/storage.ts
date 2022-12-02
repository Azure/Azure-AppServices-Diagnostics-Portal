export class StorageAccount {
  id: string;
  kind: string;
  location: string;
  name: string;
  type: string;
}

export interface StorageKey {
  keyName: string;
  value: string;
  permissions: string;
}

export interface StorageKeys {
  keys: StorageKey[];
}

export class NewStorageAccount {
  sku: StorageAccountSku = new StorageAccountSku();
  kind: string = 'StorageV2';
  location: string;
}

export class NewContainer {
  properties: any = { publicAccess: 'None' };
}

export class StorageAccountSku {
  name: string = 'Standard_GRS';
}

export class SasUriPostBody {
  signedServices: string;
  signedResourceTypes: string;
  signedPermission: string;
  signedProtocol: string;
  signedStart: string;
  signedExpiry: string;
}

export interface SasUriPostResponse {
  accountSasToken: string;
}
