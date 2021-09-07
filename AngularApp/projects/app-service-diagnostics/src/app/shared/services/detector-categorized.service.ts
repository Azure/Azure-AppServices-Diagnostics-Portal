
import { map, retry, catchError } from 'rxjs/operators';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ResponseMessageEnvelope } from '../models/responsemessageenvelope';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../startup/services/auth.service';
import { ArmService } from './arm.service';
import { DetectorResponse, DetectorMetaData } from 'diagnostic-data';
import { CategoryService } from '../../shared-v2/services/category.service';
import { CollapsibleMenuItem } from '../../home/components/collapsible-menu-item/collapsible-menu-item.component';



@Injectable()
export class DetectorCategorizationService {

    resourceId: string;
    detectorCategories: { [id: string]: string[] } = {};
    detectorlistCategories: { [id: string]: CollapsibleMenuItem[] } = {};
    orphanDetectorList: CollapsibleMenuItem[] = [];

    constructor(private categoryService: CategoryService, private _armService: ArmService, private _authService: AuthService) {
        this.categoryService.categories.subscribe(categories => {
            categories.forEach((category) => {
                if (!this.detectorCategories.hasOwnProperty(category.id)) {
                    this.detectorCategories[category.id] = [];
                }
            })
        });

        this.detectorlistCategories["AvailabilityAndPerformanceWindows"] = [];
        this.detectorlistCategories["ConfigurationAndManagement"] = [];
        this.detectorlistCategories["SSLandDomains"] = [];
        this.detectorlistCategories["RiskAssessments"] = [];
        this.detectorlistCategories["navigator"] = [];
        this.detectorlistCategories["DiagnosticTools"] = [];
    }

    public addDetectorToCategory(detectorId: string, categoryId: string) {
        if (!this.detectorCategories.hasOwnProperty(categoryId)) {
            this.detectorCategories[categoryId] = [detectorId];
        }
        else if (!this.detectorCategories[categoryId].find(id => detectorId === id)) {
            this.detectorCategories[categoryId].push(detectorId);
        }
    }

    public listNotEmpty(categoryId: string) {
        return this.detectorlistCategories.hasOwnProperty(categoryId) && this.detectorlistCategories[categoryId].length > 0;
    }

    public getlist(categoryId: string): CollapsibleMenuItem[] {
        if (this.detectorlistCategories.hasOwnProperty(categoryId))
            return this.detectorlistCategories[categoryId];
        else {
            this.detectorlistCategories[categoryId] = [];
            return this.detectorlistCategories[categoryId];
        }

    }

    public pushDetectorToCategory(item: CollapsibleMenuItem, categoryId: string) {
        if (!this.detectorlistCategories.hasOwnProperty(categoryId)) {
            this.detectorlistCategories[categoryId] = [item];
        }
        else {
            this.detectorlistCategories[categoryId].push(item);
        }
    }

    public addlistToCategory(list: CollapsibleMenuItem[], categoryId: string) {
        this.detectorlistCategories[categoryId] = list;
    }

    public getOrphanDetectors(categoryId: string) {
        if (!this.detectorCategories.hasOwnProperty(categoryId)) {
            return [];
        }
        else {
            return this.detectorCategories[categoryId];
        }
    }
}
