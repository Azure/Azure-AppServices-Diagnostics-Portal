import { Component, Injector, Input, Output, EventEmitter, OnInit, AfterViewInit, Optional } from '@angular/core';
import { GenieMessageProcessor } from '../../message-processor.service';
import { BotLoggingService } from '../../../shared/services/logging/bot.logging.service';
import { MessageSender, ButtonActionType } from '../../models/message-enums';
import { ButtonMessageComponent } from '../../common/button-message/button-message.component';
import { CategoryChatStateService } from '../../../shared-v2/services/category-chat-state.service';
import { Globals } from '../../../globals';
import { Subject, Observable } from 'rxjs';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';

@Component({
    templateUrl: 'genie-feedback.component.html',
    selector: 'genie-feedback',
    styleUrls: ['./genie-feedback.component.scss']
})
export class GenieFeedbackComponent extends ButtonMessageComponent {
    @Input() ratingEventProperties: any={};
    dimissObservable: Observable<void>;
    feedbackText: string = "";
    feedbackIcons: { id: string, text: string }[] =
    [
      {
        id: "Sad",
        text: "dissatisfied"
      },
      {
        id: "EmojiNeutral",
        text: "ok"
      },
      {
        id: "Emoji2",
        text: "satisfied"
      }
    ];
    rating: number = 0;
    ratingSelected: boolean = false;
    invalidRating: boolean = false;
    dismissSubject: Subject<void> = new Subject<void>();
    showComponent: boolean;
    feedbackMessage: string;
    constructor(protected telemetryService: TelemetryService, protected _injector: Injector, private _msgProcessor: GenieMessageProcessor, protected _logger: BotLoggingService, protected globals: Globals, @Optional() protected _chatState?: CategoryChatStateService) {
        super(_injector, _logger, globals, _chatState);
        this.showComponent = true;
        this.feedbackMessage = '';
    }

    ngOnInit(): void {
        super.ngOnInit();
        const submit = this._injector.get('submitButtonName', 'Submit');
        this.buttonList.push({
            title: submit,
            next_key: '',
            type: ButtonActionType.Continue
        });
        this.rating = 0;
        this.feedbackText = "";
        this.ratingSelected = false;
        this.invalidRating = false;
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.onViewUpdate.emit();
        }, (500));
    }

    onClick(item: any) {
        if (item.title === 'Submit') {
            this.onSubmit();
        }
        else {
            super.onClick(item);
        }
    }

    setRating(index: number) {
        this.rating = index + 1;
        this.ratingSelected = true;
    }

    isEmptyOrSpaces(str) {
        return str === null || str.match(/^ *$/) !== null;
    }

    protected logEvent(eventMessage: string, eventProperties?: any, measurements?: any) {
        for (const id of Object.keys(this.ratingEventProperties)) {
            if (this.ratingEventProperties.hasOwnProperty(id)) {
                eventProperties[id] = String(this.ratingEventProperties[id]);
            }
        }
        this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
    }

    onSubmit(): void {
        if (this.ratingSelected === true || !this.isEmptyOrSpaces(this.feedbackMessage))
        {
            this.showComponent = false;
            this._logger.LogGenieFeedbackMessage(this.context, String(this.rating), this.feedbackMessage, this.category);

            const eventProps = {
                Rating: String(this.rating),
                Feedback: this.feedbackText
            };
            this.logEvent(TelemetryEventNames.GenieSearchRatingSubmitted, eventProps);
            this.onComplete.emit({
                status: true,
                data: {
                    feedbackCancel: false,
                    feedbackMessage: this.feedbackMessage
                }
            });
            this.invalidRating = false;
        }
        else
        {
            this.invalidRating = true;
        }
    }
}
