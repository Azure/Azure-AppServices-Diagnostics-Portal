export enum AnalysisType {
  None = 0x0,
  AppAnalysis = 0x1,
  PerformanceAnalysis = 0x2
}

export enum ResourceTypes {
  Site = 0x1,
  AppServiceEnvironment = 0x2
}

export enum IssueType {
  ServiceIncident,
  AppDeployment,
  AppCrash,
  RuntimeIssueDetected,
  AseDeployment
}

export enum SolutionType {
  QuickSolution = 0x1,
  DeepInvestigation = 0x2,
  BestPractices = 0x4
}

export enum SolutionStatus {
  NotStarted = 0,
  Running = 1,
  Completed = 2
}

export enum ActionType {
  Inline = 1,
  Blade = 2,
  Next = 3,
  NewTab = 4
}

export enum ActionStatus {
  NotStarted = 0,
  Running = 1,
  Failed = 2,
  Passed = 3
}
