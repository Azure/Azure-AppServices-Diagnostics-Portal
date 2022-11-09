import { Injectable } from '@angular/core';
import { Category } from '../models/category';
import { BehaviorSubject } from 'rxjs';
import { GenericArmConfigService } from '../../shared/services/generic-arm-config.service';
import { ArmResourceConfig } from '../../shared/models/arm/armResourceConfig';
@Injectable()
export class CategoryService {

  public categories: BehaviorSubject<Category[]> = new BehaviorSubject<Category[]>(null);

  private _categories: Category[] = [];

  private _commonCategories: Category[] = [];

  constructor(private _genericArmConfigService?: GenericArmConfigService) {
    this._addCategories(this._commonCategories);
  }

  public initCategoriesForArmResource(resourceUri: string) {
    if (this._genericArmConfigService) {
      let currConfig: ArmResourceConfig = this._genericArmConfigService.getArmResourceConfig(resourceUri);
      if (currConfig.categories && currConfig.categories.length > 0) {
        this._addCategories(currConfig.categories);
      }
    }
  }

  protected _addCategories(categories: Category[]) {
    categories.forEach(newCategory=> {
      let alreadyEisting = this._categories.find(existingCategory=> existingCategory.id == newCategory.id);
      if(alreadyEisting == null || alreadyEisting == undefined) {
        this._categories.push(newCategory);
      }
    });
    this.categories.next(this._categories);
  }

  public filterCategoriesForSub() {
    this._categories = this._categories.filter( function(category) {
        return category.id !== 'navigator';
    });
    this.categories.next(this._categories);
  }

   getCategoryIdByNameAndCurrentCategory(name: string, currentCategoryId?: string): string {
    //Default set to "*",so it will still route to category-summary
    let categoryId: string = this._categories.length > 0 ? this._categories[0].id : "*";
    //If category name is "XXX Tools" and has Diagnostic Tools category,then should belong to Diagnostic Tool Category.For now this should be working in Windows Web App
    if ((name === "Diagnostic Tools" || name === "Support Tools" || name === "Proactive Tools") && this._categories.find(category => category.name === "Diagnostic Tools")) {
      const category = this._categories.find(category => category.name === "Diagnostic Tools");
      categoryId = category.id;
    }
    else if (name && this._categories.find(category => category.name === name)) {
      const category = this._categories.find(category => category.name === name);
      categoryId = category.id;
    }
    //In category-overview page and uncategoried detector,return current categoryId
    else if (currentCategoryId) {
      categoryId = currentCategoryId;
    }
    //In home page,no categoryId in router,return category as availability&perf
    else if (this._categories.find(category => category.name === "Availability and Performance")) {
      const category = this._categories.find(category => category.name === "Availability and Performance");
      categoryId = category.id;
    }
    return categoryId;
  }

  getCategoryNameByCategoryId(id: string): string {
    const category = this._categories.find(c => c.id.toLowerCase() === id.toLowerCase());
    return category ? category.name : "";
  }
}
