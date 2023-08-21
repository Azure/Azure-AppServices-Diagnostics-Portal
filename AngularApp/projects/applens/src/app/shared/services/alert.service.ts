import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, EventEmitter } from '@angular/core';
import { AlertInfo } from 'diagnostic-data';

@Injectable()
export class AlertService {

  private _alertEvent: EventEmitter<AlertInfo> = new EventEmitter();
  private _unauthorizedEvent: EventEmitter<HttpErrorResponse> = new EventEmitter();

  constructor() { }

  public getAlert(): EventEmitter<AlertInfo> {
    return this._alertEvent;
  }

  public getUnAuthorizedAlerts(): EventEmitter<HttpErrorResponse> {
    return this._unauthorizedEvent;
  }

  public sendAlert(alert: AlertInfo) {
    this._alertEvent.emit(alert);
  }

  public notifyUnAuthorized(error: HttpErrorResponse){
    this._unauthorizedEvent.emit(error);
  }
}