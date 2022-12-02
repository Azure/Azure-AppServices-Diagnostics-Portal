import {
  Component,
  Injector,
  Input,
  Output,
  AfterViewInit,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { IChatMessageComponent } from '../../interfaces/ichatmessagecomponent';

@Component({
  selector: 'loading-message',
  templateUrl: 'loading-message.component.html'
})
export class LoadingMessageComponent
  implements AfterViewInit, IChatMessageComponent
{
  @Output() onViewUpdate = new EventEmitter();
  @Output() onComplete = new EventEmitter<{ status: boolean; data?: any }>();

  constructor(private injector: Injector) {}

  ngAfterViewInit(): void {
    this.onViewUpdate.emit();
    this.onComplete.emit({
      status: true
    });
  }
}
