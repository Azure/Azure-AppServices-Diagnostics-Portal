import { Component, OnInit, Input } from '@angular/core';
import { Category } from '../../../shared-v2/models/category';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { NotificationService } from '../../../shared-v2/services/notification.service';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';
import { DiagnosticService, DetectorMetaData } from 'diagnostic-data';
import { ResourceService } from '../../../shared-v2/services/resource.service';

@Component({
  selector: 'category-tile',
  templateUrl: './category-tile.component.html',
  styleUrls: ['./category-tile.component.scss']
})
export class CategoryTileComponent implements OnInit {

  @Input() category: Category;

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _notificationService: NotificationService, private _logger: LoggingV2Service, private _diagnosticService: DiagnosticService, private _resourceService: ResourceService) { }

  ngOnInit() {
  }

  navigateToCategory(): void {

    this._logger.LogCategorySelected(this.category.name);
    this._logger.LogClickEvent('CategorySelection', 'HomeV2', this.category.name);

    if (this.category.overridePath) {
      this._router.navigateByUrl(this.category.overridePath);
      return;
    }

    this._diagnosticService.getDetectors().subscribe(detectors => {

        console.log("All detectors", detectors);
      var currentCategoryDetectors = detectors.filter(detector => detector.category === this.category.id);
      console.log("this category", this.category);

      console.log("Filetered detectors", currentCategoryDetectors);
      if (currentCategoryDetectors.length === 1) {
        this._notificationService.dismiss();
        this._logger.LogTopLevelDetector(currentCategoryDetectors[0].id, currentCategoryDetectors[0].name, this.category.id);
        this._router.navigateByUrl(`resource${this._resourceService.resourceIdForRouting}/detectors/${currentCategoryDetectors[0].id}`);
      }
      else {
        const path = ['categories', this.category.id];
        const navigationExtras: NavigationExtras = {
          queryParamsHandling: 'preserve',
          preserveFragment: true,
          relativeTo: this._activatedRoute
        };

        this._notificationService.dismiss();

        console.log("router", path);
        this._router.navigate(path, navigationExtras);
      }
    });

    console.log("Get detectors")
  }
}
