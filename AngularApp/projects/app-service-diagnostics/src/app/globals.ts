import { Injectable, isDevMode } from '@angular/core';
import { Message } from './supportbot/models/message';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { BreadcrumbNavigationItem } from 'diagnostic-data';

@Injectable({ providedIn: 'root' })
export class Globals {
  messages: Message[] = [];
  messagesData: { [id: string]: any } = {};
  set openGeniePanel(value: boolean) {
    this._openGeniePanel = value;
  }
  get openGeniePanel() {
    return this._openGeniePanel;
  }
  private _openGeniePanel: boolean = false;
  openFeedback: boolean = false;
  openTimePicker: boolean = false;
  openSessionPanel: boolean = false;
  openCreateStorageAccountPanel: boolean = false;
  openCallStackPanel: boolean = false;
  openRiskAlertsPanel: boolean = false;
  callStackDetails = { managedException: '', callStack: '' };
  showCommAlertSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  breadCrumb: BreadcrumbNavigationItem = null;

  constructor(private activatedRoute: ActivatedRoute) {}

  //get detector or category(for categoryoverview) name for feedback
  getDetectorName(): string {
    const childRoute =
      this.activatedRoute.firstChild.firstChild.firstChild.firstChild;
    let detectorName = '';

    if (
      childRoute.firstChild &&
      childRoute.firstChild.snapshot.params['detectorName']
    ) {
      detectorName = childRoute.firstChild.snapshot.params['detectorName'];
    } else if (childRoute.snapshot.params['category']) {
      detectorName = childRoute.snapshot.params['category'];
    }
    return detectorName;
  }

  get logDebugMessage(): (message?: any, ...optionalParams: any[]) => void {
    if (isDevMode()) {
      return console.log.bind(console);
    } else {
      return () => {};
    }
  }
}
