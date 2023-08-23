export const TelemetryEventNames = {
    DetectorViewLoaded: 'DetectorViewLoaded',
    HomePageLoaded: 'HomePageLoaded',
    CategoryPageLoaded: 'CategoryPageLoaded',
    CategoryOverviewPageLoaded: 'CategoryOverviewPageLoaded',
    OnboardingFlowLoaded: 'OnboardingFlowLoaded',
    SearchTermAdditionLoaded: 'SearchTermAdditionLoaded',
    SideNavigationLoaded: 'SideNavigationLoaded',
    SupportTopicsLoaded: 'SupportTopicsLoaded',
    CategoryCardClicked: 'CategoryClicked',
    DetectorCardClicked: 'DetectorClicked',
    SideNavigationFilter: 'SideNavigationFilter',
    SideNavigationItemClicked: 'SideNavigationItemClicked',
    InsightTitleClicked: 'InsightTitleClicked',
    InsightRated: 'InsightRated',
    ChildDetectorClicked: 'ChildDetectorClicked',
    InsightsSummary: 'InsightsSummary',
    ChildDetectorsSummary: 'ChildDetectorsSummary',
    MarkdownClicked: 'MarkdownClicked',
    LinkClicked: 'LinkClicked',
    StarRatingSubmitted: 'StarRatingSubmitted',
    GenieSearchRatingSubmitted: 'GenieSearchRatingSubmitted',
    CardClicked: 'CardClicked',
    FormButtonClicked: 'FormButtonClicked',
    ChangeAnalysisTimelineClicked: 'ChangeAnalysisTimelineClicked',
    OndemandScanClicked: 'OndemandScanClicked',
    ChangeAnalysisEnableClicked: 'ChangeAnalysisEnableClicked',
    ChangeAnalysisChangeClicked: 'ChangeAnalysisChangeClicked',
    ChangeAnalysisChangeFeedbackClicked: 'ChangeAnalysisChangeFeedbackClicked',
    SearchResultsLoaded: 'SearchResultsLoaded',
    MoreResultsButtonClicked: 'MoreResultsButtonClicked',
    SearchQueryResults: 'SearchQueryResults',
    SearchResultClicked: 'SearchResultClicked',
    DeepSearchResults: 'DeepSearchResults',
    DeepSearchResultClicked: 'DeepSearchResultClicked',
    SearchResultFeedback: 'SearchResultFeedback',
    SearchComponentVisible: "SearchComponentVisible",
    WebQueryResults: 'WebQueryResults',
    WebQueryResultClicked: 'WebQueryResultClicked',
    MoreWebResultsClicked: 'MoreWebResultsClicked',
    AuthorSelectSearchTerm: 'AuthorSelectSearchTerm',
    AuthorCreateSearchTerm: 'AuthorCreateSearchTerm',
    AuthorRemoveSearchTerm: 'AuthorRemoveSearchTerm',
    DependencyGraphClick: 'DependencyGraphClick',
    GetCXPChatAvailability: 'GetCXPChatAvailability',
    BuildCXPChatUrl: 'BuildCXPChatUrl',
    GetCXPChatURL: 'GetCXPChatURL',
    CXPChatUserAction: 'CXPChatUserAction',
    CXPChatEligibilityCheck: 'CXPChatEligibilityCheck',
    AppInsightsConnectionError: 'AppInsightsConnectionError',
    AppInsightsConnected: 'AppInsightsConnected',
    AppInsightsEnableClicked: 'AppInsightsEnableClicked',
    AppInsightsAlreadyConnected: 'AppInsightsAlreadyConnected',
    AppInsightsEnabled: 'AppInsightsEnabled',
    AppInsightsNotEnabled: 'AppInsightsNotEnabled',
    AppInsightsFromDifferentSubscription: 'AppInsightsFromDifferentSubscription',
    AppInsightsAccessCheckError: 'AppInsightsAccessCheckError',
    AppInsightsResourceMissingWriteAccess: 'AppInsightsResourceMissingWriteAccess',
    AppInsightsMaxApiKeysExceeded: 'AppInsightsMaxApiKeysExceeded',
    AppInsightsConfigurationInvalid: 'AppInsightsConfigurationInvalid',
    AppInsightsAppSettingsUpdatedWithLatestSecret: 'AppInsightsAppSettingsUpdatedWithLatestSecret',
    AppInsightsFailedDuringKeyValidation: 'AppInsightsFailedDuringKeyValidation',
    SummaryCardClicked: 'SummaryCardClicked',
    ToolCardClicked: 'ToolCardClicked',
    TimePickerApplied: 'TimePickerApplied',
    CategoryNavItemClicked: 'CategoryNavItemClicked',
    DowntimeInteraction: 'DowntimeInteraction',
    DowntimeListPassedByDetector: 'DowntimePassedByDetector',
    CrashMonitoringEnabled: 'CrashMonitoringEnabled',
    CrashMonitoringStopped: 'CrashMonitoringStopped',
    CrashMonitoringAgentDisabled: 'CrashMonitoringAgentDisabled',
    LoadingDetectorViewStarted: 'LoadingDetectorViewStarted',
    LoadingDetectorViewEnded: 'LoadingDetectorViewEnded',
    OpenAiMessageViewed: 'OpenAiMessageViewed',
    OpenAiInPrivateAccess: 'OpenAiInPrivateAccess',
    OpenGenie: 'OpenGenie',
    OpenFeedbackPanel: 'OpenFeedbackPanel',
    RefreshClicked: 'RefreshClicked',
    QuickLinkClicked: 'QuickLinkClicked',
    QuickLinkOnCategoryTileClicked: 'QuickLinkOnCategoryTileClicked',
    RiskTileClicked: 'RiskTileClicked',
    RiskTileLoaded: 'RiskTileLoaded',
    ArmConfigMergeError: 'ArmConfigMergeError',
    OpenRiskAlertPanel: 'openRiskAlertsPanel',
    IncidentAssistancePage: 'IncidentAssistancePage',
    IncidentAssistanceLoaded: 'IncidentAssistanceLoaded',
    IncidentValidationCheck: 'IncidentValidationCheck',
    IncidentUpdateOperation: 'IncidentUpdateOperation',
    RiskAlertNotificationLoaded: 'RiskAlertNotificationLoaded',
    PortalIFrameLoadingException: 'PortalIFrameLoadingException',
    PortalIFrameLoadingSuccess: 'PortalIFrameLoadingSuccess',
    PortalIFrameLoadingStart: 'PortalIFrameLoadingStart',
    SurveyPageLoaded: 'SurveyPageLoaded',
    SurveyLoadStatus: 'SurveyLoadStatus',
    SurveySubmitStatus: 'SurveySubmitStatus',
    SolutionOrchestratorSummary: 'SolutionOrchestratorSummary',
    SolutionOrchestratorOptionSelected: 'SolutionOrchestratorOptionSelected',
    SolutionOrchestratorViewSolutionsClicked: 'SolutionOrchestratorViewSolutionsClicked',
    SolutionOrchestratorViewSupportingDataClicked: 'SolutionOrchestratorViewSupportingDataClicked',
    OpenSlotInNewTab: 'OpenSlotInNewTab',
    ResiliencyScoreReportButtonDisplayed: 'ResiliencyScoreReportButtonDisplayed',
    ResiliencyScoreReportButtonClicked: 'ResiliencyScoreReportButtonClicked',
    ResiliencyScoreReportDownloaded: 'ResiliencyScoreReportDownloaded',
    ResiliencyScoreReportResourceNotSupported: 'ResiliencyScoreReportResourceNotSupported',
    ResiliencyScoreReportInPrivateAccess: 'ResiliencyScoreReportInPrivateAccess',
    ResourceOutOfScopeUserResponse: 'ResourceOutOfScopeUserResponse',
    DownloadReportButtonDisplayed: 'DownloadReportButtonDisplayed',
    DownloadReportButtonClicked: 'DownloadReportButtonClicked',
    DownloadReportDirectLinkUsed: 'DownloadReportDirectLinkUsed',
    DownloadReportDirectLinkDownloaded: 'DownloadReportDirectLinkDownloaded',
    FavoriteDetectorAdded: 'FavoriteDetectorAdded',
    FavoriteDetectorClicked: 'FavoriteDetectorClicked',
    FavoriteDetectorRemoved: 'FavoriteDetectorRemoved',
    ICMTemplateManagementPage: 'ICMTemplateManagementPage',
    ICMTeamTemplateLoaded: 'ICMTeamTemplateLoaded',
    ICMTeamTemplateUpdate: 'ICMTeamTemplateUpdate',
    HomePageLogUser: 'HomePageLogUser',
    ChatGPTLoaded: 'ChatGPTLoaded',
    ChatGPTUserSettingLoaded: 'ChatGPTUserSettingLoaded',
    ChatGPTSampleClicked: 'ChatGPTSampleClicked',
    ChatGPTUserFeedbackLike: 'ChatGPTUserFeedbackLike',
    ChatGPTUserFeedbackDislike: 'ChatGPTUserFeedbackDislike',
    ChatGPTCheckMessageCount: 'ChatGPTCheckMessageCount',
    ChatGPTRequestError: 'ChatGPTRequestError',
    ChatGPTUserQuotaExceeded: 'ChatGPTUserQuotaExceeded',
    ChatGPTTooManyRequestsError: 'ChatGPTTooManyRequestsError',
    AICodeOptimizerInsightsReceived: 'AICodeOptimizerInsightsReceived',
    AICodeOptimizerInsightsARMTokenSuccessful: 'AICodeOptimizerInsightsARMTokenSuccessful',
    AICodeOptimizerInsightsARMTokenFailure: 'AICodeOptimizerInsightsARMTokenFailure',
    AICodeOptimizerInsightsOAuthAccessTokenSuccessful: 'AICodeOptimizerInsightsOAuthAccessTokenSuccessful',
    AICodeOptimizerInsightsOAuthAccessTokenFailure: 'AICodeOptimizerInsightsOAuthAccessTokenFailure',
    AICodeOptimizerInsightsAggregatedInsightsbyTimeRangeSuccessful: 'AICodeOptimizerInsightsAggregatedInsightsbyTimeRangeSuccessful',
    AICodeOptimizerInsightsAggregatedInsightsbyTimeRangeFailure: 'AICodeOptimizerInsightsAggregatedInsightsbyTimeRangeFailure',
    AICodeOptimizerInsightsFailureGettingOPIResources: 'AICodeOptimizerInsightsFailureGettingOPIResources',
    AICodeOptimizerOpenOptInsightsBladewithTimeRange: 'AICodeOptimizerOpenOptInsightsBladewithTimeRange',
    LoadingTimeOut: 'LoadingTimeOut',
    EmptySearchTerm: 'EmptySearchTerm',
    ChatGPTARMQueryResults: 'ChatGPTARMQueryResults',
    ChatGPTARMQueryError: 'ChatGPTARMQueryError',
    ChatGPTARMQueryTimedout: 'ChatGPTARMQueryTimedout',
    ChatGPTARMQueryResultEmpty: 'ChatGPTARMQueryResultEmpty',
    SuperGistAPILoaded: 'SuperGistAPILoaded',
    SuperGistUpdateDetectorReferencesButtonClicked: 'SuperGistDetectorReferencesButtonClicked',
    SuperGistUpdateSelectedButtonClicked: 'SuperGistUpdateSelectedButtonClicked',
    ChatGPTClearButtonClicked : 'ChatGPTClearButtonClicked',
    FeaturePathRouting: 'FeaturePathRouting',
};

