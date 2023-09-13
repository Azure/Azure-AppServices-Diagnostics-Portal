import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { DiagChatRequestBody, DiagChatResponse, QueryResponseStatus } from '../models/openai-data-models';
import * as signalR from "@microsoft/signalr";
import { TelemetryService } from './telemetry/telemetry.service';
import { catchError, map } from 'rxjs/operators';

export abstract class ConversationalDiagService {
  public onMessageReceive: BehaviorSubject<DiagChatResponse> = null;
  protected abstract signalRChatEndpoint: string;
  private resourceProvider: string;
  private productName: string;
  private signalRConnection: signalR.HubConnection;
  private signalRLogLevel: any;
  private messageBuilder: string;

  constructor(protected telemetryService: TelemetryService) {
    this.onMessageReceive = new BehaviorSubject<DiagChatResponse>(null);
    this.signalRLogLevel = signalR.LogLevel.Debug;
  }

  public sendChatMessage(queryModel: DiagChatRequestBody): Observable<{ sent: boolean, failureReason: string }> {

    return from(this.signalRConnection.send("sendMessage", JSON.stringify(queryModel))).pipe(
      map(() => ({ sent: true, failureReason: '' })),
      catchError((error) => {
        return [{ sent: false, failureReason: error.toString() }];
      })
    );
  }

  public cancelChatMessage(messageId: string) {

    this.signalRConnection.send("CancelMessage", messageId)
      .catch((error) => {
        this.log('CancelChatMessage', `Cancel Failed. Error : ${error.toString()}`);
      })
  }

  public establishSignalRConnection(): Observable<boolean> {

    return new Observable<boolean>((observer) => {

      // Check if signalRConnection is already defined and connected  
      if (!this.signalRConnection || this.signalRConnection.state !== signalR.HubConnectionState.Connected) {

        this.signalRConnection = new signalR.HubConnectionBuilder()
          .withUrl(this.signalRChatEndpoint)
          .configureLogging(this.signalRLogLevel)
          .withAutomaticReconnect()
          .build();

        var self = this;
        this.signalRConnection.start().then(() => {
          self.log('SignalRConnection', 'connected successfully');
          self.addSignalREventListeners();
          observer.next(true);
          observer.complete();
        }).catch(function (err: any) {
          self.log('SignalRConnection', `connection failed : ${err.toString()}`);
          observer.next(false);
          observer.complete();
          return;
        });
      } else {
        self.log('SignalRConnection', 'connection already established');
        observer.next(true);
        observer.complete();
      }
    });
  }

  private addSignalREventListeners() {

    this.signalRConnection.on("MessageReceived", (messageResponse: any) => {
      if (messageResponse && messageResponse != null && messageResponse != undefined) {
        var messageResponseJson = JSON.parse(messageResponse);
        if (messageResponseJson && messageResponseJson.message && messageResponseJson.sessionId) {

          let chatResponse: DiagChatResponse = {
            message: messageResponseJson.message,
            sessionId: messageResponseJson.sessionId,
            responseStatus: messageResponseJson.responseStatus,
            error: messageResponseJson.error
          };

          this.onMessageReceive.next(chatResponse);

          if (messageResponseJson.responseStatus == QueryResponseStatus.Finished) {
            this.resetOnMessageReceiveObservable();
          }
        }
      }
    },
      // function (err) {
      //   this.log('MessageReceived', `Error : ${err.toString()}`);
      //   this.resetOnMessageReceiveObservable();
      // }
    );

    this.signalRConnection.on("MessageCancelled", (reason: any) => {

      let chatResponse: DiagChatResponse = {
        error: reason,
        sessionId: null,
        message: null,
        responseStatus: QueryResponseStatus.Finished
      };

      this.onMessageReceive.next(chatResponse);
      this.resetOnMessageReceiveObservable();
    });
  }

  private resetOnMessageReceiveObservable() {

    // adding an artifical delay before reset to wait for any messages in flight
    setTimeout(() => {
      this.onMessageReceive = new BehaviorSubject<DiagChatResponse>(null);
    }, 500);
  }

  private log = (event: string, message: string) => {

    let eventStr = `ConversationDiagnosticsService-${event}`;
    let time = new Date().getTime().toString();
    //if (process.env.production) {
    //  this.telemetryService.logEvent(eventStr, { message: message, ts: time });
    //}
    //else {
    console.log(`event: ${eventStr}, message: ${message}, ts: ${time}`);
    //}
  }
}
