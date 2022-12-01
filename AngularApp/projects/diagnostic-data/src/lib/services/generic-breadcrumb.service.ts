import { Injectable } from "@angular/core";


@Injectable()

export class GenericBreadcrumbService {
    public updateBreadCrumbSubject(breadcrumbItem: BreadcrumbNavigationItem) {}
}

export interface BreadcrumbNavigationItem {
    name: string;
    fullPath: string;
    queryParams?: any;
}
