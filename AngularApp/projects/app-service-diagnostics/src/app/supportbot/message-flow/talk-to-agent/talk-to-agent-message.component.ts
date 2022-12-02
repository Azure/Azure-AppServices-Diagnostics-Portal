import {
  Component,
  Injector,
  OnInit,
  AfterViewInit,
  Output,
  EventEmitter
} from '@angular/core';
import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';

@Component({
  templateUrl: 'talk-to-agent-message.component.html'
})
export class TalkToAgentMessageComponent
  implements OnInit, AfterViewInit, IChatMessageComponent
{
  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean; data?: any }>();

  showLoadingMessage: boolean;

  constructor() {
    this.showLoadingMessage = true;
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.onViewUpdate.emit();

    setTimeout(() => {
      this.showLoadingMessage = false;
      setTimeout(() => {
        this.onComplete.emit({ status: true });
      }, 3000);
    }, 2000);
  }
}
