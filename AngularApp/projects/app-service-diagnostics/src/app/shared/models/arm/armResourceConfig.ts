import { HealthStatus } from "diagnostic-data";
import { Category } from "../../../shared-v2/models/category";
import { MessageGroup } from "../../../supportbot/models/message-group";

export class ArmResourceConfig {
	homePageText?: HomePageText;
	matchRegEx?: string;
	searchSuffix?: string;
	azureServiceName?: string;
	armApiConfig?: ArmApiConfig;
	isSearchEnabled?: boolean;
	liveChatConfig?: LiveChatConfig
	categories?: Array<Category>;
    pesId?: string;
    liabilityCheckConfig?: LiabilityCheckConfig;
    quickLinks?: string[];
    keystoneDetectorId?: string;
    riskAlertConfigs?: RiskAlertConfig[];
    notificationConfig?: NotificationConfig;
    disableGenie: boolean=false;
}

export interface ArmApiConfig {
	armApiVersion?:string;
	isArmApiResponseBase64Encoded?:boolean;
}

export interface LiveChatConfig {
	isApplicableForLiveChat?: boolean;
	supportTopicIds?: string[];
}

export interface GenieConfig {
	isGenieEnabled: boolean;
	Messages: MessageGroup[];
}

export class HomePageText {
	title: string;
	description: string;
	searchBarPlaceHolder: string;
}

// Define whether liablity check is enabled and what checks should be done
export interface LiabilityCheckConfig {
    isLiabilityCheckEnabled?: boolean;
}

export class baseNotificationConfig {
    title: string;
    enableForCaseSubmissionFlow?: boolean = true;
}

export class RiskAlertConfig extends baseNotificationConfig {
    riskAlertDetectorId: string;
}

export class NotificationConfig extends baseNotificationConfig {
    notificationDetectorId: string;
}
