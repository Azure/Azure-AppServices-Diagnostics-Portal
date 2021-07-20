import { Component, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { DataTableResponseColumn, DataTableResponseObject, DetectorMetaData, SupportTopic, TableColumnOption, TableFilterSelectionOption } from 'diagnostic-data';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { DetectorItem } from '../category-page/category-page.component';

@Component({
  selector: 'user-detectors',
  templateUrl: './user-detectors.component.html',
  styleUrls: ['./user-detectors.component.scss', '../category-page/category-page.component.scss']
})
export class UserDetectorsComponent implements OnInit {

  userId: string = "";
  userInfo: UserInfo = undefined;
  detectorsOfAuthor: DetectorMetaData[] = undefined;
  detectors: DetectorItem[] = [];
  detectorsNumber: number = 0;
  isCurrentUser: boolean = false;
  table: DataTableResponseObject = {
    columns: [],
    rows: [[]]
  };
  supportTopics: any[] = [];
  columnOptions: TableColumnOption[] = [
    {
      name: "Category",
      selectionOption: TableFilterSelectionOption.Multiple
    }
  ];

  constructor(private _router: Router, private _activatedRoute: ActivatedRoute, private _diagnosticService: ApplensDiagnosticService, private _adalService: AdalService, private _supportTopicService: ApplensSupportTopicService) { }

  ngOnInit() {
    this.detectorsOfAuthor = undefined;
    this.userId = this._activatedRoute.snapshot.params['userId'];
    this.checkIsCurrentUser();
    this._activatedRoute.params.subscribe(params => {
      this.checkIsCurrentUser();
      this.detectors = [];

      this._supportTopicService.getSupportTopics().subscribe(supportTopics => {
        this.supportTopics = supportTopics;
        this._diagnosticService.getDetectors().subscribe((detectors: DetectorMetaData[]) => {
          // Get all the detectors of the current author
          this.detectorsOfAuthor = detectors.filter(detector => detector.author && detector.author.toLowerCase().indexOf(this.userId.toLowerCase()) > -1);          
          this.table = this.generateDataTableObject(this.detectorsOfAuthor);
        });
      });
    });
  }

  navigateTo(path: string) {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute
    };
    this._router.navigate([path], navigationExtras);
  }

  private generateDataTableObject(detectors: DetectorMetaData[]) {
    const columns: DataTableResponseColumn[] = [
      { columnName: "Name" },
      { columnName: "Category" },
      { columnName: "Support topic" }
    ];

    let rows: any[][] = [];

    rows = detectors.map(detector => {
      let path = `../../../detectors/${detector.id}`;
      if (this.isCurrentUser) {
        path = path + "/edit";
      }
      const name =
        `<markdown>
          <a href="${path}">${detector.name}</a>
        </markdown>`;
      const category = detector.category ? detector.category : "None";
      const supportTopics = this.getSupportTopicName(detector.supportTopicList);
      return [name, category, supportTopics];
    });

    const dataTableObject: DataTableResponseObject = {
      columns: columns,
      rows: rows
    }

    return dataTableObject;
  }

  private checkIsCurrentUser() {
    this.userId = this._activatedRoute.snapshot.params['userId'];
    let alias = Object.keys(this._adalService.userInfo.profile).length > 0 ? this._adalService.userInfo.profile.upn : '';
    let currentUser = alias.replace('@microsoft.com', '');
    this.isCurrentUser = currentUser.toLowerCase() === this.userId;
  }

  private getSupportTopicName(supportTopicIds:SupportTopic[]):string {
    const l2NameSet = new Set<string>();
    supportTopicIds.forEach(t => {
      const topic = this.supportTopics.find(topic => topic.supportTopicId === t.id);
      if(topic && topic.supportTopicL2Name){
        l2NameSet.add(topic.supportTopicL2Name);
      }
    });
    const supportTopicNames = new Array(l2NameSet);

    if(l2NameSet.size === 0) return "None";
    return supportTopicNames.join(";");
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
