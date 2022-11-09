import { Component, OnInit } from '@angular/core';
import { AdalService } from 'adal-angular4';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { DataTableResponseColumn, DataTableResponseObject, DetectorMetaData, ExtendDetectorMetaData as ExtendedDetectorMetaData, SupportTopic, TableColumnOption, TableFilterSelectionOption } from 'diagnostic-data';
import { ApplensSupportTopicService } from '../services/applens-support-topic.service';
import { catchError } from 'rxjs/operators';
import { of, forkJoin as observableForkJoin } from 'rxjs';
import { ApplensGlobal } from '../../../applens-global';

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

  constructor(private _applensGlobal: ApplensGlobal, private _activatedRoute: ActivatedRoute, private _diagnosticService: ApplensDiagnosticService, private _adalService: AdalService, private _supportTopicService: ApplensSupportTopicService) { }

  ngOnInit() {
    this._applensGlobal.updateHeader("");
    this.isDetector = this._activatedRoute.snapshot.data["isDetector"];
    this.allItems = this._activatedRoute.snapshot.data["allItems"];
    this.checkIsCurrentUser();

    if (this.isDetector) {
      this._supportTopicService.getSupportTopics().pipe(catchError(err => of([]))).subscribe(supportTopics => {
        this.supportTopics = supportTopics;
        this.supportTopics = AKSSupportTopic;
        const map = this.initialSupportTopicMap(this.supportTopics);
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
      { columnName: "L2 topic" },
      { columnName: "L3 topic" },
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
      return [name, category, supportTopics.l2NameString, supportTopics.l3NameString, view];
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
      return [name, category];
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

  private getSupportTopicName(supportTopicIds: SupportTopic[]): { l2NameString: string, l3NameString: string } {
    const l2nameSet = new Set<string>();
    const l3nameSet = new Set<string>();


    supportTopicIds.forEach(t => {
      const topic = this.supportTopics.find(topic => topic.supportTopicId === t.id);
      if (topic && topic.supportTopicL2Name) {
        l2nameSet.add(topic.supportTopicL2Name);
      }

      if (topic && topic.supportTopicL3Name) {
        l3nameSet.add(topic.supportTopicL3Name);
      }
    });

    const l2NameString = this.convertSupportTopicNameSetToString(l2nameSet);
    const l3NameString = this.convertSupportTopicNameSetToString(l3nameSet);

    return {
      l2NameString, l3NameString
    };
  }

  private convertSupportTopicNameSetToString(supportTopicNameSet: Set<string>): string {
    const supportTopicNames = Array.from(supportTopicNameSet);

    if (supportTopicNameSet.size === 0) return "None";
    let supportTopicString = "<markdown>";
    for (const name of supportTopicNames) {
      supportTopicString += `<div>${name}</div></br>`;
    }
    supportTopicString += "</markdown>";
    return supportTopicString;
  }

  private initialSupportTopicMap(supportTopics: any[]) {
    //supportL2Name -> supportL3Name
    const map = new Map<string,Set<string>>();
    for (const topic of supportTopics) {
      const supportTopicId = topic.supportTopicId;
      const supportTopicL2Name = topic.supportTopicL2Name;
      const supportTopicL3Name = topic.supportTopicL3Name;

      const l3Set = map.get(supportTopicL2Name) ? map.get(supportTopicL2Name) : new Set<string>();

      l3Set.add(supportTopicL3Name);
      map.set(supportTopicL2Name,l3Set);
    }

    return map;
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

//For
const AKSSupportTopic = [
  {
      "productId": "16450",
      "supportTopicId": "32844749",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Create, Upgrade, Scale and Delete operations (cluster or nodepool)",
      "supportTopicL3Name": "Upgrading the cluster or nodepool",
      "supportTopicPath": "Kubernetes Service (AKS)/Create, Upgrade, Scale and Delete operations (cluster or nodepool)/Upgrading the cluster or nodepool"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844735",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Create, Upgrade, Scale and Delete operations (cluster or nodepool)",
      "supportTopicL3Name": "Node image upgrade",
      "supportTopicPath": "Kubernetes Service (AKS)/Create, Upgrade, Scale and Delete operations (cluster or nodepool)/Node image upgrade"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844706",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Create, Upgrade, Scale and Delete operations (cluster or nodepool)",
      "supportTopicL3Name": "Creating or deploying a new AKS cluster",
      "supportTopicPath": "Kubernetes Service (AKS)/Create, Upgrade, Scale and Delete operations (cluster or nodepool)/Creating or deploying a new AKS cluster"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844684",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Create, Upgrade, Scale and Delete operations (cluster or nodepool)",
      "supportTopicL3Name": "Adding/creating a new nodepool",
      "supportTopicPath": "Kubernetes Service (AKS)/Create, Upgrade, Scale and Delete operations (cluster or nodepool)/Adding/creating a new nodepool"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844746",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Create, Upgrade, Scale and Delete operations (cluster or nodepool)",
      "supportTopicL3Name": "Unable to create Private AKS cluster",
      "supportTopicPath": "Kubernetes Service (AKS)/Create, Upgrade, Scale and Delete operations (cluster or nodepool)/Unable to create Private AKS cluster"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844742",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Create, Upgrade, Scale and Delete operations (cluster or nodepool)",
      "supportTopicL3Name": "Scaling a nodepool",
      "supportTopicPath": "Kubernetes Service (AKS)/Create, Upgrade, Scale and Delete operations (cluster or nodepool)/Scaling a nodepool"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844709",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Create, Upgrade, Scale and Delete operations (cluster or nodepool)",
      "supportTopicL3Name": "Deleting the cluster or nodepool",
      "supportTopicPath": "Kubernetes Service (AKS)/Create, Upgrade, Scale and Delete operations (cluster or nodepool)/Deleting the cluster or nodepool"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844695",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Create, Upgrade, Scale and Delete operations (cluster or nodepool)",
      "supportTopicL3Name": "Cluster stop and start",
      "supportTopicPath": "Kubernetes Service (AKS)/Create, Upgrade, Scale and Delete operations (cluster or nodepool)/Cluster stop and start"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844689",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Pod creation and scheduling",
      "supportTopicL3Name": "Application pods restarted/not coming online",
      "supportTopicPath": "Kubernetes Service (AKS)/Pod creation and scheduling/Application pods restarted/not coming online"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844686",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Pod creation and scheduling",
      "supportTopicL3Name": "AKS system pods restarted/not coming online",
      "supportTopicPath": "Kubernetes Service (AKS)/Pod creation and scheduling/AKS system pods restarted/not coming online"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844740",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Pod creation and scheduling",
      "supportTopicL3Name": "Pods scheduling/creation",
      "supportTopicPath": "Kubernetes Service (AKS)/Pod creation and scheduling/Pods scheduling/creation"
  },
  {
      "productId": "16450",
      "supportTopicId": "32851683",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Pod creation and scheduling",
      "supportTopicL3Name": "Vertical Pod autoscalar",
      "supportTopicPath": "Kubernetes Service (AKS)/Pod creation and scheduling/Vertical Pod autoscalar"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844731",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Pod creation and scheduling",
      "supportTopicL3Name": "Namespace management",
      "supportTopicPath": "Kubernetes Service (AKS)/Pod creation and scheduling/Namespace management"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844717",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Pod creation and scheduling",
      "supportTopicL3Name": "High memory on pods",
      "supportTopicPath": "Kubernetes Service (AKS)/Pod creation and scheduling/High memory on pods"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844715",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Pod creation and scheduling",
      "supportTopicL3Name": "High CPU on pods",
      "supportTopicPath": "Kubernetes Service (AKS)/Pod creation and scheduling/High CPU on pods"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844741",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Pod creation and scheduling",
      "supportTopicL3Name": "Removing/deleting a Pod",
      "supportTopicPath": "Kubernetes Service (AKS)/Pod creation and scheduling/Removing/deleting a Pod"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844730",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Pod creation and scheduling",
      "supportTopicL3Name": "My problem isn't listed",
      "supportTopicPath": "Kubernetes Service (AKS)/Pod creation and scheduling/My problem isn't listed"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844737",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Node/node pool availability and performance",
      "supportTopicL3Name": "Node/node pool shows in Not ready/Failed state",
      "supportTopicPath": "Kubernetes Service (AKS)/Node/node pool availability and performance/Node/node pool shows in Not ready/Failed state"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844734",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Node/node pool availability and performance",
      "supportTopicL3Name": "Node crashed/rebooted",
      "supportTopicPath": "Kubernetes Service (AKS)/Node/node pool availability and performance/Node crashed/rebooted"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844736",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Node/node pool availability and performance",
      "supportTopicL3Name": "Node/ node pool level configuration",
      "supportTopicPath": "Kubernetes Service (AKS)/Node/node pool availability and performance/Node/ node pool level configuration"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844744",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Node/node pool availability and performance",
      "supportTopicL3Name": "Stop/Start node pools",
      "supportTopicPath": "Kubernetes Service (AKS)/Node/node pool availability and performance/Stop/Start node pools"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844716",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Node/node pool availability and performance",
      "supportTopicL3Name": "High memory on node",
      "supportTopicPath": "Kubernetes Service (AKS)/Node/node pool availability and performance/High memory on node"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844714",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Node/node pool availability and performance",
      "supportTopicL3Name": "High CPU on node",
      "supportTopicPath": "Kubernetes Service (AKS)/Node/node pool availability and performance/High CPU on node"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844712",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Node/node pool availability and performance",
      "supportTopicL3Name": "Disk throttling on node",
      "supportTopicPath": "Kubernetes Service (AKS)/Node/node pool availability and performance/Disk throttling on node"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844729",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Node/node pool availability and performance",
      "supportTopicL3Name": "My problem isn't listed",
      "supportTopicPath": "Kubernetes Service (AKS)/Node/node pool availability and performance/My problem isn't listed"
  },
  {
      "productId": "16450",
      "supportTopicId": "32840027",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Storage",
      "supportTopicL3Name": "Mount/attach new volumes",
      "supportTopicPath": "Kubernetes Service (AKS)/Storage/Mount/attach new volumes"
  },
  {
      "productId": "16450",
      "supportTopicId": "32840026",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Storage",
      "supportTopicL3Name": "Existing volumes not usable",
      "supportTopicPath": "Kubernetes Service (AKS)/Storage/Existing volumes not usable"
  },
  {
      "productId": "16450",
      "supportTopicId": "32840029",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Storage",
      "supportTopicL3Name": "Resize existing volumes",
      "supportTopicPath": "Kubernetes Service (AKS)/Storage/Resize existing volumes"
  },
  {
      "productId": "16450",
      "supportTopicId": "32840030",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Storage",
      "supportTopicL3Name": "Restore or backup issues",
      "supportTopicPath": "Kubernetes Service (AKS)/Storage/Restore or backup issues"
  },
  {
      "productId": "16450",
      "supportTopicId": "32840028",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Storage",
      "supportTopicL3Name": "Performance/Latency issue with volumes",
      "supportTopicPath": "Kubernetes Service (AKS)/Storage/Performance/Latency issue with volumes"
  },
  {
      "productId": "16450",
      "supportTopicId": "32840025",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Storage",
      "supportTopicL3Name": "Delete/detach volumes",
      "supportTopicPath": "Kubernetes Service (AKS)/Storage/Delete/detach volumes"
  },
  {
      "productId": "16450",
      "supportTopicId": "32825670",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Storage",
      "supportTopicL3Name": "Trident for NetApp Files",
      "supportTopicPath": "Kubernetes Service (AKS)/Storage/Trident for NetApp Files"
  },
  {
      "productId": "16450",
      "supportTopicId": "32637206",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Storage",
      "supportTopicL3Name": "My problem is not listed above",
      "supportTopicPath": "Kubernetes Service (AKS)/Storage/My problem is not listed above"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844694",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Connectivity",
      "supportTopicL3Name": "Cannot connect to application hosted on AKS cluster (Ingress)",
      "supportTopicPath": "Kubernetes Service (AKS)/Connectivity/Cannot connect to application hosted on AKS cluster (Ingress)"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844699",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Connectivity",
      "supportTopicL3Name": "Connecting to external services from AKS cluster",
      "supportTopicPath": "Kubernetes Service (AKS)/Connectivity/Connecting to external services from AKS cluster"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844693",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Connectivity",
      "supportTopicL3Name": "Cannot connect to AKS API Server",
      "supportTopicPath": "Kubernetes Service (AKS)/Connectivity/Cannot connect to AKS API Server"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844701",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Connectivity",
      "supportTopicL3Name": "Connectivity issues within the AKS cluster",
      "supportTopicPath": "Kubernetes Service (AKS)/Connectivity/Connectivity issues within the AKS cluster"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844700",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Connectivity",
      "supportTopicL3Name": "Connecting to Private AKS cluster",
      "supportTopicPath": "Kubernetes Service (AKS)/Connectivity/Connecting to Private AKS cluster"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844747",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Connectivity",
      "supportTopicL3Name": "Unable to pull images from Container Registry(ACR)",
      "supportTopicPath": "Kubernetes Service (AKS)/Connectivity/Unable to pull images from Container Registry(ACR)"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844732",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Connectivity",
      "supportTopicL3Name": "Network security group and Policies",
      "supportTopicPath": "Kubernetes Service (AKS)/Connectivity/Network security group and Policies"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844726",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Connectivity",
      "supportTopicL3Name": "My problem isn't listed",
      "supportTopicPath": "Kubernetes Service (AKS)/Connectivity/My problem isn't listed"
  },
  {
      "productId": "16450",
      "supportTopicId": "32637210",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Identity and Security Management",
      "supportTopicL3Name": "RBAC and Active Directory",
      "supportTopicPath": "Kubernetes Service (AKS)/Identity and Security Management/RBAC and Active Directory"
  },
  {
      "productId": "16450",
      "supportTopicId": "32637212",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Identity and Security Management",
      "supportTopicL3Name": "Service Principal related issues",
      "supportTopicPath": "Kubernetes Service (AKS)/Identity and Security Management/Service Principal related issues"
  },
  {
      "productId": "16450",
      "supportTopicId": "32637180",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Identity and Security Management",
      "supportTopicL3Name": "Authentication issue with ACR",
      "supportTopicPath": "Kubernetes Service (AKS)/Identity and Security Management/Authentication issue with ACR"
  },
  {
      "productId": "16450",
      "supportTopicId": "32637183",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Identity and Security Management",
      "supportTopicL3Name": "Certificate related issues",
      "supportTopicPath": "Kubernetes Service (AKS)/Identity and Security Management/Certificate related issues"
  },
  {
      "productId": "16450",
      "supportTopicId": "32831227",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Identity and Security Management",
      "supportTopicL3Name": "CSI secret store add-on",
      "supportTopicPath": "Kubernetes Service (AKS)/Identity and Security Management/CSI secret store add-on"
  },
  {
      "productId": "16450",
      "supportTopicId": "32831228",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Identity and Security Management",
      "supportTopicL3Name": "Microsoft Defender for Cloud",
      "supportTopicPath": "Kubernetes Service (AKS)/Identity and Security Management/Microsoft Defender for Cloud"
  },
  {
      "productId": "16450",
      "supportTopicId": "32637203",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Identity and Security Management",
      "supportTopicL3Name": "My problem is not listed above",
      "supportTopicPath": "Kubernetes Service (AKS)/Identity and Security Management/My problem is not listed above"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844748",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "DNS, Subnet and IP config",
      "supportTopicL3Name": "Unable to resolve DNS",
      "supportTopicPath": "Kubernetes Service (AKS)/DNS, Subnet and IP config/Unable to resolve DNS"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844704",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "DNS, Subnet and IP config",
      "supportTopicL3Name": "CoreDNS configuration settings",
      "supportTopicPath": "Kubernetes Service (AKS)/DNS, Subnet and IP config/CoreDNS configuration settings"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844722",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "DNS, Subnet and IP config",
      "supportTopicL3Name": "Insufficient subnet",
      "supportTopicPath": "Kubernetes Service (AKS)/DNS, Subnet and IP config/Insufficient subnet"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844745",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "DNS, Subnet and IP config",
      "supportTopicL3Name": "Subnet configuration changes",
      "supportTopicPath": "Kubernetes Service (AKS)/DNS, Subnet and IP config/Subnet configuration changes"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844743",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "DNS, Subnet and IP config",
      "supportTopicL3Name": "Static, Public and Private IP settings",
      "supportTopicPath": "Kubernetes Service (AKS)/DNS, Subnet and IP config/Static, Public and Private IP settings"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844727",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "DNS, Subnet and IP config",
      "supportTopicL3Name": "My problem isn't listed",
      "supportTopicPath": "Kubernetes Service (AKS)/DNS, Subnet and IP config/My problem isn't listed"
  },
  {
      "productId": "16450",
      "supportTopicId": "32637181",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Application and Development",
      "supportTopicL3Name": "Azure DevOps related issues",
      "supportTopicPath": "Kubernetes Service (AKS)/Application and Development/Azure DevOps related issues"
  },
  {
      "productId": "16450",
      "supportTopicId": "32637184",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Application and Development",
      "supportTopicL3Name": "CI or CD related issues",
      "supportTopicPath": "Kubernetes Service (AKS)/Application and Development/CI or CD related issues"
  },
  {
      "productId": "16450",
      "supportTopicId": "32637200",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Application and Development",
      "supportTopicL3Name": "My problem is not listed above",
      "supportTopicPath": "Kubernetes Service (AKS)/Application and Development/My problem is not listed above"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844710",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Load balancer and Ingress controller",
      "supportTopicL3Name": "Deploying/updating an ingress controller failed",
      "supportTopicPath": "Kubernetes Service (AKS)/Load balancer and Ingress controller/Deploying/updating an ingress controller failed"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844721",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Load balancer and Ingress controller",
      "supportTopicL3Name": "Ingress controller not working as expected",
      "supportTopicPath": "Kubernetes Service (AKS)/Load balancer and Ingress controller/Ingress controller not working as expected"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844697",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Load balancer and Ingress controller",
      "supportTopicL3Name": "Configuring ingress controller",
      "supportTopicPath": "Kubernetes Service (AKS)/Load balancer and Ingress controller/Configuring ingress controller"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844705",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Load balancer and Ingress controller",
      "supportTopicL3Name": "Create or delete a load balancer",
      "supportTopicPath": "Kubernetes Service (AKS)/Load balancer and Ingress controller/Create or delete a load balancer"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844725",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Load balancer and Ingress controller",
      "supportTopicL3Name": "Load balancer not working as expected",
      "supportTopicPath": "Kubernetes Service (AKS)/Load balancer and Ingress controller/Load balancer not working as expected"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844698",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Load balancer and Ingress controller",
      "supportTopicL3Name": "Configuring load balancer",
      "supportTopicPath": "Kubernetes Service (AKS)/Load balancer and Ingress controller/Configuring load balancer"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844728",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Load balancer and Ingress controller",
      "supportTopicL3Name": "My problem isn't listed",
      "supportTopicPath": "Kubernetes Service (AKS)/Load balancer and Ingress controller/My problem isn't listed"
  },
  {
      "productId": "16450",
      "supportTopicId": "32637192",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Monitoring and Logging",
      "supportTopicL3Name": "I can't access the logs (kubectl, Insights etc)",
      "supportTopicPath": "Kubernetes Service (AKS)/Monitoring and Logging/I can't access the logs (kubectl, Insights etc)"
  },
  {
      "productId": "16450",
      "supportTopicId": "32674475",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Monitoring and Logging",
      "supportTopicL3Name": "I need help with enabling or disabling Monitoring",
      "supportTopicPath": "Kubernetes Service (AKS)/Monitoring and Logging/I need help with enabling or disabling Monitoring"
  },
  {
      "productId": "16450",
      "supportTopicId": "32674476",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Monitoring and Logging",
      "supportTopicL3Name": "Alerts related issues",
      "supportTopicPath": "Kubernetes Service (AKS)/Monitoring and Logging/Alerts related issues"
  },
  {
      "productId": "16450",
      "supportTopicId": "32637194",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Monitoring and Logging",
      "supportTopicL3Name": "Azure monitoring agent",
      "supportTopicPath": "Kubernetes Service (AKS)/Monitoring and Logging/Azure monitoring agent"
  },
  {
      "productId": "16450",
      "supportTopicId": "32637193",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Monitoring and Logging",
      "supportTopicL3Name": "I have a problem with 3rd party monitoring (eg. Prometheus)",
      "supportTopicPath": "Kubernetes Service (AKS)/Monitoring and Logging/I have a problem with 3rd party monitoring (eg. Prometheus)"
  },
  {
      "productId": "16450",
      "supportTopicId": "32812584",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Monitoring and Logging",
      "supportTopicL3Name": "Insights related issues",
      "supportTopicPath": "Kubernetes Service (AKS)/Monitoring and Logging/Insights related issues"
  },
  {
      "productId": "16450",
      "supportTopicId": "32812586",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Monitoring and Logging",
      "supportTopicL3Name": "Log Analytics related issues",
      "supportTopicPath": "Kubernetes Service (AKS)/Monitoring and Logging/Log Analytics related issues"
  },
  {
      "productId": "16450",
      "supportTopicId": "32812588",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Monitoring and Logging",
      "supportTopicL3Name": "Metrics Server related issues",
      "supportTopicPath": "Kubernetes Service (AKS)/Monitoring and Logging/Metrics Server related issues"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844708",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "Dapr extension",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/Dapr extension"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844690",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "Azure ML extension",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/Azure ML extension"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844713",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "Flux(GitOps) extension",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/Flux(GitOps) extension"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844707",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "Customer script extension",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/Customer script extension"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844718",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "HTTP application routing add-on",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/HTTP application routing add-on"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844702",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "Container Insight add-on",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/Container Insight add-on"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844688",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "Application Gateway add-on",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/Application Gateway add-on"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844738",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "Open Service Mesh add-on",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/Open Service Mesh add-on"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844691",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "Azure policy add-on",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/Azure policy add-on"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844724",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "KeyVault secret provider add-on",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/KeyVault secret provider add-on"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844733",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "NGINX ingress controller add-on",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/NGINX ingress controller add-on"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844723",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "Keda (Event driven auto-scaling) add-on",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/Keda (Event driven auto-scaling) add-on"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844750",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "Virtual node add-on",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/Virtual node add-on"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844739",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Extensions, Policies and Add-Ons",
      "supportTopicL3Name": "Other",
      "supportTopicPath": "Kubernetes Service (AKS)/Extensions, Policies and Add-Ons/Other"
  },
  {
      "productId": "16450",
      "supportTopicId": "32844720",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Quota requests",
      "supportTopicL3Name": "Increase node limit",
      "supportTopicPath": "Kubernetes Service (AKS)/Quota requests/Increase node limit"
  },
  {
      "productId": "16450",
      "supportTopicId": "32637194",
      "productName": "Kubernetes Service (AKS)",
      "supportTopicL2Name": "Monitoring and Logging",
      "supportTopicL3Name": "I have a problem with OMS agent",
      "supportTopicPath": "Kubernetes Service (AKS)/Monitoring and Logging/I have a problem with OMS agent"
  }
]
