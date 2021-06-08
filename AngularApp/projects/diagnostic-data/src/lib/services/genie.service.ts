import { Injectable} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GenieGlobals {
    constructor() { }
    messages: any[] = [];
    openGeniePanel: boolean = false;
    openFeedback: boolean = false;
    messagesData: { [id: string]: any } = {};

    getDetectorName():string {
        return "";
    }

    getUserAlias():string {
        return "";
    }

    showCommAlertSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
}
