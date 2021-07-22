import { Dictionary } from './extensions';
import { InjectionToken } from '@angular/core';

export enum ResourceType {
    Site,
    Function,
    AppServiceEnvironment,
    WorkerApp
}

export interface ResourceTypeState {
    displayName: string;
    routeName: Function;
    resourceType: ResourceType;
    resourceTypeLabel?: string;
    enabled: boolean;
    caseId: boolean;
}

export interface ActivatedResource {
    type: ResourceType;
    resourceDefinition: Dictionary<string>;
}

export interface ArmResource {
    subscriptionId: string;
    resourceGroup: string;
    provider: string;
    resourceTypeName: string;
    resourceName: string;
}

export class ResourceInfo {
    resourceName: string;
    imgSrc: string;
    searchSuffix: string;

    constructor(resourceName = "",imgSrc = "",searchSuffix = "") {
        this.resourceName = resourceName;
        this.imgSrc = imgSrc;
        this.searchSuffix = searchSuffix;
    }
}

export interface ResourceServiceInputsJsonResponse{
    enabledResourceTypes : ResourceServiceInputs[];
}

export interface ResourceServiceInputs {
    resourceType: string;
    templateFileName: string;
    imgSrc: string;
    versionPrefix: string;
    service: string;
    armResource: ArmResource;
    azureCommImpactedServicesList: string;
    pesId: string;
    staticSelfHelpContent: string;
    altIcons?: { [path: string]: string };
    searchSuffix: string;
    emergingIssuesICMLookupEnabled?: boolean;
}

export const RESOURCE_SERVICE_INPUTS = new InjectionToken<ResourceServiceInputs>('ResourceServiceInputs');

export const DEFAULT_RESOURCE_SERVICE_INPUTS: ResourceServiceInputs = {
    resourceType: '',
    imgSrc: '',
    service: '',
    templateFileName: '',
    versionPrefix: '',
    armResource: null,
    azureCommImpactedServicesList: '',
    pesId: '',
    staticSelfHelpContent: '',
    searchSuffix: 'AZURE'
};
