import { HealthStatus } from "../models/detector";

export interface AlertInfo {
    header: string;
    details: string;
    seekConfirmation: boolean;
    confirmationOptions: ConfirmationOption[]; 
    alertStatus: HealthStatus;
    userAccessStatus:UserAccessStatus;
    resourceId?: string;
}

export interface ConfirmationOption {
    label: string;
    value: string;
}

export enum UserAccessStatus
{
  Unauthorized,
  Forbidden,  
  NotFound, 
  BadRequest,  
  ResourceNotRelatedToCase,  
  RequestFailure,
  SGMembershipNeeded,
  CaseNumberNeeded,
  HasAccess,
  ConsentRequired,
  AllowedResourceException
}