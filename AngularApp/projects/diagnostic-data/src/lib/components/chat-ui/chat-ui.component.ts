import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { KeyValuePair } from '../../models/common-models';
import { ChatMessage, ChatAlignment, UserFeedbackType, MessageSource, MessageStatus, MessageRenderingType } from '../../models/chatbot-models';
import {TelemetryService} from '../../services/telemetry/telemetry.service';
import { v4 as uuid } from 'uuid';
import { TimeUtilities } from '../../utilities/time-utilities';

@Component({
    selector: 'chat-ui',
    templateUrl: './chat-ui.component.html',
    styleUrls: ['./chat-ui.component.scss']
})

export class ChatUIComponent implements OnInit {
    @Input() chatIdentifier: string = '';
    @Input() chatHeader: string = '';
    @Input() messages: string = '';
    @Input() chatInputText: string = '';
    @Input() onSendMessage: Function = (message: ChatMessage) => {};
    @Input() chatAlignment: ChatAlignment = ChatAlignment.Center;
    @Input() showFeedbackOptions: boolean = false;
    @Input() onFeedbackClick: Function = (messageId: string, feedbackType: UserFeedbackType) => {};

    @Input() userNameInitial: string = '';
    @Input() userPhotoSource: string = '';
    
    @Input() systemNameInitial: string = '';
    @Input() systemPhotoSource: string = '';
    
    @Input() chatInputBoxDisabled: boolean = false;
    
    @Input() topErrorBarMessage: string = '';
    @Input() showTopErrorBar: boolean = false;
    
    @Input() chatQuerySamples: KeyValuePair[] = [];

    @Input() showContentDisclaimer: boolean = false;
    @Input() contentDisclaimerMessage: string = '';

    @Input() showValidationWarning: boolean = false;
    @Input() validationWarningMessage: string = '';

    @Input() showValidationError: boolean = false;
    @Input() validationErrorMessage: string = '';

    chatInputTextInternal: string = '';

    public focusChatInput = () => {
        setTimeout(() => {
            document.getElementById("chatUIInputBox").focus();
        }, 100);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.chatInputText && !this.chatInputText || this.chatInputText.length==0) {
            this.chatInputTextInternal = this.chatInputText;
        }
    }
    
    constructor(private _telemetryService: TelemetryService) {

    }

    public scrollToBottom(initial = false) {
        this.scrollToBottomOfChatContainer(initial? 2000: 200);
    }

    public scrollToBottomOfChatContainer(timeout=200){
        setTimeout(() => {
            var element = document.getElementById("chatui-all-messages-container-id");
            if (element) {
                element.scrollTop = element.scrollHeight;
            }
        }, timeout);
    }

    triggerChat() {
        this.chatInputTextInternal = this.chatInputTextInternal.trimEnd();
        this.chatInputBoxDisabled = true;
        let message = {
            id: uuid(),
            message: this.chatInputTextInternal,
            messageSource: MessageSource.User,
            timestamp: new Date().getTime(),
            messageDisplayDate: TimeUtilities.displayMessageDate(new Date()),
            status: MessageStatus.Finished,
            userFeedback: UserFeedbackType.None,
            renderingType: MessageRenderingType.Text
        };

        this.onSendMessage(message);
    }

    feedbackClicked(message: ChatMessage, feedbackType: UserFeedbackType) {
        message.userFeedback = feedbackType;
        if (this.onFeedbackClick) {
            this.onFeedbackClick(message.id, feedbackType);
        }
        //Default handling if no callback is provided
        else{
            if (feedbackType == 'like') {
                this._telemetryService.logEvent(`ChatResponseUserFeedbackLike--${this.chatIdentifier}`, { messageId: message.id, messageText: message.message, ts: new Date().getTime().toString()});
            }
            else {
                this._telemetryService.logEvent(`ChatResponseUserFeedbackDislike--${this.chatIdentifier}`, { messageId: message.id, messageText: message.message, ts: new Date().getTime().toString()});
            }
        }
    }

    onchatSampleClick(idx: number){
        this._telemetryService.logEvent(`SampleChatQueryClicked--${this.chatIdentifier}`, { idx: idx.toString(), clickedSample: this.chatQuerySamples[idx].key, ts: new Date().getTime().toString() });
        this.chatInputTextInternal = this.chatQuerySamples[idx].value;
        this.triggerChat();
    }

    ngOnInit() {
        if (this.chatInputText && this.chatInputText.length>0)
        this.chatInputTextInternal = this.chatInputText;
    }
}  
