import { Component, OnInit, Input } from '@angular/core';
import { Category } from '../../../shared-v2/models/category';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { NotificationService } from '../../../shared-v2/services/notification.service';
import { LoggingV2Service } from '../../../shared-v2/services/logging-v2.service';
import { DiagnosticService, DetectorMetaData, DetectorType } from 'diagnostic-data';
import { ResourceService } from '../../../shared-v2/services/resource.service';
import { PortalActionService } from '../../../shared/services/portal-action.service';

const imageRootPath = '../../../../assets/img/landing-home';
@Component({
  selector: 'category-tile',
  templateUrl: './category-tile.component.html',
  styleUrls: ['./category-tile.component.scss']
})
export class CategoryTileComponent implements OnInit {

  @Input() category: Category;
  categoryImgPath: string;

  constructor(private _portalService: PortalActionService, private _router: Router, private _activatedRoute: ActivatedRoute, private _notificationService: NotificationService, private _logger: LoggingV2Service, private _diagnosticService: DiagnosticService, private _resourceService: ResourceService) { }

  ngOnInit() {
    this.categoryImgPath = this.generateImagePath(this.category.name);
  }

  openBladeDiagnoseCategoryBlade() {
    this._portalService.openBladeDiagnoseCategoryBlade(this.category.id);
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
        console.log("category id", this.category.id);
      var currentCategoryDetectors = detectors.filter(detector => detector.category === this.category.id);
      console.log("this category", this.category);

      console.log("Filetered detectors", currentCategoryDetectors);
      if (currentCategoryDetectors.length === 1) {
        this._notificationService.dismiss();
        this._logger.LogTopLevelDetector(currentCategoryDetectors[0].id, currentCategoryDetectors[0].name, this.category.id);
        if(currentCategoryDetectors[0].type === DetectorType.Detector) {
          this._router.navigateByUrl(`resource${this._resourceService.resourceIdForRouting}/detectors/${currentCategoryDetectors[0].id}`);
        }  else if (currentCategoryDetectors[0].type === DetectorType.Analysis) {
          this._router.navigateByUrl(`resource${this._resourceService.resourceIdForRouting}/analysis/${currentCategoryDetectors[0].id}`);
        }        
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

  generateImagePath(name : string):string {
    return `${imageRootPath}/${name}.svg`;
  }
}
