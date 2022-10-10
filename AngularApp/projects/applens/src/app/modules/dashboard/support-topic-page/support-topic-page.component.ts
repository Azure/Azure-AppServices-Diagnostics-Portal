import { Component, OnInit } from '@angular/core';
import { SupportTopicItem, SupportTopicResult } from '../resource-home/resource-home.component';
import { DetectorMetaData, SupportTopic } from 'diagnostic-data';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { Router, ActivatedRoute, NavigationExtras, NavigationEnd, Params } from '@angular/router';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { HttpClient } from '@angular/common/http';
import { ResourceService } from '../../../shared/services/resource.service';
import { Location } from '@angular/common';
import { TelemetryService } from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.service';
import {TelemetryEventNames} from '../../../../../../diagnostic-data/src/lib/services/telemetry/telemetry.common';

@Component({
  selector: 'support-topic-page',
  templateUrl: './support-topic-page.component.html',
  styleUrls: ['../category-page/category-page.component.scss']
})

export class SupportTopicPageComponent implements OnInit {

  pesId: string;
  supportTopicId: string;
  supportTopicName: string;
  supportTopic: SupportTopicItem;
  supportTopics: SupportTopicItem[] = [];
  supportTopicsLoaded: boolean = false;
  supportTopicIcon: string;
  supportTopicsNumber: number = 0;
  detectorsNumber: number = 0;

  allDetectors: DetectorMetaData[] = [];
  detectorsWithSupportTopics: DetectorMetaData[] = [];
  publicDetectorsList: DetectorMetaData[] = [];
  filterdDetectors: DetectorMetaData[] = [];
  filterdDetectorAuthors: string[] = [];
  supportTopicIdMapping: any[] = [];

  authors: any[] = [];
  authorsList: string[] = [];
  authorsNumber: number = 0;
  userImages: { [name: string]: string };

  detectorsPublicOrWithSupportTopics: DetectorMetaData[] = [];

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _http: HttpClient, private _resourceService: ResourceService, private _diagnosticService: ApplensDiagnosticService, private _supportTopicService: ApplensSupportTopicService, private _location: Location, private _telemetryService: TelemetryService) { }

  ngOnInit() {
    this.supportTopicName = this._activatedRoute.snapshot.params['supportTopic'];
    this._supportTopicService.getCategoryImage(this.supportTopicName).subscribe((iconString) => {
      this.supportTopicIcon = iconString;
    });

    this.pesId = this._resourceService.pesId;
    this._diagnosticService.getDetectors().subscribe((detectors: DetectorMetaData[]) => {
      this.detectorsWithSupportTopics = detectors.filter(detector => detector.supportTopicList && detector.supportTopicList.length > 0);

      this.detectorsWithSupportTopics.forEach(detector => {
        detector.supportTopicList.forEach(supportTopic => {
          if (supportTopic.pesId === this.pesId) {
            this.supportTopicIdMapping.push({ supportTopic: supportTopic, detectorType: detector.type, detectorId: detector.id, detectorName: detector.name, detectorInternal: true });
          }
        });
      });

      this._supportTopicService.getSupportTopics().subscribe((allSupportTopics: SupportTopicResult[]) => {
        this.supportTopicsLoaded = true;
        this._telemetryService.logPageView(TelemetryEventNames.SupportTopicsLoaded, {})
        let filteredSupportTopics = allSupportTopics.filter((supportTopic) => supportTopic.supportTopicL2Name === this.supportTopicName);

        filteredSupportTopics.forEach((sup: SupportTopicResult) => {
          this._supportTopicService.getCategoryImage(sup.supportTopicL3Name).subscribe((iconString) => {
            let icon = iconString;
            let matchingDetector = this.supportTopicIdMapping.find((st) => st.supportTopic.id === sup.supportTopicId);
            let matchingDetectorType = "Detector";
            let matchingDetectorId = "";
            let matchingDetectorName = "";
            let matchingDetectorInternalOnly = true;
            if (matchingDetector != undefined) {
              matchingDetectorType = matchingDetector.detectorType;
              matchingDetectorId = matchingDetector.detectorId;
              matchingDetectorName = matchingDetector.detectorName;
              matchingDetectorInternalOnly = true;
              this.detectorsNumber++;
            }

            let item = new SupportTopicItem(sup.supportTopicL2Name, sup.productId, matchingDetectorType, sup.supportTopicId, sup.supportTopicL3Name, sup.supportTopicPath, icon, [], matchingDetectorId, matchingDetectorName, matchingDetectorInternalOnly);
            if (!this.supportTopics.find((st => st.supportTopicL3Name === sup.supportTopicL3Name))) {
              this.supportTopics.push(item);
            }
          });
        });
      });

      this.supportTopicsNumber = this.supportTopics.length;
      return this.detectorsWithSupportTopics;
    });
  }

  navigateTo(path: string) {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute
    };
    this._router.navigate([path], navigationExtras);
  }

  navigateBack() {
    this._location.back();
  }

  navigateToContent(supportTopic: SupportTopicItem) {
    if (supportTopic.detectorId != undefined && supportTopic.detectorId !== "") {
      if (supportTopic.detectorType === "Analysis") {
        this.navigateTo(`../../analysis/${supportTopic.detectorId}`);
      }
      else {
        this.navigateTo(`../../detectors/${supportTopic.detectorId}`);
      }
    }
    else {
      this.navigateTo(`../../pesId/${supportTopic.pesId}/supportTopics/${supportTopic.supportTopicId}`);
    }
  }
}
