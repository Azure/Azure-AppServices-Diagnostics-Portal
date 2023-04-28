import { Component, OnInit } from '@angular/core';
import { NgFlowchart, NgFlowchartStepComponent } from 'projects/ng-flowchart/dist';

@Component({
  selector: 'architecture-diagram-node',
  templateUrl: './architecture-diagram-node.component.html',
  styleUrls: ['./architecture-diagram-node.component.scss']
})
export class ArchitectureDiagramNodeComponent extends NgFlowchartStepComponent {

  routes = [];
  nodeIconType: string = ""; 
  imageTypeList: Map<string, string> =  new Map([
    [ "webapp", "assets/img/Azure-WebApps-Logo.png" ],
    [ "Linux App", "assets/img/Azure-Tux-Logo.png" ],
    [ "Function App", "assets/img/Azure-Functions-Logo.png" ],
    [ "Logic App", "assets/img/Azure-LogicAppsPreview-Logo.svg" ],
    [ "App Service Environment", "assets/img/ASE-Logo.jpg" ],
    [ "Virtual Machine", "assets/img/Icon-compute-21-Virtual-Machine.svg" ],
    [ "Container App", "assets/img/Azure-ContainerApp-Logo.png" ],
    [ "Internal Stamp", "assets/img/Cloud-Service-Logo.svg" ],
    [ "traffic", "assets/img/SupportTopicImages/traffic.png" ],
    [ "cloudservice", "assets/img/Cloud-Service-Logo.svg" ],
    [ "frontdoor", "assets/img/AzureFront-Doors.svg" ],
    [ "default", "assets/img/Default-Node-Image.svg" ]
]);

iconTypeList: Map<string, string> =  new Map([
  [ "cloud", "fa fa-cloud fa-3x fa-border-icon"]
]);

  ngOnInit(): void{
    this.modifyData(); 
  }

  private modifyData(){
      //special ellipses modification for title overflow 
      if(this.data.title){
        this._modifyTitle(); 
      }
      this.data.icon = this.data.icon ? this.data.icon.trim() : this.data.icon;
      this.data.status =this.data.status ? this.data.status.trim() : this.data.status; 
      this._setIcon(); 
  }

  private _modifyTitle(){

    if(this.data.title.length > 24){
      this.data.title = this.data.title.substring(0,10) + "..." + this.data.title.substring(this.data.title.length - 12); 
    }
  }

  private _setIcon(){
    //check if this.data.icon exists or is empty 
    //or this.data.icon is invalid 
    //set this.data.icon to be default value
    if(!this.data.icon || this.data.icon == "" || 
    !( this.imageTypeList.has(this.data.icon) || this.iconTypeList.has(this.data.icon))){
      this.data.icon = "default";;  
    }
    //if icon is cloud, set as icon type
    //image type otherwise
      if(this.data.icon == "cloud"){
        this.nodeIconType = "icon"; 
      }
      else{
        this.nodeIconType = "image"; 
      }
  }
}
