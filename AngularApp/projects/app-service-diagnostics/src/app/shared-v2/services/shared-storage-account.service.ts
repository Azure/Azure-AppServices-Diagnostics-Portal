import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedStorageAccountService {

  // Observable string sources
  private emitChangeSource = new Subject<StorageAccountProperties>();

  // Observable string streams
  changeEmitted$ = this.emitChangeSource.asObservable();

  // Service message commands
  emitChange(change: StorageAccountProperties) {
    this.emitChangeSource.next(change);
  }
}

export class StorageAccountProperties {
  name: string;
  connectionString: string;
}