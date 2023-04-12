import { Component, OnInit, Input } from '@angular/core';
import { Category, CategoryQuickLinkDetails } from '../../../shared-v2/models/category';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { NotificationService } from '../../../shared-v2/services/notification.service';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';
import { DiagnosticService, DetectorMetaData, DetectorType, TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { ResourceService } from '../../../shared-v2/services/resource.service';

@Component({
  selector: 'category-tile',
  templateUrl: './category-tile.component.html',
  styleUrls: ['./category-tile.component.scss']
})
export class CategoryTileComponent implements OnInit {

  @Input() category: Category;

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _notificationService: NotificationService, private _logger: LoggingV2Service, private _diagnosticService: DiagnosticService, private _resourceService: ResourceService, private _telemetryService: TelemetryService) { }

  ngOnInit() {
  }

  clickCategoryQuickLink(e: Event, quickLink: CategoryQuickLinkDetails): void {
    e.stopPropagation();
    this._telemetryService.logEvent(TelemetryEventNames.QuickLinkOnCategoryTileClicked, {
      'categoryId': this.category.id,
      'quickLinkType': quickLink.type,
      'quickLinkId': quickLink.id,
      'quickLinkDisplayText': quickLink.displayText
    });
    if (quickLink.type === DetectorType.Detector) {
      this._router.navigateByUrl(`resource${this._resourceService.resourceIdForRouting}/detectors/${quickLink.id}`);
    } else if (quickLink.type === DetectorType.Analysis) {
      this._router.navigateByUrl(`resource${this._resourceService.resourceIdForRouting}/analysis/${quickLink.id}`);
    } else if (quickLink.type === DetectorType.Workflow) {
      this._router.navigateByUrl(`resource${this._resourceService.resourceIdForRouting}/workflows/${quickLink.id}`);
    }
  }

  navigateToCategory(): void {

    this._logger.LogCategorySelected(this.category.name);
    this._logger.LogClickEvent('CategorySelected', 'HomeV2', this.category.name);

    if (this.category.overridePath) {
      this._router.navigateByUrl(this.category.overridePath);
      return;
    }

    this._diagnosticService.getDetectors().subscribe(detectors => {

      var currentCategoryDetectors = detectors.filter(detector => detector.category === this.category.id);

      if (currentCategoryDetectors.length === 1) {
        this._notificationService.dismiss();
        this._logger.LogTopLevelDetector(currentCategoryDetectors[0].id, currentCategoryDetectors[0].name, this.category.id);
        if (currentCategoryDetectors[0].type === DetectorType.Detector) {
          this._router.navigateByUrl(`resource${this._resourceService.resourceIdForRouting}/detectors/${currentCategoryDetectors[0].id}`);
        } else if (currentCategoryDetectors[0].type === DetectorType.Analysis) {
          this._router.navigateByUrl(`resource${this._resourceService.resourceIdForRouting}/analysis/${currentCategoryDetectors[0].id}`);
        } else if (currentCategoryDetectors[0].type === DetectorType.Workflow) {
          this._router.navigateByUrl(`resource${this._resourceService.resourceIdForRouting}/workflows/${currentCategoryDetectors[0].id}`);
        }
      }
      else {
        const path = ['categoriesv3', this.category.id];
        const navigationExtras: NavigationExtras = {
          queryParamsHandling: 'preserve',
          preserveFragment: true,
          relativeTo: this._activatedRoute
        };

        this._notificationService.dismiss();

        this._router.navigate(path, navigationExtras);
      }
    });
  }
}
