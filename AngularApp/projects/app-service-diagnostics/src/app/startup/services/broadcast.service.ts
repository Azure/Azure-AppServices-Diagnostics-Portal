import { Injectable, EventEmitter } from '@angular/core';
import { Subscription } from 'rxjs';
import { ErrorEvent } from '../../shared/models/error-event';
import { BroadcastEvent } from '../models/broadcast-event';

@Injectable()
export class BroadcastService {
  private integrateChnagedEvent: EventEmitter<void>;
  private errorEvent: EventEmitter<ErrorEvent>;
  private dirtyStateMap: { [key: string]: number } = {};
  private defaultDirtyReason = 'global';

  constructor() {
    this.integrateChnagedEvent = new EventEmitter<void>();
    this.errorEvent = new EventEmitter<ErrorEvent>();
  }

  broadcast<T>(eventType: BroadcastEvent, obj?: T) {
    const emitter = <EventEmitter<T>>this.getEventEmitter(eventType);
    emitter.emit(obj);
  }

  subscribe<T>(
    eventType: BroadcastEvent,
    callback: (obj?: T) => void,
    errorCallback?: (obj: any) => void,
    completedCallback?: (obj: any) => void
  ): Subscription {
    const emitter = <EventEmitter<T>>this.getEventEmitter(eventType);
    return emitter.subscribe(callback, errorCallback, completedCallback);
  }

  setDirtyState(reason?: string) {
    reason = reason || this.defaultDirtyReason;
    if (this.dirtyStateMap[reason]) {
      this.dirtyStateMap[reason]++;
    } else {
      this.dirtyStateMap[reason] = 1;
    }
  }

  clearDirtyState(reason?: string, all?: boolean) {
    reason = reason || this.defaultDirtyReason;

    if (!this.dirtyStateMap[reason]) {
      return;
    }

    if (all) {
      delete this.dirtyStateMap[reason];
    } else {
      this.dirtyStateMap[reason]--;
    }
  }

  getDirtyState(reason?: string) {
    if (reason) {
      return (this.dirtyStateMap[reason] || 0) > 0;
    } else {
      return this.isEmptyMap(this.dirtyStateMap);
    }
  }

  clearAllDirtyStates() {
    this.dirtyStateMap = {};
  }

  // http://stackoverflow.com/a/20494546/3234163
  isEmptyMap(map: any): boolean {
    for (const key in map) {
      if (map.hasOwnProperty(key)) {
        return false;
      }
    }
    return true;
  }

  getEventEmitter(eventType: BroadcastEvent): any {
    switch (eventType) {
      case BroadcastEvent.IntegrateChanged:
        return this.integrateChnagedEvent;

      case BroadcastEvent.Error:
        return this.errorEvent;
    }
  }
}
