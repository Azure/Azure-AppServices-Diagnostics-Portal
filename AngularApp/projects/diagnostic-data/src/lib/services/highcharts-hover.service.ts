import { Injectable} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class HighChartsHoverService{
    constructor(){}
    public hoverXAxisValue:BehaviorSubject<number> = new BehaviorSubject(null);
}