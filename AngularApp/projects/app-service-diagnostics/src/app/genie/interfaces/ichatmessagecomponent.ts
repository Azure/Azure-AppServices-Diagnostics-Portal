import { EventEmitter, Output } from '@angular/core';
export interface IChatMessageComponent {
  onViewUpdate: EventEmitter<any>;
  onComplete: EventEmitter<{ status: boolean; data?: any }>;
}
