import { Injectable } from '@angular/core';
import { AvailabilityEventType } from './events.enumerations';
import { SummaryHealthStatus } from '../../models/summary-view-model';
import { LoggingService } from './logging.service';
import { AuthService } from '../../../startup/services/auth.service';
import { ArmService } from '../arm.service';
import { PortalService } from '../../../startup/services/portal.service';
import { StartupInfo } from '../../models/portal';

@Injectable()
export class AvailabilityLoggingService extends LoggingService {
  constructor(
    private _portalService: PortalService,
    private _authService: AuthService,
    private _armService: ArmService
  ) {
    super(_portalService, _authService, _armService);
  }

  LogStartUpInfo(startupInfo: StartupInfo, category: string = 'Availability') {
    //This is a No-Op so that it only gets logged in base
  }

  LogAnalysisInitialized(analysisName, category: string = 'Availability') {
    this._log(
      AvailabilityEventType[AvailabilityEventType.AnalysisInitialized],
      category,
      {
        analysisName: analysisName
      }
    );
  }

  LogCurrentHealth(isHealthy: boolean) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.CurrentAppHealth],
      'Availability',
      { isHealthy: isHealthy }
    );
  }

  LogDowntimeVisitedSummary(
    startTime: string,
    endTime: string,
    isDowntimeNow: boolean,
    observationSources: string[],
    solutions: string[]
  ) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.DowntimeVisitedSummary],
      'Availability',
      {
        startTime: startTime,
        endTime: endTime,
        isDowntimeNow: isDowntimeNow,
        observations: observationSources
          ? observationSources.toString().replace(new RegExp(',', 'g'), '|')
          : '',
        observationCount: observationSources ? observationSources.length : 0,
        solutions: solutions
          ? solutions.toString().replace(new RegExp(',', 'g'), '|')
          : '',
        solutionsCount: solutions ? solutions.length : 0
      }
    );
  }

  LogSolutionExpanded(
    name: string,
    order: string,
    downtimeStartTime: string = '',
    downtimeEndTime: string = '',
    isDowntimeNow: string = ''
  ) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.SolutionExpanded],
      'Availability',
      {
        solution: name,
        order: order,
        downtimeStartTime: downtimeStartTime,
        downtimeEndTime: downtimeEndTime,
        isDowntimeNow: isDowntimeNow
      }
    );
  }

  LogSolutionDisplayed(name: string, order: string, source: string) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.SolutionDisplayed],
      'Availability',
      {
        solution: name,
        order: order,
        source: source
      }
    );
  }

  LogSolutionTried(
    name: string,
    order: string,
    actionType: string,
    actionName: string,
    downtimeStartTime: string = '',
    downtimeEndTime: string = '',
    isDowntimeNow: string = ''
  ) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.SolutionTried],
      'Availability',
      {
        solution: name,
        order: order,
        actionType: actionType,
        actionName: actionName,
        downtimeStartTime: downtimeStartTime,
        downtimeEndTime: downtimeEndTime,
        isDowntimeNow: isDowntimeNow
      }
    );
  }

  LogInlineActionTriggered(actionName: string, solutionName: string) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.InlineActionTriggered],
      'Availability',
      {
        solution: solutionName,
        action: actionName
      }
    );
  }

  LogInlineSubActionSummary(
    subAction: string,
    action: string,
    subActionStatus: string
  ) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.InlineSubActionSummary],
      'Availability',
      {
        subAction: subAction,
        action: action,
        subActionStatus: subActionStatus
      }
    );
  }

  LogAppAnalysisSummary(numberOfDowntimes: string) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.AppAnalysisSummary],
      'Availability',
      {
        numberOfDowntimes: numberOfDowntimes
      }
    );
  }

  LogDetectorViewOpened(
    source: string,
    rank: number,
    downtimeStartTime: string = '',
    downtimeEndTime: string = '',
    isDowntimeNow: string = ''
  ) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.DetectorViewOpened],
      'Availability',
      {
        source: source,
        rank: rank,
        downtimeStartTime: downtimeStartTime,
        downtimeEndTime: downtimeEndTime,
        isDowntimeNow: isDowntimeNow
      }
    );
  }

  LogDetectorViewInstanceSelected(source: string, instance: string) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.DetectorViewInstanceSelected],
      'Availability',
      {
        source: name,
        instance: instance
      }
    );
  }

  LogAppRestartAnalysisSummary(day: string, numberOfResons: string) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.AppRestartAnalysisSummary],
      'Availability',
      {
        day: day,
        numberOfReasons: numberOfResons
      }
    );
  }

  LogMemorySummaryStatus(detector: string, status: SummaryHealthStatus) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.MemorySummaryStatus],
      'Availability',
      {
        detector: detector,
        status: status
      }
    );
  }

  LogSummaryViewExpanded(detector: string, status: SummaryHealthStatus) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.SummaryViewExpanded],
      'Availability',
      {
        detector: detector,
        status: status
      }
    );
  }

  LogSolutionFeedback(solutionName: string, helpful: boolean) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.SolutionFeedback],
      'Availability',
      {
        source: solutionName,
        helpful: helpful
      }
    );
  }

  LogAppInsightsSettings(appInsightsEnabled: boolean) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.AppInsightsSettings],
      'Availability',
      {
        enabled: appInsightsEnabled
      }
    );
  }

  LogAppInsightsExceptionSummary(
    startTime: string,
    endTime: string,
    exceptionTypes: string[]
  ) {
    this._log(
      AvailabilityEventType[AvailabilityEventType.AppInsightsExceptionSummary],
      'Availability',
      {
        startTime: startTime,
        endTime: endTime,
        exceptionTypes: exceptionTypes
          ? exceptionTypes.toString().replace(new RegExp(',', 'g'), '|')
          : ''
      }
    );
  }
}
