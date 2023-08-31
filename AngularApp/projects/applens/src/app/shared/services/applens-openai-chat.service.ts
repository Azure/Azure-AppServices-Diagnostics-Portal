import { catchError, map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { TextCompletionModel, ChatCompletionModel, ChatResponse, TelemetryService,KeyValuePair, ChatMessage, ChatModel, MessageStatus, TextModels, StringUtilities, TimeUtilities, CreateTextCompletionModel, CreateChatCompletionModel } from "diagnostic-data";
import { DiagnosticApiService } from './diagnostic-api.service';
import { HttpHeaders } from "@angular/common/http";
import { ResourceService } from './resource.service';
import { environment } from '../../../environments/environment';
import * as signalR from "@microsoft/signalr";
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
  private providerName:string;
  private resourceTypeName: string;
  private productName: string;
  private signalRConnection: any;
  private signalRLogLevel: any;
  private messageBuilder: string;
  private resourceSpecificInfo: KeyValuePair[] = [];
  private resource:any;

  private addOrUpdateResourceSpecificInfo(key:string, value:string) {
    if(key) {
      let existing =  this.resourceSpecificInfo.find(kvp => kvp.key === key);
      if(existing) {
        existing.value = value;
      }
      else {
        this.resourceSpecificInfo.push(<KeyValuePair>{
          key: key,
          value: value
        });
      }
    }
  }

  constructor(private _adalService: AdalService, private _backendApi: DiagnosticApiService, private _resourceService: ResourceService, private telemetryService: TelemetryService) {
    this.resourceProvider = `${this._resourceService.ArmResource.provider}/${this._resourceService.ArmResource.resourceTypeName}`.toLowerCase();
    this.providerName = `${this._resourceService.ArmResource.provider}`.toLowerCase();
    this.resourceTypeName = `${this._resourceService.ArmResource.resourceTypeName}`.toLowerCase();
    this.onMessageReceive = new BehaviorSubject<ChatResponse>(null);
    this.signalRLogLevel = signalR.LogLevel.Information;

    if (!environment.production) {
      this.signalRChatEndpoint = "http://localhost:5000/chatcompletionHub";
      this.signalRLogLevel = signalR.LogLevel.Debug;
    }
    this.addOrUpdateResourceSpecificInfo('provider', this.providerName);
    this.addOrUpdateResourceSpecificInfo('resourceTypeName', this.resourceTypeName );

    let resourceReady: Observable<any>;
    resourceReady = (this._resourceService.ArmResource?.resourceGroup && this._resourceService.ArmResource?.resourceName) ? this._resourceService.getCurrentResource() : of(null);    
    resourceReady.subscribe(resource => {
      if (resource) {
        this.resource = resource;
        let valuesToAdd = ['IsLinux', 'Kind', 'IsXenon'];
        valuesToAdd.forEach(key => {
          if(this.resource[key]) {
            this.addOrUpdateResourceSpecificInfo(key, this.resource[key]);
          }
        });
      }
    });
  }

  public CheckEnabled(): Observable<boolean> {
    return this._backendApi.get<boolean>(`api/openai/enabled`).pipe(map((value: boolean) => { this.isEnabled = value; return value; }), catchError((err) => of(false)));
  }

  public generateTextCompletion(queryModel: TextCompletionModel, customPrompt: string = '', caching: boolean = true, insertCustomPromptAtEnd:boolean = false): Observable<ChatResponse> {
    if (customPrompt && customPrompt.length > 0) {
      queryModel.prompt = insertCustomPromptAtEnd? `${queryModel.prompt}\n${customPrompt}` : `${customPrompt}\n${queryModel.prompt}`;
    }
    else {
      queryModel.prompt = `You are helping eningeers to debug issues related to ${this.productName}. Do not be repetitive when providing steps in your answer. Please answer the below question\n${queryModel.prompt}`;
    }

    return this._backendApi.post(this.textCompletionApiPath, { payload: queryModel }, new HttpHeaders({ "x-ms-openai-cache": caching.toString() })).pipe(map((res: ChatResponse) => {return res;}));
  }

  private ConvertKeyValuePairArrayToObj(keyValuePairArray: KeyValuePair[]): Record<string, string> {
    let result: Record<string, string> = {};
    keyValuePairArray.forEach((keyValuePair: KeyValuePair) => {
      result[keyValuePair.key] = keyValuePair.value;
    });
    return result;
  }

  public getChatCompletion(queryModel: ChatCompletionModel, customPrompt: string = '', autoAddResourceSpecificInfo:boolean = true): Observable<ChatResponse> {

    if (customPrompt && customPrompt.length > 0) {
      queryModel.messages.unshift({
        "role": "user",
        "content": customPrompt
      });
    }

    queryModel.metadata["azureServiceName"] = this.productName;
    queryModel.metadata["armResourceId"] = this._resourceService.getCurrentResourceId();
    
    if(autoAddResourceSpecificInfo) {
      queryModel.metadata["resourceSpecificInfo"] = this.ConvertKeyValuePairArrayToObj(this.resourceSpecificInfo);
    }

    return this._backendApi.post(this.chatCompletionApiPath, queryModel, null, true, true).pipe(map((res: ChatResponse) => {return res;}));
  }

  public sendChatMessage(queryModel: ChatCompletionModel, customPrompt: string = '', autoAddResourceSpecificInfo:boolean = true): Observable<{ sent: boolean, failureReason: string }> {

    if (customPrompt && customPrompt.length > 0) {
      queryModel.metadata['customPrompt'] = customPrompt;
    }

    queryModel.metadata["azureServiceName"] = this.productName;
    queryModel.metadata["armResourceId"] = this._resourceService.getCurrentResourceId();
    
    if(autoAddResourceSpecificInfo) {
      queryModel.metadata["resourceSpecificInfo"] = this.ConvertKeyValuePairArrayToObj(this.resourceSpecificInfo);
    }

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
            text: messageJson.FinishReason && messageJson.Content ? '' : this.messageBuilder,
            truncated: null,
            finishReason: messageJson.FinishReason,
            exception: '',
            feedbackIds: messageJson.FinishReason && messageJson.Content? JSON.parse(messageJson.Content) : []
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
        exception: reason,
        feedbackIds: []
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

  public fetchOpenAIResultAsChatMessageUsingRest(chatHistory: any, messageObj: ChatMessage, retry: boolean = true, trimnewline: boolean = false, chatModel:ChatModel, 
    customInitialPrompt:string, chatIdentifier:string, responseTokenSize:number, currentApiCallCount:number, openAIApiCallLimit:number, insertCustomPromptAtEnd:boolean = false): Observable<ChatMessage> {
      if (currentApiCallCount >= openAIApiCallLimit) {
        currentApiCallCount = 0;
        throw new Error("Error: OpenAI API call limit reached.");
      }
    
      currentApiCallCount++;
    
      if (messageObj.status == MessageStatus.Cancelled) {
        currentApiCallCount = 0;
        return of(messageObj);
      }
    
      let openAIAPICall: Observable<ChatResponse> = new Observable();
      currentApiCallCount = 0;
    
      messageObj.status = messageObj.status == MessageStatus.Created ? MessageStatus.Waiting : messageObj.status;
    
      if (chatModel == ChatModel.GPT3) {
        let openAIQueryModel = CreateTextCompletionModel(chatHistory, TextModels.Default, responseTokenSize);
        openAIAPICall = this.generateTextCompletion(openAIQueryModel, customInitialPrompt, true, insertCustomPromptAtEnd);
      } else {
        let chatCompletionQueryModel = CreateChatCompletionModel(chatHistory, messageObj.id, chatIdentifier, chatModel, responseTokenSize);
        openAIAPICall = this.getChatCompletion(chatCompletionQueryModel, customInitialPrompt);
      }
    
      return new Observable<ChatMessage>((observer) => {
        const subscription = openAIAPICall.subscribe( (response: ChatResponse) => {
            if (messageObj.status == MessageStatus.Cancelled) {
              currentApiCallCount = 0;
              observer.next(messageObj);
              observer.complete();
              return;
            }
    
            let trimmedText = chatModel == ChatModel.GPT3 ? (trimnewline ? StringUtilities.TrimBoth(response.text) : StringUtilities.TrimEnd(response.text)) : response.text;
    
            messageObj.message = StringUtilities.mergeOverlappingStrings(messageObj.message, trimmedText);
            messageObj.status = response.truncated === true ? MessageStatus.InProgress : MessageStatus.Finished;
            messageObj.displayMessage = StringUtilities.mergeOverlappingStrings(messageObj.displayMessage, trimmedText);
  
    
            if (response.truncated) {
              // Do not trim newline for the next query
              this.fetchOpenAIResultAsChatMessageUsingRest(chatHistory, messageObj, retry, false, chatModel, customInitialPrompt, chatIdentifier, responseTokenSize, currentApiCallCount, openAIApiCallLimit, insertCustomPromptAtEnd).subscribe( (result: ChatMessage) => {
                  observer.next(result);
                  observer.complete();
                },
                (error: any) => {
                  observer.error(error);
                }
              );
            } else {
              messageObj.status =  MessageStatus.Finished;
              messageObj.timestamp = new Date().getTime();
              messageObj.messageDisplayDate = TimeUtilities.displayMessageDate(new Date());
              currentApiCallCount = 0;
              messageObj.displayMessage = messageObj.displayMessage.replace('System: ', '');
              messageObj.displayMessage = messageObj.displayMessage.replace('Assistant: ', '');
    
              observer.next(messageObj);
              observer.complete();
            }
          },
          (error: any) => {
            if (retry) {
              this.fetchOpenAIResultAsChatMessageUsingRest(chatHistory, messageObj, false, trimnewline, chatModel, customInitialPrompt, chatIdentifier, responseTokenSize, currentApiCallCount, openAIApiCallLimit, insertCustomPromptAtEnd).subscribe(
                (result: ChatMessage) => {
                  currentApiCallCount = 0;
                  observer.next(result);
                  observer.complete();
                },
                (error: any) => {
                  observer.error(error);
                }
              );
            } else {
              observer.error(error);
            }
          }
        );
    
        return () => {
          subscription.unsubscribe();
        };
      });
  }
}