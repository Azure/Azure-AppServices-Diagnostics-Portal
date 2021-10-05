import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  public slot: BehaviorSubject<string> = new BehaviorSubject<string>("");
  public isLegacySub: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public initializedPortalVersion: BehaviorSubject<string> = new BehaviorSubject<string>("v2");
  constructor() { }
}
