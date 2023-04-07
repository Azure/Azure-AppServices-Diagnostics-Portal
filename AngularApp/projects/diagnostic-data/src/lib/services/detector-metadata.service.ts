import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DetectorMetadataService {

  author: string = '';
  description: string = '';

  authorObservable: BehaviorSubject<string> = new BehaviorSubject<string>(this.author);
  descObservable: BehaviorSubject<string> = new BehaviorSubject<string>(this.description);

  constructor() { }

  getAuthor(){
    return this.authorObservable;
  }
  setAuthor(auth: string){
    this.author = auth;
    this.authorObservable.next(this.author);
  }
  getDescription(){
    return this.descObservable;
  }
  setDescription(desc: string){
    this.description = desc;
    this.descObservable.next(this.description);
  }
}
