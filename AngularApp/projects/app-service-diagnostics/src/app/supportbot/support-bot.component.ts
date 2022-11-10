import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { Message } from './models/message';
import { MessageProcessor } from './message-processor.service';

@Component({
    selector: 'support-bot',
    templateUrl: 'support-bot.component.html',
    providers: [MessageProcessor]
})
export class SupportBotComponent implements OnInit {
    @ViewChild('scrollMe') myScrollContainer: ElementRef;

    messages: Message[];
    showTypingMessage: boolean;
    chatContainerHeight: number;

    public _startingKey: string;
    @Input() set startingKey(startingKey: string) {
        if (!!startingKey && startingKey.length > 0) {
            this._startingKey = startingKey;
            this.Initialize();
        }
    }

    constructor(private _messageProcessor: MessageProcessor) {
        this.messages = [];
        this.showTypingMessage = false;
        this.chatContainerHeight = 0;
    }

    Initialize(): void {
        this.messages = [];
        if (!!this._startingKey) {
            this._messageProcessor.setCurrentKey(this._startingKey);
        }

        this.chatContainerHeight = window.innerHeight - 60;

        this.getMessage();
    }

    ngOnInit(): void {
    }

    scrollToBottom(event?: any): void {

        try {
            this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
        } catch (err) { }
    }

    getMessage(event?: any): void {
        const self = this;
        const message = this._messageProcessor.getNextMessage(event);

        if (message) {

            if (message.messageDelayInMs >= 2000) {
                this.showTypingMessage = true;

                // To show the typing message icon, we need to scroll the page to the bottom.
                setTimeout(() => {
                    this.scrollToBottom();
                }, 200);
            }

            setTimeout(function () {
                self.showTypingMessage = false;
                self.messages.push(message);
            }, message.messageDelayInMs);
        }
    }
}
