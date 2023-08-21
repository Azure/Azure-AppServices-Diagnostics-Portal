import { catchError, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { TextCompletionModel, ChatCompletionModel, OpenAIAPIResponse, ChatResponse, TelemetryService } from "diagnostic-data";
import { DiagnosticApiService } from './diagnostic-api.service';
import { HttpHeaders } from "@angular/common/http";
import { ResourceService } from './resource.service';
import { environment } from '../../../environments/environment';
import * as signalR from "@microsoft/signalr";
import { error } from 'console';
import { AdalService } from 'adal-angular4';

@Injectable()
export class ApplensOpenAIChatService {

  content: any[] = [];

  public onMessageReceive: BehaviorSubject<ChatResponse> = null;
  public isEnabled: boolean = false;

  private textCompletionApiPath: string = "api/openai/runTextCompletion";
  private chatCompletionApiPath: string = "api/openai/runChatCompletion";
  private signalRChatEndpoint: string = "/chatcompletionHub";
  private resourceProvider: string;
  private productName: string;
  private signalRConnection: any;
  private signalRLogLevel: any;
  private messageBuilder: string;

  constructor(private _adalService: AdalService, private _backendApi: DiagnosticApiService, private _resourceService: ResourceService, private telemetryService: TelemetryService) {
    this.resourceProvider = `${this._resourceService.ArmResource.provider}/${this._resourceService.ArmResource.resourceTypeName}`.toLowerCase();
    this.productName = this._resourceService.searchSuffix + ((this.resourceProvider === 'microsoft.web/sites') ? ` ${this._resourceService.displayName}` : '');
    this.onMessageReceive = new BehaviorSubject<ChatResponse>(null);
    this.signalRLogLevel = signalR.LogLevel.Information;

    if (!environment.production) {
      this.signalRChatEndpoint = "http://localhost:5000/chatcompletionHub";
      this.signalRLogLevel = signalR.LogLevel.Debug;
    }
  }

  public CheckEnabled(): Observable<boolean> {
    return this._backendApi.get<boolean>(`api/openai/enabled`).pipe(map((value: boolean) => { this.isEnabled = value; return value; }), catchError((err) => of(false)));
  }

  public generateTextCompletion(queryModel: TextCompletionModel, customPrompt: string = '', caching: boolean = true): Observable<ChatResponse> {
    if (customPrompt && customPrompt.length > 0) {
      queryModel.prompt = `${customPrompt}\n${queryModel.prompt}`;
    }
    else {
      queryModel.prompt = `You are helping eningeers to debug issues related to ${this.productName}. Do not be repetitive when providing steps in your answer. Please answer the below question\n${queryModel.prompt}`;
    }

    return this._backendApi.post(this.textCompletionApiPath, { payload: queryModel }, new HttpHeaders({ "x-ms-openai-cache": caching.toString() })).pipe(map((res: ChatResponse) => {return res;}));
  }

  public getChatCompletion(queryModel: ChatCompletionModel, customPrompt: string = ''): Observable<ChatResponse> {

    if (customPrompt && customPrompt.length > 0) {
      queryModel.messages.unshift({
        "role": "user",
        "content": customPrompt
      });
    }

    queryModel.metadata["azureServiceName"] = this.productName;

    return this._backendApi.post(this.chatCompletionApiPath, queryModel, null, true, true).pipe(map((res: ChatResponse) => {return res;}));
  }

  public sendChatMessage(queryModel: ChatCompletionModel, customPrompt: string = ''): Observable<{ sent: boolean, failureReason: string }> {

    if (customPrompt && customPrompt.length > 0) {
      queryModel.messages.unshift({
        "role": "user",
        "content": customPrompt
      });
    }

    queryModel.metadata["azureServiceName"] = this.productName;

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
              return this._adalService.userInfo.token;
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

    let eventStr = `ApplensOpenAIService-${event}`;
    let time = new Date().getTime().toString();
    if (environment.production) {
      this.telemetryService.logEvent(eventStr, { message: message, ts: time });
    }
    else {
      console.log(`event: ${eventStr}, message: ${message}, ts: ${time}`);
    }
  }
}