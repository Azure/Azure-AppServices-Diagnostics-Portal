import { KeyValuePair } from 'projects/diagnostic-data/src/lib/models/common-models';
import {v4 as uuid} from 'uuid';

export enum FeedbackExplanationModes {
    None = 'None',
    Explanation = 'Explanation',
    ComparativeReasoning = 'ComparativeReasoning'
}

export interface ChatFeedbackPanelOpenParams {
  isOpen: boolean,
  chatMessageId: string,
}

export interface ChatFeedbackAdditionalField {
    id:string, 
    labelText:string, 
    defaultValue:string,
    value:string,
    isMultiline:boolean
  }

  export interface ChatFeedbackValidationStatus {
    succeeded:boolean,
    validationStatusResponse:string
  }

  export class ChatFeedbackPostBody {
    id:string;
    timestamp:Date;
    provider:string;
    resourceType:string;
    chatIdentifier: string;
    submittedBy:string;
    userQuestion:string;
    incorrectSystemResponse: string;
    expectedResponse: string;
    feedbackExplanation:string;
    additionalFields:  { [key: string]: string };
    resourceSpecificInfo:{ [key: string]: string };
    linkedFeedbackIds:string[];

    public constructor(chatFeedbackModel: ChatFeedbackModel) {
      this.id = chatFeedbackModel.id;
      this.timestamp = chatFeedbackModel.timestamp;
      this.provider = chatFeedbackModel.provider;
      this.resourceType = chatFeedbackModel.resourceType;
      this.chatIdentifier = chatFeedbackModel.chatIdentifier;
      this.submittedBy = chatFeedbackModel.submittedBy;
      this.userQuestion = chatFeedbackModel.userQuestion;
      this.incorrectSystemResponse = chatFeedbackModel.incorrectSystemResponse;
      this.expectedResponse = chatFeedbackModel.expectedResponse;
      this.feedbackExplanation = chatFeedbackModel.feedbackExplanation;

      this.additionalFields = {};
      chatFeedbackModel.additionalFields.forEach((additionalField:ChatFeedbackAdditionalField) => {
          this.additionalFields[additionalField.id] = !additionalField.value && additionalField.defaultValue ? additionalField.defaultValue : additionalField.value;
      });

      this.resourceSpecificInfo = {};
      chatFeedbackModel.resourceSpecificInfo.forEach((resourceSpecificInfo:KeyValuePair) => {
        this.resourceSpecificInfo[resourceSpecificInfo.key] = resourceSpecificInfo.value;
      });

      this.linkedFeedbackIds = chatFeedbackModel.linkedFeedbackIds;

    }
  }
  
  export class ChatFeedbackModel {
    private _id: string;
    public get id() : string { return this._id;}

    private _timestamp:Date;
    public get timestamp() : Date { return this._timestamp;}

    provider:string;
    resourceType:string;
    chatIdentifier: string;
    userQuestion: string;
    incorrectSystemResponse: string;
    expectedResponse: string;
    additionalFields: ChatFeedbackAdditionalField[];
    submittedBy:string;
    feedbackExplanation:string;
    validationStatus:ChatFeedbackValidationStatus;
    resourceSpecificInfo:KeyValuePair[];
    linkedFeedbackIds:string[];

    public constructor(chatIdentidier:string, submittedBy:string, provider:string, resourceType:string) {
      this._id = uuid();
      this._timestamp = new Date();
      if(!chatIdentidier) {
        chatIdentidier = 'Default';
      }
      this.provider = provider;
      this.resourceType = resourceType;
      this.chatIdentifier = chatIdentidier;
      this.submittedBy = submittedBy;
      this.additionalFields = [];
      this.validationStatus = {
        succeeded: false,
        validationStatusResponse: 'Uninitialized'
      };
      this.resourceSpecificInfo = [];
      this.linkedFeedbackIds = [];      
    }

    public toChatFeedbackPostBody():ChatFeedbackPostBody {
      return new ChatFeedbackPostBody(this);
    }
  }