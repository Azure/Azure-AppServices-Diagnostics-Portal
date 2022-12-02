import { Injectable } from '@angular/core';
import { BotEventType } from './events.enumerations';
import { LoggingService } from './logging.service';
import { AuthService } from '../../../startup/services/auth.service';
import { ArmService } from '../arm.service';
import { PortalService } from '../../../startup/services/portal.service';
import { StartupInfo } from '../../models/portal';

@Injectable()
export class BotLoggingService extends LoggingService {
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

  LogHealthCheckInvoked(): void {
    this._log(BotEventType[BotEventType.HealthCheckInvoked], 'Support Home');
  }

  LogDetectorViewInBot(detector: string, displayed: boolean) {
    this._log(
      BotEventType[BotEventType.DetectorViewChatDisplayed],
      'Support Home',
      {
        detector: detector,
        displayed: displayed
      }
    );
  }

  LogHealthCheckResults(healthCheckResults: string[]): void {
    this._log(BotEventType[BotEventType.HealthCheckResults], 'Support Home', {
      results: healthCheckResults
        ? healthCheckResults.toString().replace(new RegExp(',', 'g'), '|')
        : ''
    });
  }

  LogLiveChatWidgetOpened(source: string): void {
    this._log(BotEventType[BotEventType.LiveChatWidgetOpened], source, {});
  }

  LogLiveChatWidgetClosed(source: string): void {
    this._log(BotEventType[BotEventType.LiveChatWidgetClosed], source, {});
  }

  LogLiveChatWidgetBeginInit(source: string): void {
    this._log(BotEventType[BotEventType.LiveChatWidgetInit], source, {});
  }

  LogLiveChatWidgetSkipped(source: string): void {
    this._log(BotEventType[BotEventType.LiveChatWidgetSkipped], source, {});
  }

  LogLiveChatWidgetLoaded(source: string): void {
    this._log(BotEventType[BotEventType.LiveChatWidgetLoaded], source, {});
  }
}
