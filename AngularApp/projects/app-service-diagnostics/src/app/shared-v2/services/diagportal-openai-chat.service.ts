import {map, catchError } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { BackendCtrlService } from '../../shared/services/backend-ctrl.service';
import {  ChatCompletionModel, ChatResponse, TelemetryService } from "diagnostic-data";
import { ResourceService } from './resource.service';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../startup/services/auth.service';
import * as signalR from "@microsoft/signalr";

@Injectable()
export class DiagPortalOpenAIChatService {

  content: any[] = [];

  public onMessageReceive: BehaviorSubject<ChatResponse> = null;
  public isEnabled: boolean = false;

  private signalRChatEndpoint: string = "/chatcompletionHub";
  private productName: string;
  private resourceId: string;
  private resourceProvider: string;
  private signalRConnection: any;
  private signalRLogLevel: any;
  private messageBuilder: string;
  private azureServiceNameLowercase: string;

  constructor(private _backendApi: BackendCtrlService, private _resourceService: ResourceService, private telemetryService: TelemetryService, private _authService: AuthService) {
    this.productName = this._resourceService.searchSuffix;
    this.onMessageReceive = new BehaviorSubject<ChatResponse>(null);
    this.signalRLogLevel = signalR.LogLevel.Information;
    this._authService.getStartupInfo()
    .subscribe(info => {
      if (info) {
        this.resourceId = info.resourceId;
        let resourceProviderSubstr = this.resourceId.split("/providers/")[1];
        this.resourceProvider = `${resourceProviderSubstr.split("/")[0]}/${resourceProviderSubstr.split("/")[1]}`;
      }
    });
    this.azureServiceNameLowercase = this._resourceService.azureServiceName.toLowerCase().replace(/ /g,'');

    if (!environment.production) {
      this.signalRChatEndpoint = "http://localhost:62302/chatcompletionHub";
      this.signalRLogLevel = signalR.LogLevel.Debug;
    }
  }

  public CheckEnabled(): Observable<boolean> {
    return this._backendApi.get<boolean>(`api/copilot/docscopilot/enabled?resourceProvider=${encodeURIComponent(this.resourceProvider)}`).pipe(map((value: boolean) => { this.isEnabled = value; return value; }), catchError((err) => of(false)));
  }

  public sendChatMessage(queryModel: ChatCompletionModel, customPrompt: string = ''): Observable<{ sent: boolean, failureReason: string }> {

    if (customPrompt && customPrompt.length > 0) {
      queryModel.messages.unshift({
        "role": "user",
        "content": customPrompt
      });
    }

    queryModel.metadata["azureServiceName"] = this.azureServiceNameLowercase;//this.productName;

    return from(this.signalRConnection.send("sendMessage", JSON.stringify(queryModel))).pipe(
      map(() => ({ sent: true, failureReason: '' })),
      catchError((error) => {
        return [{ sent: false, failureReason: error.toString() }];
      })
    );
  }

  public cancelChatMessage(messageId: string) {

    this.signalRConnection.send("CancelMessage", messageId)
      .catchError((error) => {
        this.log('CancelChatMessage', `Cancel Failed. Error : ${error.toString()}`);
      })
  }

  public establishSignalRConnection(): Observable<boolean> {

    return new Observable<boolean>((observer) => {

      // Check if signalRConnection is already defined and connected  
      if (!this.signalRConnection || this.signalRConnection.state !== signalR.HubConnectionState.Connected) {

        this.signalRConnection = new signalR.HubConnectionBuilder()
          .withUrl(this.signalRChatEndpoint, {  
            accessTokenFactory: () => {  
              return this._authService.getAuthToken();
            }})
          .configureLogging(this.signalRLogLevel)
          .withAutomaticReconnect()
          .build();

        var self = this;
        this.signalRConnection.start().then(() => {
          self.log('SignalRConnection', 'connected successfully');
          observer.next(true);
          observer.complete();
        }).catch(function (err: any) {
          self.log('SignalRConnection', `connection failed : ${err.toString()}`);
          observer.next(false);
          observer.complete();
          return;
        });

        this.addSignalREventListeners();
      } else {
        self.log('SignalRConnection', 'connection already established');
        observer.next(true);
        observer.complete();
      }
    });
  }

  private addSignalREventListeners() {

    this.messageBuilder = '';
    this.signalRConnection.on("MessageReceived", (message: any) => {

      if (message != null && message != undefined) {
        var messageJson = JSON.parse(message);
        this.messageBuilder = `${this.messageBuilder}${messageJson.Content != undefined ? messageJson.Content : ''}`;

        if (this.messageBuilder.length > 10 || (messageJson.FinishReason != undefined && messageJson.FinishReason != '')) {

          let chatResponse: ChatResponse = {
            text: this.messageBuilder,
            truncated: null,
            finishReason: messageJson.FinishReason,
            exception: ''
          };

          this.onMessageReceive.next(chatResponse);
          this.messageBuilder = '';

          // Message is completed. Reset the observable
          if (messageJson.FinishReason != '') {
            this.resetOnMessageReceiveObservable();
          }
        }
      }
    }, function (err) {
      this.log('MessageReceived', `Error : ${err.toString()}`);
      this.resetOnMessageReceiveObservable();
      this.messageBuilder = '';

    });

    this.signalRConnection.on("MessageCancelled", (reason: any) => {

      let chatResponse: ChatResponse = {
        text: '',
        truncated: null,
        finishReason: 'cancelled',
        exception: reason
      };

      this.onMessageReceive.next(chatResponse);
      
      this.messageBuilder = '';
      this.resetOnMessageReceiveObservable();
    });
  }

  private resetOnMessageReceiveObservable() {

    // adding an artifical delay before reset to wait for any messages in flight
    setTimeout(() => {
      this.onMessageReceive = new BehaviorSubject<ChatResponse>(null);
    }, 500);
  }

  private log = (event: string, message: string) => {

    let eventStr = `DiagPortalOpenAIChatService-${event}`;
    let time = new Date().getTime().toString();
    if (environment.production) {
      this.telemetryService.logEvent(eventStr, { message: message, ts: time });
    }
    else {
      console.log(`event: ${eventStr}, message: ${message}, ts: ${time}`);
    }
  }
}
