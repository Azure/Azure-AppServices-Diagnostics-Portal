import { Component, OnInit, ViewChild, TemplateRef, ElementRef, Renderer2, SimpleChanges, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { Category } from '../../../shared-v2/models/category';
import { Globals } from '../../../globals';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';
import { ResourceService } from '../../../shared-v2/services/resource.service';

const suffix = ' cm';

@Component({
    selector: 'category-overview',
    templateUrl: './category-overview.component.html',
    styleUrls: ['./category-overview.component.scss',
    ]
})
//extends Renderable

export class CategoryOverviewComponent implements OnInit {
    disableGenie: boolean=false;
    categoryId: string = "";
    category: Category;
    categoryOverviewDetector: string = "";
    categoryName: string = "";
    categoryDescription: string = "";

    onValidate(value: string, event: Event): string | void {
        value = this._removeSuffix(value, suffix);
        if (value.trim().length === 0 || isNaN(+value)) {
            return '0' + suffix;
        }

        return String(value) + suffix;
    }

    private _hasSuffix(value: string, suffix: string): Boolean {
        const subString = value.substr(value.length - suffix.length);
        return subString === suffix;
    }

    private _removeSuffix(value: string, suffix: string): string {
        if (!this._hasSuffix(value, suffix)) {
            return value;
        }

        return value.substr(0, value.length - suffix.length);
    }

    constructor(private _activatedRoute: ActivatedRoute, private _router: Router, private _categoryService: CategoryService, private globals: Globals, private _telemetryService: TelemetryService, private _resourceService: ResourceService) {
    }

    ngOnInit() {
        let categoryParam = this._activatedRoute.parent.snapshot.params.category.toLowerCase();
        this.disableGenie =  this._resourceService.isGenieDisabled();
        this._categoryService.categories.subscribe(categories => {
            this.category = categories.find(category => categoryParam === category.id.toLowerCase() || category.name.replace(/\s/g, '').toLowerCase() === categoryParam);
            if (!!this.category) {
                this.categoryId = this.category.id;
                this.categoryOverviewDetector = this.category.overviewDetectorId;
                this.categoryName = this.category.name;
                this.categoryDescription = this.category.description;
            }
        });
    }

    ngAfterViewInit() {
        this._telemetryService.logPageView(TelemetryEventNames.CategoryOverviewPageLoaded, 
        {   "Category": this.categoryId,
            "CategoryName": this.category?.name ?? ""
        });
    }
}
