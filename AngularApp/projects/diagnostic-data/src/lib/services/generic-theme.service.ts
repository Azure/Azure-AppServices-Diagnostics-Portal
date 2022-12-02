import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GenericThemeService {
  public currentThemeSub: BehaviorSubject<string> = new BehaviorSubject<string>(
    'light'
  );
  getPropertyValue(key: string): string {
    return null;
  }
  setActiveTheme(theme: string, highContrastKey: string = ''): void {}
}
