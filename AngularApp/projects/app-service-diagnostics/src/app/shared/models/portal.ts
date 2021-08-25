import { Subscription } from './subscription';

export interface KeyValuePair {
    key: string;
    value: any;
}

export interface StartupInfo {
    token: string;
    subscriptions: Subscription[];
    sessionId: string;
    resourceId: string;
    featureUri?: string;
    armEndpoint?: string;
    source?: string;
    pesId?: string;
    supportTopicId?: string;
    workflowId?: string;
    resourceType?: ResourceType;
    additionalParameters?: any;
    optionalParameters?: Array<KeyValuePair>;
    effectiveLocale: string;
    isIFrameForCaseSubmissionSolution: boolean;
}

export enum ResourceType {
    Site = 0,
    HostingEnvironment = 1,
    Other = 2
}

export enum AppType {
    WebApp = 1 << 0,
    FunctionApp = 1 << 1,
    WorkflowApp = 1 << 5
}

export interface Event {
    data: Data;
    srcElement: any;
    origin: string
}

export interface Data {
    signature: string;
    kind: string;
    data: any;
}

export interface Action {
    subcomponent: string;
    action: string;
    data: any;  // Properties of the object will be logged as a key-value pair
}

export interface Message {
    level: LogEntryLevel;
    message: string;
    restArgs?: any[];
}

export interface OpenBladeInfo {
    detailBlade: string;
    detailBladeInputs: any;
    extension?: string;
}

export interface WebsiteId {
    Name: string;
    ResourceGroup: string;
    SubscriptionId: string;
}

export class Verbs {
    // Initialization verbs
    public static message = 'message';
    public static ready = 'ready';

    // Requests from iframe
    public static getStartupInfo = 'get-startup-info';
    public static openBlade = 'open-blade';
    public static closeBlades = 'close-blades';
    public static updateBladeInfo = 'update-blade-info';
    public static logAction = 'log-action';
    public static logMessage = 'log-message';
    public static setDirtyState = 'set-dirtystate';

    // Requests from Ibiza
    public static sendStartupInfo = 'send-startup-info';
    public static sendSessionId = 'send-sessionId';
    public static sendToken = 'send-token';
    public static sendIFrameInfo = 'send-iframe-info';

    // Blade-specific Requests from iframe
    public static openScaleUpBlade = 'open-scaleup-blade';
    public static openSupportRequestBlade = 'open-support-request-inputs';
    public static getAppInsightsResource = 'get-appinsights-resource';
    public static sendAppInsightsResource = 'send-appinsights-resource';


    //CXP Live Chat Requests from iframe
    public static getChatAvailability = 'get-chat-availability';
    public static sendChatAvailability = 'send-chat-availability';
    public static buildChatUrl = 'build-chat-url';
    public static sendbuiltChatUrl = 'send-built-chat-url';
    public static getChatUrl = 'get-chat-url'; //This combines the functionality of getChatAvailability and buildChatUrl
    public static sendChatUrl = 'send-chat-url';
    public static getBladeReturnValue = 'get-Blade-Return-Value';
    public static getBladeReturnValueResponse = 'get-Blade-Return-Value-Response';
    public static setBladeReturnValue = 'set-Blade-Return-Value';
    public static setBladeReturnValueResponse = 'set-Blade-Return-Value-Response';
}


export enum LogEntryLevel {
    /**
     * Custom events.
     */
    Custom = -2,
    /**
     * Debug level.
     */
    Debug = -1,
    /**
     * Verbose level.
     */
    Verbose = 0,
    /**
     * Warning level.
     */
    Warning = 1,
    /**
     * Error level.
     */
    Error = 2,
}

// These must not change because these are the identifiers for the portal blades
export class BladeOptions {
    public static pulse: string = 'pulse';
    public static eventviewer: string = 'eventviewer';
    public static freblogs: string = 'freblogs';
    public static sitemetrics: string = 'sitemetrics';
    public static diagnostics: string = 'diagnostics';
    public static appserviceplanmetrics: string = 'appserviceplanmetrics';
    public static scaleUp: string = 'scaleUp';
    public static scaleOut: string = 'scaleOut';
    public static applicationInsights: string = 'applicationInsights';
    public static advancedAppRestartBlade: string = 'advancedAppRestartBlade';
}

export class SupportBladeDefinition {
    Title: string;
    Identifier: string;
    //TODO: Add log name?
}

export class SupportBladeDefinitions {
    public static Pulse: SupportBladeDefinition = {
        Identifier: BladeOptions.pulse,
        Title: 'Live Http Traffic'
    };

    public static EventViewer: SupportBladeDefinition = {
        Identifier: BladeOptions.eventviewer,
        Title: 'Application Events'
    };

    public static FREBLogs: SupportBladeDefinition = {
        Identifier: BladeOptions.freblogs,
        Title: 'FREB Logs'
    };

    public static MetricPerInstance: SupportBladeDefinition = {
        Identifier: BladeOptions.sitemetrics,
        Title: 'Metrics per instance (Apps)'
    };

    public static AppServicePlanMetrics: SupportBladeDefinition = {
        Identifier: BladeOptions.appserviceplanmetrics,
        Title: 'Metrics per instance (App Service Plan)'
    };

    public static DaaS: SupportBladeDefinition = {
        Identifier: BladeOptions.diagnostics,
        Title: 'Diagnostics'
    };
}
