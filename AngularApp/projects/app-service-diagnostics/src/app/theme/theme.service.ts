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
import { IAzureSemanticColors } from "@uifabric/azure-themes/lib/azure/IAzureSemanticColors";



@Injectable({
  providedIn: "root"
})
export class ThemeService {
  private active: Theme = light;
  private availableThemes: Theme[] = [light, dark];
  public currentThemeSub: BehaviorSubject<string> = new BehaviorSubject<string>("light");
  public currentHighContrastKeySub: BehaviorSubject<string> = new BehaviorSubject<string>("");
  public currentThemeValue: string = "light";
  public currentHighContrastKeyValue: string = "";

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
    loadTheme(AzureThemeDark);
    this.setActiveDomTheme(dark);
  }

  setLightTheme(): void {
    loadTheme(AzureThemeLight);
    this.setActiveDomTheme(light);
  }

  setActiveDomTheme(theme: Theme): void {
    this.active = theme;

    Object.keys(this.active.properties).forEach(property => {
      document.documentElement.style.setProperty(
        property.toString(),
        this.active.properties[property]
      );
      var c =    document.documentElement.style.getPropertyValue(
        property.toString()
      );
    });
  }

  // This method will set theme for fluent ui components (loadTheme) and non-fluent ui components(setActiveDomTheme).
  setActiveTheme(theme: string, highContrastKey: string=""): void {
    console.log("Loading theme and high contrast", theme);
      if(highContrastKey === "" || highContrastKey === "0")
      {
          switch (theme.toLocaleLowerCase()) {
            case 'dark':
                loadTheme(AzureThemeDark);
                this.setActiveDomTheme(dark);
                break;
            default:
                loadTheme(AzureThemeLight);
                this.setActiveDomTheme(light);
                break;
          }
      }
      else if (highContrastKey === "2")
      {
        loadTheme(AzureThemeHighContrastDark);
        this.setActiveDomTheme(highContrastDark);
      }
      else
      {
        loadTheme(AzureThemeHighContrastLight);
        this.setActiveDomTheme(highContrastLight);
      }
  }

  constructor(private _authService: AuthService) {
    this.setActiveTheme(this.currentThemeValue, this.currentHighContrastKeyValue);
    this._authService.getStartupInfo().subscribe(startupInfo => {
        if (startupInfo)
        {
            const theme = !!startupInfo.theme ? startupInfo.theme.toLowerCase() : "";
            const highContrastKey = !!startupInfo.highContrastKey ? startupInfo.highContrastKey.toString() : "";

            if (!!theme || !!highContrastKey)
            {
                if (!!theme && theme !== this.currentThemeValue)
                {
                    this.currentThemeSub.next(theme);
                    this.currentThemeValue = theme;

                    console.log("_themeService: get theme", theme, highContrastKey);

                };

                if (!!highContrastKey && highContrastKey !== this.currentThemeValue)
                {
                    console.log("_themeService: get highcontrastkey", theme, highContrastKey);
                    this.currentHighContrastKeySub.next(highContrastKey);
                    this.currentHighContrastKeyValue = highContrastKey;
                }

                this.setActiveTheme(this.currentThemeValue, this.currentHighContrastKeyValue);
            }
        }
    });
}

}
