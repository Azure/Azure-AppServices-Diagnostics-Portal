import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AuthService } from "../startup/services/auth.service";
import { Theme, light, dark, highContrastDark, highContrastLight} from "./theme";
import { IPartialTheme,  loadTheme } from 'office-ui-fabric-react';
import { CommonSemanticColors, DarkSemanticColors, FontSizes, LightSemanticColors, HighContrastLightSemanticColors, HighContrastDarkSemanticColors} from '@uifabric/azure-themes';

import {
    AzureThemeLight,
    AzureThemeDark,
    AzureThemeHighContrastLight,
     AzureThemeHighContrastDark
  } from '@uifabric/azure-themes';



@Injectable({
  providedIn: "root"
})
export class ThemeService{
  private active: Theme = light;
  private availableThemes: Theme[] = [light, dark, highContrastLight, highContrastDark];
  public currentThemeSub: BehaviorSubject<string> = new BehaviorSubject<string>("light");
  private currentThemeValue: string = "light";
  private currentHighContrastKeyValue: string = "";

  getAvailableThemes(): Theme[] {
    return this.availableThemes;
  }

  setActiveDomTheme(theme: Theme): void {
    this.active = theme;

    Object.keys(this.active.properties).forEach(property => {
      document.documentElement.style.setProperty(
        property.toString(),
        this.active.properties[property]
      );
    });
  }

  getPropertyValue(key: string): string {
    return this.active && Object.keys(this.active.properties).findIndex(property => property === key) >= 0 ? this.active.properties[key] : "";
  }

  // This method will set theme for fluent ui components (loadTheme) and non-fluent ui components(setActiveDomTheme).
  setActiveTheme(theme: string, highContrastKey: string=""): void {
      if(highContrastKey === "" || highContrastKey === "0")
      {
          switch (theme.toLocaleLowerCase()) {
            case 'dark':
                this.currentThemeSub.next('dark');
                loadTheme(AzureThemeDark);
                this.setActiveDomTheme(dark);
                break;
            default:
                this.currentThemeSub.next('light');
                loadTheme(AzureThemeLight);
                this.setActiveDomTheme(light);
                break;
          }
      }
      else if (highContrastKey === "2")
      {
        this.currentThemeSub.next('high-contrast-dark');
        loadTheme(AzureThemeHighContrastDark);
        this.setActiveDomTheme(highContrastDark);
      }
      else
      {
        this.currentThemeSub.next('high-contrast-light');
        loadTheme(AzureThemeHighContrastLight);
        this.setActiveDomTheme(highContrastLight);
      }
  }

  constructor(private _authService: AuthService) {
    this.setActiveTheme(this.currentThemeValue, this.currentHighContrastKeyValue);
    this._authService.getStartupInfo().subscribe(startupInfo => {
        if (startupInfo)
        {
            const theme = startupInfo.theme != undefined ? startupInfo.theme.toLowerCase() : "";
            const highContrastKey = startupInfo.highContrastKey != undefined ? startupInfo.highContrastKey.toString() : "";

            if (theme !== this.currentThemeValue || highContrastKey !== this.currentHighContrastKeyValue)
            {
                this.currentThemeValue = theme !== this.currentThemeValue? theme : this.currentThemeValue;
                this.currentHighContrastKeyValue = highContrastKey !== this.currentHighContrastKeyValue ? highContrastKey : this.currentHighContrastKeyValue;
                this.setActiveTheme(this.currentThemeValue, this.currentHighContrastKeyValue);
            }
        }
    });
}
}
