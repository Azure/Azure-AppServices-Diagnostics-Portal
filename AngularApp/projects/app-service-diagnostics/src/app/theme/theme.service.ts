import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { AuthService } from "../startup/services/auth.service";
import { Theme, light, dark } from "./theme";
import { IPartialTheme,  loadTheme } from 'office-ui-fabric-react';

import {
    AzureThemeLight,
    AzureThemeDark,
    AzureThemeHighContrastLight,
     AzureThemeHighContrastDark
  } from '@uifabric/azure-themes';



@Injectable({
  providedIn: "root"
})
export class ThemeService {
  private active: Theme = light;
  private availableThemes: Theme[] = [light, dark];
  public currentTheme: BehaviorSubject<string> = new BehaviorSubject<string>("light");
  public currentHighContrastKey: BehaviorSubject<string> = new BehaviorSubject<string>("");

  getAvailableThemes(): Theme[] {
    return this.availableThemes;
  }

  getActiveTheme(): Theme {
    return this.active;
  }

  isDarkTheme(): boolean {
    return this.active.name === dark.name;
  }

  setDarkTheme(): void {
    this.setActiveTheme(dark);
  }

  setLightTheme(): void {
    this.setActiveTheme(light);
  }

  setActiveTheme(theme: Theme): void {
    this.active = theme;

    Object.keys(this.active.properties).forEach(property => {
      document.documentElement.style.setProperty(
        property.toString(),
        this.active.properties[property]
      );
      var c =    document.documentElement.style.getPropertyValue(
        property.toString()
      );
     console.log(property, c);
    });
  }


  constructor(private _authService: AuthService) {
    this._authService.getStartupInfo().subscribe(startupInfo => {
        if (startupInfo)
        {
            const theme = !!startupInfo.theme ? startupInfo.theme.toLowerCase() : "";
            const highContrastKey = !!startupInfo.highContrastKey ? startupInfo.highContrastKey.toString() : "";
            if (!!theme)
            {
                this.currentTheme.next(theme);
                console.log("_themeService: get theme", theme, highContrastKey);

                loadTheme(AzureThemeDark);
                console.log("theme", AzureThemeDark);
                this.setDarkTheme();
            };

            if (!!highContrastKey)
            {
                this.currentHighContrastKey.next(highContrastKey);
                console.log("_themeService: get highcontrastkey", theme, highContrastKey);
            }
        }
    });
}

}
