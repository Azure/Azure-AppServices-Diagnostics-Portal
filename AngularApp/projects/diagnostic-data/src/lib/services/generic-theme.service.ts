import { Injectable} from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GenericThemeService{
    public currentThemeSub: BehaviorSubject<string>=new BehaviorSubject<string>("light");
}
