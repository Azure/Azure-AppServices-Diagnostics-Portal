import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Theme, light, dark, highContrastDark, highContrastLight } from "diagnostic-data";
import { loadTheme } from 'office-ui-fabric-react';

import {
    AzureThemeLight,
    AzureThemeDark,
    AzureThemeHighContrastLight,
    AzureThemeHighContrastDark
} from '@uifabric/azure-themes';
import { ActivatedRoute } from "@angular/router";


@Injectable({
    providedIn: "root"
})
export class ApplensThemeService {
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
    setActiveTheme(theme: string, highContrastKey: string = ""): void {
        if (highContrastKey === "" || highContrastKey === "0") {
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
        else if (highContrastKey === "2") {
            this.currentThemeSub.next('high-contrast-dark');
            loadTheme(AzureThemeHighContrastDark);
            this.setActiveDomTheme(highContrastDark);
        }
        else {
            this.currentThemeSub.next('high-contrast-light');
            loadTheme(AzureThemeHighContrastLight);
            this.setActiveDomTheme(highContrastLight);
        }
    }

    setActiveThemeWithQueryParam(theme: string): void {
        switch (theme.toLocaleLowerCase()) {
            case 'dark':
                this.currentThemeSub.next('dark');
                loadTheme(AzureThemeDark);
                this.setActiveDomTheme(dark);
                break;
            case 'highcontrastdark':
                this.currentThemeSub.next('high-contrast-dark');
                loadTheme(AzureThemeHighContrastDark);
                this.setActiveDomTheme(highContrastDark);
                break;
            case 'highcontrastlight':
                this.currentThemeSub.next('high-contrast-light');
                loadTheme(AzureThemeHighContrastLight);
                this.setActiveDomTheme(highContrastLight);
                break;
            default:
                this.currentThemeSub.next('light');
                loadTheme(AzureThemeLight);
                this.setActiveDomTheme(light);
                break;
        }
    }

    constructor(private _activatedRoute: ActivatedRoute) {
        if (!!this._activatedRoute && !!this._activatedRoute.snapshot && !!this._activatedRoute.snapshot.queryParams && !!this._activatedRoute.snapshot.queryParams['theme']) {
            this.currentThemeValue = this._activatedRoute.snapshot.queryParams['theme'].toLocaleLowerCase();
        }

        this.setActiveThemeWithQueryParam(this.currentThemeValue);
    }
}