export const TelemetrySource = {
    CaseSubmissionFlow: 'CaseSubmissionFlow',
    DiagAndSolveBlade: 'DiagAndSolveBlade',
    PortalReferral: 'PortalReferral',
}

export interface TelemetryPayload {
    eventIdentifier: string,
    eventPayload: {
        [name: string]: string
    }
}

export interface ITelemetryProvider {
    // Log a user action or other occurrence.
    logEvent(message?: string, properties?: any, measurements?: any);

    // Log an exception you have caught. (Exceptions caught by the browser are also logged.)
    logException(exception: Error, handledAt?: string, properties?: any, severityLevel?: any);

    // Logs that a page displayed to the user.
    logPageView(name: string, url: string, properties?: any, measurements?: any, duration?: number);

    // Log a diagnostic event such as entering or leaving a method.
    logTrace(message: string, properties?: any, severityLevel?: any);

    // Log a positive numeric value that is not associated with a specific event. Typically used to send regular reports of performance indicators.
    logMetric(name: string, average: number, sampleCount: number, min: number, max: number, properties?: any);

    // Immediately send all queued telemetry. Synchronous.
    flush();
}

export class TelemetryUtilities {
    static getProductNameByTypeAndKind(type: string, kind: string): string {
        let productName = type;
        if (kind && type.toLowerCase() === "microsoft.web/sites") {
            if (kind.indexOf('linux') >= 0 && kind.indexOf('functionapp') >= 0) {
                productName = "Azure Linux Function App";
            }
            else if (kind.indexOf("workflowapp") >= 0) {
                productName = "Azure Logic App Standard";
            }
            else if (kind.indexOf('linux') >= 0) {
                productName = "Azure Linux App";
            } else if (kind.indexOf('functionapp') >= 0) {
                productName = "Azure Function App";
            } else {
                productName = "Azure Web App";
            }
        }
        return productName;
    }
}
