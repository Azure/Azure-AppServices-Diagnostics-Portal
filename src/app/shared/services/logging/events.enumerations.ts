export enum CommonLogEventType {
    Message,
    Error,
    Click,
    StartUp,
    MissingSolution,
    Feedback,
    FeedbackMessage,
    TabOpened,
    TabClosed,
    IncidentNotification,
    IncidentDetails,
    IncidentDismissed
}

export enum AvailabilityEventType {
    AnalysisInitialized,
    CurrentAppHealth,
    DowntimeVisitedSummary,
    SolutionExpanded,
    SolutionTried,
    InlineActionTriggered,
    InlineSubActionSummary,
    AppAnalysisSummary,
    DetectorViewOpened,
    DetectorViewInstanceSelected,
    AppRestartAnalysisSummary,
    MemorySummaryStatus,
    SummaryViewExpanded, 
    SolutionDisplayed,
    SolutionFeedback,
    AppInsightsSettings,
    AppInsightsExceptionSummary
}

export enum BotEventType{
    HealthCheckInvoked,
    HealthCheckResults,
    HealthCheckReportStats,
    DetectorViewChatDisplayed
}