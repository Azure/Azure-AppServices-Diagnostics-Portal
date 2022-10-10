import { Component, Injector, OnInit, AfterViewInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';
import { MessageSender } from '../../models/message-enums';

@Component({
    templateUrl: 'text-message.component.html'
})
export class GenieTextMessageComponent implements OnInit, AfterViewInit, IChatMessageComponent {

    message: string = '';
    focus: boolean = false;
    messageByUser: boolean = false;
    @ViewChild('messagefocus') elem:ElementRef;

    @Output() onViewUpdate = new EventEmitter();
    @Output() onComplete = new EventEmitter<{ status: boolean, data?: any }>();

    constructor(private injector: Injector) {
    }

    ngOnInit(): void {
        this.message = this.injector.get('message');
        const sender = this.injector.get('sender');
        this.focus = this.injector.get('focus');
        if (sender === MessageSender.User) {
            this.messageByUser = true;
        }
    }

    ngAfterViewInit(): void {
        if(this.focus){
            this.elem.nativeElement.focus();
        }
        this.onViewUpdate.emit();

        this.onComplete.emit({
            status: true
        });
    }
}
