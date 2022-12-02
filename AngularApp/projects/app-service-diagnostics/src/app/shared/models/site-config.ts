import { ArmObj } from './armObj';

export interface SiteConfig extends ArmObj {
  properties: {
    applicationLogs: ApplicationLogsConfig;
    detailedErrorMessages: EnabledConfig;
    failedRequestsTracing: EnabledConfig;
    httpLogs: HttpLogsConfig;
  };
}

export interface HttpLogsConfig {
  fileSystem: FileSystemHttpLogsConfig;
  azureBlobStorage: AzureBlobStorageHttpLogsConfig;
}

export interface FileSystemHttpLogsConfig extends EnabledConfig {
  retentionInMb?: number;
  retentionInDays?: number;
}

export interface EnabledConfig {
  enabled: boolean;
}

export interface AzureBlobStorageHttpLogsConfig extends EnabledConfig {
  sasUrl: string;
  retentionInDays?: number;
}

export interface ApplicationLogsConfig {
  fileSystem: FileSystemApplicationLogsConfig;
  azureTableStorage: AzureTableStorageApplicationLogsConfig;
  azureBlobStorage: AzureBlobStorageApplicationLogsConfig;
}

export interface AzureBlobStorageApplicationLogsConfig {
  level: LogLevel;
  sasUrl: string;
  retentionInDays?: number;
}

export interface AzureTableStorageApplicationLogsConfig {
  level: LogLevel;
  sasUrl: string;
}

export class LogLevel {
  public static Off = 'Off';
  public static Verbose: 'Verbose';
  public static Information = 'Information';
  public static Warning = 'Warning';
  public static Error = 'Error';
}

export interface FileSystemApplicationLogsConfig {
  level: LogLevel;
}
