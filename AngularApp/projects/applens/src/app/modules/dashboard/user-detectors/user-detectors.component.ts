import { Component, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { ActivatedRoute } from '@angular/router';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import {
  DataTableResponseColumn,
  DataTableResponseObject,
  DetectorMetaData,
  ExtendDetectorMetaData as ExtendedDetectorMetaData,
  SupportTopic,
  TableColumnOption,
  TableFilterSelectionOption
} from 'diagnostic-data';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { catchError } from 'rxjs/operators';
import { forkJoin as observableForkJoin, of } from 'rxjs';
import { ApplensGlobal } from '../../../applens-global';
import { SupportTopicResult } from '../resource-home/resource-home.component';

@Component({
  selector: 'user-detectors',
  templateUrl: './user-detectors.component.html',
  styleUrls: [
    './user-detectors.component.scss',
    '../category-page/category-page.component.scss'
  ]
})
export class UserDetectorsComponent implements OnInit {
  userId: string = '';
  isDetector: boolean = true;

  //If true, list all detectors/gists. Otherwise only list items created by current user
  allItems: boolean = false;
  // detectorsNumber: number = 0;
  isCurrentUser: boolean = false;
  table: DataTableResponseObject = null;
  supportTopics: SupportTopicResult[] = [];
  internalOnlyMap: Map<string, boolean> = new Map<string, boolean>();
  columnOptions: TableColumnOption[] = [
    {
      name: 'Category',
      selectionOption: TableFilterSelectionOption.Multiple
    },
    {
      name: 'View',
      selectionOption: TableFilterSelectionOption.Multiple
    }
  ];

  constructor(
    private _applensGlobal: ApplensGlobal,
    private _activatedRoute: ActivatedRoute,
    private _diagnosticService: ApplensDiagnosticService,
    private _adalService: AdalService,
    private _supportTopicService: ApplensSupportTopicService
  ) {}

  ngOnInit() {
    this._applensGlobal.updateHeader('');
    this.isDetector = this._activatedRoute.snapshot.data['isDetector'];
    this.allItems = this._activatedRoute.snapshot.data['allItems'];
    this.checkIsCurrentUser();

    if (this.isDetector) {
      this._supportTopicService
        .getSupportTopics()
        .pipe(catchError((err) => of([])))
        .subscribe((supportTopics: SupportTopicResult[]) => {
          this.supportTopics = supportTopics;
          this._diagnosticService.getDetectors().subscribe((allDetectors) => {
            this._diagnosticService
              .getDetectorsWithExtendDefinition()
              .pipe(catchError((err) => of([])))
              .subscribe((extendMetadata) => {
                this.internalOnlyMap =
                  this.initialInternalOnlyMap(extendMetadata);
                const detectorsOfAuthor = allDetectors.filter(
                  (detector) =>
                    detector.author &&
                    detector.author
                      .toLowerCase()
                      .indexOf(this.userId.toLowerCase()) > -1
                );
                const selectedDetectors = this.allItems
                  ? allDetectors
                  : detectorsOfAuthor;
                this.table = this.generateDetectorTable(selectedDetectors);
              });
          });
        });
    } else {
      this._diagnosticService.getGists().subscribe((allGists) => {
        const gistsOfAuthor = allGists.filter(
          (gist) =>
            gist.author &&
            gist.author.toLowerCase().indexOf(this.userId.toLowerCase()) > -1
        );
        const selectedGists = this.allItems ? allGists : gistsOfAuthor;
        this.table = this.generateGistsTable(selectedGists);
      });
    }

    this._activatedRoute.params.subscribe((params) => {
      this.checkIsCurrentUser();
    });
  }

  private generateDetectorTable(detectors: DetectorMetaData[]) {
    const columns: DataTableResponseColumn[] = [
      { columnName: 'Name' },
      { columnName: 'Category' },
      { columnName: 'Support Topic' },
      { columnName: 'View' }
    ];

    let rows: any[][] = [];

    const resourceId = this._diagnosticService.resourceId;
    rows = detectors.map((detector) => {
      let path = `${resourceId}/detectors/${detector.id}`;
      if (this.isCurrentUser) {
        path = path + '/edit';
      }
      const name = `<markdown>
                    <a href="${path}">${detector.name}</a>
                </markdown>`;
      const category = detector.category ? detector.category : 'None';
      const supportTopics = this.getSupportTopicName(detector.supportTopicList);
      let view = 'Unknown';
      if (this.internalOnlyMap.has(detector.id)) {
        const internalOnly = this.internalOnlyMap.get(detector.id);
        view = internalOnly ? 'Internal Only' : 'Internal & External';
      }
      return [name, category, supportTopics, view];
    });
    const dataTableObject: DataTableResponseObject = {
      columns: columns,
      rows: rows
    };

    return dataTableObject;
  }

  private generateGistsTable(gists: DetectorMetaData[]) {
    const columns: DataTableResponseColumn[] = [
      { columnName: 'Name' },
      { columnName: 'Category' }
    ];

    let rows: any[][] = [];

    const resourceId = this._diagnosticService.resourceId;
    rows = gists.map((gist) => {
      let path = `${resourceId}/gists/${gist.id}`;
      if (this.isCurrentUser) {
        path = path + '/edit';
      }
      const name = `<markdown>
                    <a href="${path}">${gist.name}</a>
                </markdown>`;
      const category = gist.category ? gist.category : 'None';
      return [name, category];
    });
    const dataTableObject: DataTableResponseObject = {
      columns: columns,
      rows: rows
    };
    return dataTableObject;
  }

  private initialInternalOnlyMap(list: ExtendedDetectorMetaData[]) {
    const map: Map<string, boolean> = new Map();
    list.forEach((metaData) => {
      map.set(metaData.id, metaData.internalOnly);
    });
    return map;
  }

  private checkIsCurrentUser() {
    this.userId = this._activatedRoute.snapshot.params['userId']
      ? this._activatedRoute.snapshot.params['userId']
      : '';
    let alias =
      Object.keys(this._adalService.userInfo.profile).length > 0
        ? this._adalService.userInfo.profile.upn
        : '';
    let currentUser = alias.replace('@microsoft.com', '');
    this.isCurrentUser = currentUser.toLowerCase() === this.userId;
  }

  private getSupportTopicName(supportTopicIds: SupportTopic[]): string {
    const l2ToL3Map: Map<string, Set<string>> = new Map<string, Set<string>>();
    supportTopicIds.forEach((t) => {
      const topic = this.supportTopics.find(
        (topic) => topic.supportTopicId === t.id
      );
      if (topic) {
        const l2Name = topic.supportTopicL2Name;
        const l3Name = topic.supportTopicL3Name;

        const l3NameSet = l2ToL3Map.has(l2Name)
          ? l2ToL3Map.get(l2Name)
          : new Set<string>();
        l3NameSet.add(l3Name);
        l2ToL3Map.set(l2Name, l3NameSet);
      }
    });
    const templateStr = this.convertSupportTopicNameSetToString(l2ToL3Map);
    return templateStr;
  }

  private convertSupportTopicNameSetToString(
    l2ToL3Map: Map<string, Set<string>>
  ): string {
    const l2SupportTopicNames = Array.from(l2ToL3Map.keys());

    if (l2SupportTopicNames.length === 0) return 'None';

    let supportTopicTemplate = '<markdown>';
    for (const l2Name of l2SupportTopicNames) {
      const l3Names = Array.from(l2ToL3Map.get(l2Name));
      const l3NamesTemplate = `<ul>${l3Names
        .map((l3Name) => `<li>${l3Name}</li>`)
        .join('')}</ul>`;
      supportTopicTemplate += `<h5><strong>${l2Name}</strong></h5>${l3NamesTemplate}`;
    }
    supportTopicTemplate += '</markdown>';
    return supportTopicTemplate;
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
