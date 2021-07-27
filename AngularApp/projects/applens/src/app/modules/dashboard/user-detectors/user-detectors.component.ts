import { Component, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { DataTableResponseColumn, DataTableResponseObject, DetectorMetaData, ExtendDetectorMetaData as ExtendedDetectorMetaData, SupportTopic, TableColumnOption, TableFilterSelectionOption } from 'diagnostic-data';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { catchError } from 'rxjs/operators';
import { of,forkJoin as observableForkJoin } from 'rxjs';

@Component({
  selector: 'user-detectors',
  templateUrl: './user-detectors.component.html',
  styleUrls: ['./user-detectors.component.scss', '../category-page/category-page.component.scss']
})
export class UserDetectorsComponent implements OnInit {

  userId: string = "";
  isDetector: boolean = true;

  //If true, list all detectors/gists. Otherwise only list items created by current user
  allItems: boolean = false;
  // detectorsNumber: number = 0;
  isCurrentUser: boolean = false;
  table: DataTableResponseObject = null;
  supportTopics: any[] = [];
  internalOnlyMap: Map<string, boolean> = new Map<string, boolean>();
  columnOptions: TableColumnOption[] = [
    {
      name: "Category",
      selectionOption: TableFilterSelectionOption.Multiple
    },
    {
      name: "View",
      selectionOption: TableFilterSelectionOption.Multiple
    }
  ];

  constructor(private _activatedRoute: ActivatedRoute, private _diagnosticService: ApplensDiagnosticService, private _adalService: AdalService, private _supportTopicService: ApplensSupportTopicService) { }

  ngOnInit() {
    this.isDetector = this._activatedRoute.snapshot.data["isDetector"];
    this.allItems = this._activatedRoute.snapshot.data["allItems"];
    this.checkIsCurrentUser();

    if (this.isDetector) {
      this._supportTopicService.getSupportTopics().pipe(catchError(err => of([]))).subscribe(supportTopics => {
        this.supportTopics = supportTopics;
        this._diagnosticService.getDetectors().subscribe(allDetectors => {
          this._diagnosticService.getDetectorsWithExtendDefinition().pipe(catchError(err => of([]))).subscribe(extendMetadata => {

            this.internalOnlyMap = this.initialInternalOnlyMap(extendMetadata);
            const detectorsOfAuthor = allDetectors.filter(detector => detector.author && detector.author.toLowerCase().indexOf(this.userId.toLowerCase()) > -1);
            const selectedDetectors = this.allItems ? allDetectors : detectorsOfAuthor;
            this.table = this.generateDetectorTable(selectedDetectors);
          });
        });
      });

      
    } else {
      this._diagnosticService.getGists().subscribe(allGists => {
        const gistsOfAuthor = allGists.filter(gist => gist.author && gist.author.toLowerCase().indexOf(this.userId.toLowerCase()) > -1);
        const selectedGists = this.allItems ? allGists : gistsOfAuthor;
        this.table = this.generateGistsTable(selectedGists);
      });
    }


    this._activatedRoute.params.subscribe(params => {
      this.checkIsCurrentUser();
    });
  }

  private generateDetectorTable(detectors: DetectorMetaData[]) {
    const columns: DataTableResponseColumn[] = [
      { columnName: "Name" },
      { columnName: "Category" },
      { columnName: "Support topic" },
      { columnName: "View" }
    ];

    let rows: any[][] = [];

    const resourceId = this._diagnosticService.resourceId;
    rows = detectors.map(detector => {
      let path = `${resourceId}/detectors/${detector.id}`;
      if (this.isCurrentUser) {
        path = path + "/edit";
      }
      const name =
        `<markdown>
          <a href="${path}">${detector.name}</a>
        </markdown>`;
      const category = detector.category ? detector.category : "None";
      const supportTopics = this.getSupportTopicName(detector.supportTopicList);
      let view = "Unknown";
      if (this.internalOnlyMap.has(detector.id)) {
        const internalOnly = this.internalOnlyMap.get(detector.id);
        view = internalOnly ? "Internal Only" : "Internal & External";
      }
      return [name, category, supportTopics, view];
    });
    const dataTableObject: DataTableResponseObject = {
      columns: columns,
      rows: rows
    }

    return dataTableObject;
  }

  private generateGistsTable(gists: DetectorMetaData[]) {

    const columns: DataTableResponseColumn[] = [
      { columnName: "Name" },
      { columnName: "Category" }
    ];

    let rows: any[][] = [];

    const resourceId = this._diagnosticService.resourceId;
    rows = gists.map(gist => {
      let path = `${resourceId}/gists/${gist.id}`;
      if (this.isCurrentUser) {
        path = path + "/edit";
      }
      const name =
        `<markdown>
          <a href="${path}">${gist.name}</a>
        </markdown>`;
      const category = gist.category ? gist.category : "None";
      const supportTopics = this.getSupportTopicName(gist.supportTopicList);
      return [name, category, supportTopics];
    });
    const dataTableObject: DataTableResponseObject = {
      columns: columns,
      rows: rows
    }
    return dataTableObject;
  }

  private initialInternalOnlyMap(list: ExtendedDetectorMetaData[]) {
    const map: Map<string, boolean> = new Map();
    list.forEach(metaData => {
      map.set(metaData.id, metaData.internalOnly);
    });
    return map;
  }

  

  private checkIsCurrentUser() {
    this.userId = this._activatedRoute.snapshot.params['userId'] ? this._activatedRoute.snapshot.params['userId'] : '';
    let alias = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    let currentUser = alias.replace('@microsoft.com', '');
    this.isCurrentUser = currentUser.toLowerCase() === this.userId;
  }

  private getSupportTopicName(supportTopicIds: SupportTopic[]): string {
    const l2NameSet = new Set<string>();
    supportTopicIds.forEach(t => {
      const topic = this.supportTopics.find(topic => topic.supportTopicId === t.id);
      if (topic && topic.supportTopicL2Name) {
        l2NameSet.add(topic.supportTopicL2Name);
      }
    });
    const supportTopicNames = Array.from(l2NameSet);

    if (l2NameSet.size === 0) return "None";
    return supportTopicNames.join("; ");
  }
}

export class UserInfo {
  businessPhones: string;
  displayName: string;
  givenName: string;
  jobTitle: string;
  mail: string;
  officeLocation: string;
  userPrincipalName: string;
}
