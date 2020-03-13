import { Component, OnInit, ViewChild, TemplateRef, ElementRef, Renderer2, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from '../../../shared-v2/services/category.service';
import { Category } from '../../../shared-v2/models/category';
import { Globals } from '../../../globals';

const suffix = ' cm';

@Component({
    selector: 'category-overview',
    templateUrl: './category-overview.component.html',
    styleUrls: ['./category-overview.component.scss',
    ]
})
//extends Renderable

export class CategoryOverviewComponent implements OnInit {
    categoryId: string = "";
    category: Category;
    showCalendar: boolean = false;

    renderCheckboxLabel: any = {
        getProps: defaultProps => ({
            item: defaultProps["item"],
            dismissMenu: false
        }),
    };

    onMouseOverEventHandler(event: any) {
        event.preventDefault();
    }

    onClickEventHandler(event: any) {
        event.preventDefault();
    }

    getErrorMessageOnTextField(value: string): string {
        var values = value.split(":");
        var errorMessage = "";
        if (!(values.length > 1 && +values[0] <= 24 && +values[1] <= 59)) {
            errorMessage = `Invalid time`;
        }
        return errorMessage;
    }

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

    constructor(private _activatedRoute: ActivatedRoute, private _router: Router, private _categoryService: CategoryService, private globals: Globals) {
    }

    ngAfterViewInit() {
    }

    openMessageBar: boolean = false;

    ngOnInit() {
        this.categoryId = this._activatedRoute.parent.snapshot.params.category;
        this._categoryService.categories.subscribe(categorys => {
            this.category = categorys.find(category => this.categoryId === category.id);
        });
    }
}
