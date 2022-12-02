import { Component, OnInit } from '@angular/core';
import { AutohealingService } from '../../shared/services/autohealing.service';
import { SiteService } from '../../shared/services/site.service';
import { SiteInfoMetaData } from '../../shared/models/site';

@Component({
  selector: 'proactive-autohealing',
  templateUrl: './proactive-autohealing.component.html',
  styleUrls: ['./proactive-autohealing.component.scss']
})
export class ProactiveAutohealingComponent implements OnInit {
  proactiveAutoHealEnabledConfigured: boolean = true;
  proactiveAutoHealEnabled: boolean = true;
  retrievingProactiveSettings: boolean = true;
  saveEnabled: boolean = false;
  errorMessage: string = '';
  siteInfoMetadata: SiteInfoMetaData;
  savingProactiveAutohealSettings: boolean = false;
  changesSaved: boolean = false;

  constructor(
    private _siteService: SiteService,
    private _autohealingService: AutohealingService
  ) {}

  ngOnInit() {
    this.retrievingProactiveSettings = true;
    this._siteService.currentSiteMetaData.subscribe((siteInfo) => {
      if (siteInfo) {
        this.siteInfoMetadata = siteInfo;
        this._autohealingService.isProactiveAutohealEnabled(siteInfo).subscribe(
          (enabled) => {
            this.proactiveAutoHealEnabled = enabled;
            this.proactiveAutoHealEnabledConfigured = enabled;
            this.retrievingProactiveSettings = false;
          },
          (err) => {
            this.retrievingProactiveSettings = false;
            this.errorMessage = `Failed with an error ${JSON.stringify(
              err
            )} while retrieving pro-active autoheal settings`;
          }
        );
      }
    });
  }

  checkForChanges(): boolean {
    this.saveEnabled = !(
      this.proactiveAutoHealEnabledConfigured === this.proactiveAutoHealEnabled
    );
    return this.saveEnabled;
  }

  saveChanges() {
    this.saveEnabled = false;
    this.savingProactiveAutohealSettings = true;
    this._autohealingService
      .updateProactiveAutohealing(
        this.siteInfoMetadata,
        this.proactiveAutoHealEnabled
      )
      .subscribe(
        (resp) => {
          this.savingProactiveAutohealSettings = false;
          this.proactiveAutoHealEnabledConfigured =
            this.proactiveAutoHealEnabled;
          this.checkForChanges();
          this.changesSaved = true;
          setTimeout(() => {
            this.changesSaved = false;
          }, 3000);
        },
        (err) => {
          this.savingProactiveAutohealSettings = false;
          this.errorMessage = `Failed while saving proactive autoheal settings an error ${JSON.stringify(
            err
          )} while retrieving pro-active autoheal settings`;
        }
      );
  }
}
