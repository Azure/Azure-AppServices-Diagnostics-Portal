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
  IncidentDismissed,
  AzureComm
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

export enum BotEventType {
  HealthCheckInvoked,
  HealthCheckResults,
  HealthCheckReportStats,
  DetectorViewChatDisplayed,
  LiveChatWidgetInit,
  LiveChatWidgetSkipped,
  LiveChatWidgetLoaded,
  LiveChatWidgetOpened,
  LiveChatWidgetClosed,
  LiveChatWidgetCustomerEngaged,
  LiveChatWidgetHelpPopupShown
}

export enum V2EventType {
  CategorySelected,
  Search,
  SearchResultSelected,
  TopLevelDetectorSelected,
  DetectorSummarySelected,
  DetectorSummaryFullReportSelected,
  DetectorSummaryChildDetectorSelected,
  DetectorSummaryInsightSelected,
  ChatSearch,
  ChatSearchSelected,
  NotificationClicked
}
