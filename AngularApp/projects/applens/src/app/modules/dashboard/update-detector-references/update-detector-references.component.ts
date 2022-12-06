import { Component, Input, OnInit } from '@angular/core';
import { OnboardingFlowComponent } from '../onboarding-flow/onboarding-flow.component';
import { ActivatedRoute, ActivatedRouteSnapshot, CanDeactivate, Params, Router, RouterStateSnapshot } from "@angular/router";
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import {
  CompilationProperties, DetectorControlService, DetectorResponse, HealthStatus, QueryResponse, CompilationTraceOutputDetails, LocationSpan, Position, GenericThemeService, StringUtilities, TableColumnOption, TableFilterSelectionOption, DataTableResponseObject, DataTableResponseColumn, FabDataTableComponent
} from 'diagnostic-data';
import { forkJoin } from 'rxjs';
import { inputProperties } from 'office-ui-fabric-react';
import { DevopsConfig } from '../../../shared/models/devopsConfig';


export enum DevelopMode {
  Create,
  Edit,
  EditMonitoring,
  EditAnalytics
}

@Component({
  selector: 'update-detector-references',
  templateUrl: './update-detector-references.component.html',
  styleUrls: ['./update-detector-references.component.scss']
})
export class UpdateDetectorReferencesComponent implements OnInit{

  constructor( private diagnosticApiService: ApplensDiagnosticService, private _diagnosticApi: DiagnosticApiService, private _activatedRoute: ActivatedRoute) { }

 
  @Input() id: string = ""; //gist id 
  @Input() Branch : string = ""; 
  @Input() resourceId : string = ""; 
  @Input() mode: DevelopMode = DevelopMode.Create;
  @Input() dataSource : string = '';
  @Input() timeRange : string = '';
  @Input() compilationPackage: CompilationProperties;
  @Input() queryResponse: QueryResponse<DetectorResponse>;
  @Input() userName: string;
  @Input() useAutoMergeText: boolean = false;
  @Input() PRLink : string = "";
  @Input() defaultBranch : string;
  @Input() owners: string[] = [];
  @Input() DevopsConfig: DevopsConfig;
  @Input() detectorReferencesDialogHidden : boolean = true; 
  @Input() detectorReferencesTable : DataTableResponseObject = null; 
  @Input() detectorReferencesList : any[] = []; 
  @Input()   gistCommitVersion : string = ""; 



  DevelopMode = DevelopMode;



  detectorsToCheck: Set<any> = new Set();  
  detectorsToUpdate: Map<string, any> = new Map(); 
  errorDetectorsList : Map<string, any> = new Map(); 
  updateDetectorSuccess : boolean = false; 
  detectorCompilationList : object= {};
  updatedDetectors : object= {};




  ngOnInit(): void {

  }

  
  
  updateDetectorReferences(detectorReferences : any[]) {
    
    detectorReferences.forEach( key => {
      //key = key.replace(/<(.|\n)*?>/g, ''); 
      this.detectorsToCheck.add(key.Name); 
    })
    
    console.log("inside update detector references method");
    console.log(this.detectorsToCheck);  
   

    this.detectorReferencesTable = this.generateProgressDetectorReferenceTable(); 

    detectorReferences.forEach( detector =>{
      this.checkCompilation(detector, detectorReferences.length); 
    }); 
    

  }

  private checkCompilation(detector : any, num: number) {


    if( this.detectorReferencesList["detectorReferences"][detector.Name] == this.gistCommitVersion){
      //debugger; 
      this.detectorsToCheck.delete(detector.Name); 
      if(this.detectorsToCheck.size == 0){
        this.updateDetectorPackageJsonAll(); 
      }
      return; 
    }

    else{
      //debugger; 
    //console.log(num == this.selectedDetectors.length); 
    let tempCode; 
    let tempReference; 
    let tempReferenceList = []; 
    let tempUtterances; 
    var body;

    //this.Branch = ( this.Branch == '') ? 'MainMVP' : this.Branch; 
    

    let code = this.diagnosticApiService.getDetectorCode(`${detector.Name}/${detector.Name}.csx`, this.Branch, this.resourceId);
    let utterances = this.diagnosticApiService.getDetectorCode(`${detector.Name}/metadata.json`, this.Branch, this.resourceId); 
    let reference = this.diagnosticApiService.getDetectorCode(`${detector.Name}/package.json`, this.Branch, this.resourceId); 

    forkJoin([code, reference, utterances]).subscribe( res =>{
      //debugger; 
      tempCode = res[0]; 
      tempReference = JSON.parse(res[1])['dependencies'] || {}; // 
      tempUtterances = JSON.parse(res[2]).utterances; 
      //tempUtterances = ""; 

      let tempReferenceKeys = Object.keys(tempReference); 
      let requestsArr = []; 

      tempReferenceKeys.forEach(el => {
        //somehow map this and push result to tempReferenceList 
        if( el == this.id){
          //this.gistCommitVersion = "f8a45ccc13abbdea2a7611cfd9fa4919c23d1a6f"; 
          requestsArr.push(this.getGistCommitContent(el, this.gistCommitVersion)); 
        }
        else{
          requestsArr.push(this.getGistCommitContent(el,tempReference[el])); 
        }
    });
    
        forkJoin(requestsArr).subscribe( res2 => {
          //debugger; 
          tempReferenceList = res2; 
          let refDict = {}; 

          for(let i =0; i < tempReferenceKeys.length; i++){
            refDict[tempReferenceKeys[i]] = res2[i];
            
          }
          
          var body = {
            script: tempCode,
            references: refDict,
            entityType: 'signal',
            detectorUtterances: JSON.stringify(tempUtterances.map(x => x.text))
          };
          let isSystemInvoker: boolean = this.mode === DevelopMode.EditMonitoring || this.mode === DevelopMode.EditAnalytics;

          //call compilation 

          this._activatedRoute.queryParams.subscribe((params: Params) => {
            //debugger; 
              let queryParams = JSON.parse(JSON.stringify(params));
              queryParams.startTime = undefined;
              queryParams.endTime = undefined;
              let serializedParams = this.serializeQueryParams(queryParams);
              if (serializedParams && serializedParams.length > 0) {
                serializedParams = "&" + serializedParams;
              };
              this.diagnosticApiService.getCompilerResponse(body, isSystemInvoker, detector.Name.toLowerCase(), '',
                '', this.dataSource, this.timeRange, {
                scriptETag: this.compilationPackage.scriptETag,
                assemblyName: this.compilationPackage.assemblyName,
                formQueryParams: serializedParams,
                getFullResponse: true
              },detector.Name.toLowerCase())
                .subscribe((response: any) => {
                    //debugger; 
                    this.queryResponse = response.body;
            //if compilation succeeds, update 
                if (this.queryResponse.compilationOutput.compilationSucceeded === true) {
                  //this.detectorCompilationList[detector.Name] = true; 
                  
                  
                  //this.updateDetectorPackageJson(res[1], detector.Name);
                  //console.log(`${detector.Name} ========== Build: 1 succeeded, 0 failed ==========`); 

                  
                  this.detectorsToCheck.delete(detector.Name);
                  this.detectorsToUpdate.set(detector.Name, res[1]);
                  if(this.detectorsToCheck.size == 0){
                    this.updateDetectorPackageJsonAll(); 
                  }
                
                } 
                //else do not update, remove from "detectorsToCheck", add error into the 
                else {
                  //debugger; 
                  this.detectorCompilationList[detector.Name] = false; 
                  this.updatedDetectors[detector.Name] == false; 
                  this.detectorsToCheck.delete(detector.Name); 
                  this.errorDetectorsList.set(detector.Name, this.queryResponse.compilationOutput.compilationTraces);
                   
                  if(this.detectorsToCheck.size == 0){
                    this.updateDetectorPackageJsonAll(); 
                  }
                //console.log(`${detector.Name}========== Build: 0 succeeded, 1 failed ==========`); 
                }
                if (this.queryResponse.runtimeLogOutput) {
                  this.queryResponse.runtimeLogOutput.forEach(element => {
                    if (element.exception) {
            
                      console.log(`${element.timeStamp}: ${element.message}: 
                      ${element.exception.ClassName}: ${element.exception.Message}: ${element.exception.StackTraceString}`);
                    
                      }
                    });
                    }
                //debugger; 
                // if(Object.keys(this.detectorCompilationList).length == num){
                //   this.displayUpdateDetectorResults(); 
                // }
                }, err => {
                  //debugger; 
                  this.detectorCompilationList[detector.Name] = false; 
                  this.updatedDetectors[detector.Name] = false; 
                  this.detectorsToCheck.delete(detector.Name); 
                  this.errorDetectorsList.set(detector.Name, err); 
                  console.log("error 1 : ", err); 
                  if(this.detectorsToCheck.size == 0){
                    this.updateDetectorPackageJsonAll(); 
                  }
                });
            }); 
    
            }); 
        }); 
    

    }
    
    
}


updateDetectorPackageJsonAll(){

  const commitType =  "edit";
  const commitMessageStart = "Editing";
  let gradPublishFiles: string[] = [];
  let gradPublishFileTitles: string[] = []; 


  if(this.detectorsToUpdate.size == 0){
    this.displayUpdateDetectorResults();
    return; 
  }

  this.detectorsToUpdate.forEach( (value, key) =>{

    let packageJson = JSON.parse(value); 
    packageJson["dependencies"][this.id] = this.gistCommitVersion;  
    gradPublishFiles.push( JSON.stringify(packageJson));
    gradPublishFileTitles.push( `/${key.toLowerCase()}/package.json`);

  }); 

  // debugger; 
  // var requestBranch = this.Branch; 
  var requestBranch = `dev/${this.userName.split("@")[0]}/gist/${this.id.toLowerCase()}`; 
  if(this.useAutoMergeText){
    requestBranch = this.Branch; 
  }
    
  

  const DetectorObservable = this.diagnosticApiService.pushDetectorChanges(requestBranch, gradPublishFiles, gradPublishFileTitles, `${commitMessageStart} ${this.id} Detector References Author : ${this.userName}`, 
  commitType, this.resourceId); 
  const makePullRequestObservable = this.diagnosticApiService.makePullRequest(requestBranch, this.defaultBranch, `Changing ${this.id} detector references`, this.resourceId, this.owners, "temp description");

  
  DetectorObservable.subscribe(_ => {
    //debugger; 

    makePullRequestObservable.finally( () => {
      this.displayUpdateDetectorResults(); 
    }).subscribe( _ => {
      //debugger; 
      this.PRLink = `${_["webUrl"]}/pullrequest/${_["prId"]}`;
      console.log(`PR LINK: ${this.PRLink}`);
      this.updateDetectorSuccess = true; 
      //console.log(${_["prId"]}); 

      this.detectorsToUpdate.forEach( (value, key) =>{
        this.detectorReferencesList["detectorReferences"][key] = this.gistCommitVersion; 
      }); 

    }, err =>{
      console.log(err); 
    })
    

  }, err => {
    if (err.error.includes('has already been updated by another client')){
      console.log("err ============== ", err); 
    }

    console.log(err);
  }
  

  );

}


displayDetectorReferenceTable(){ //showupdateDetectorReferencedialog


    
    this.diagnosticApiService.getGistId(this.id).subscribe( data=>{ 
    //debugger; 
    this.detectorReferencesList = data;
    this.gistCommitVersion = this.detectorReferencesList["currentCommitVersion"]; 
    console.log(this.detectorReferencesList); 
    console.log(this.gistCommitVersion); 



    var detectorKeys = Object.keys(this.detectorReferencesList["detectorReferences"]); 
    
    let rows: any[][] = [];
    const resourceId = this.diagnosticApiService.resourceId;
    rows = detectorKeys.map(key => {
    
      let path = `${this.resourceId}/detectors/${key}`;
      // if (this.isCurrentUser) {
      path = path + "/edit";
      //}
      

     const name = key;
     //const name = `<a href="${path}">${key}</a>`
     const commitId = this.detectorReferencesList["detectorReferences"][key];
     let status = (this.gistCommitVersion == commitId) ? "Up to Date" : "Out of Date"; 
     if( this.gistCommitVersion == commitId){
      status = `<span class="success-color"><i class="fa fa-check-circle fa-lg"></i> Up to Date</span>`;
     }
     else{
      status = `<span class="warning-color"><i class="fa fa-times-circle fa-lg"></i> Out of Date</span>`;
     }
     
      return [name, status, commitId, ""];
    });


    this.detectorReferencesTable = this.generateDetectorReferenceTable(rows); 
   }); 
   

}



displayUpdateDetectorResults(){
  //debugger; 
  Object.keys(this.detectorCompilationList).forEach( el => {
  if( this.detectorCompilationList[el]){
    console.log(`${el} ========== Build: 1 succeeded, 0 failed ==========`); 
  }
  else{
    console.log(`${el} ========== Build: 1 succeeded, 0 failed ==========`); 
  }
})

  var detectorKeys = Object.keys(this.detectorReferencesList["detectorReferences"]); 

  let rows: any[][] = [];
  
  rows = detectorKeys.map(key => {

  let path = `${this.resourceId}/detectors/${key}`;
  path = path + "/edit";
  let miscKey = ""; 
  const name = key;
  const commitId = this.detectorReferencesList["detectorReferences"][key];
  let misc = ""; 
  let status = (this.gistCommitVersion == commitId) ? "Up to Date" : "Out of Date"; 

  if( this.gistCommitVersion == commitId){
  status = `<markdown><span class="success-color"><i class="fa fa-check-circle fa-lg"></i> Up to Date</span></markdown>`;
  }
  else{
  status = `<markdown><span class="warning-color"><i class="fa fa-times-circle fa-lg"></i> Out of Date</span></markdown>`;
  }
  if(this.errorDetectorsList.has(key)){
  status = `<markdown><span class="critical-color"><i class="fa fa-times-circle fa-lg"></i> ERROR</span></markdown>`;
  console.log(this.errorDetectorsList.get(key)); 
  miscKey = this.errorDetectorsList.get(key).toString(); 
  misc = `<a href="${path}">${miscKey}</a>`
  }
  else if( this.detectorsToUpdate.has(key) && this.updateDetectorSuccess){
  misc = `<a href="${this.PRLink}">PR LINK</a>`
  }
  
  
  return [name, status, commitId, misc];
  });


  this.detectorReferencesTable = this.generateDetectorReferenceTable(rows); 
  this.detectorCompilationList = {}; 
  this.detectorsToCheck.clear(); 
  this.updatedDetectors = {}; 
  this.detectorsToUpdate.clear(); 
  this.updateDetectorSuccess = false; 
  this.errorDetectorsList.clear(); 



}


generateDetectorReferenceTable(rows: any[][]){
  //debugger; 

  console.log("hello"); 

    
  const columns: DataTableResponseColumn[] = [
    { columnName: "Name" },
    { columnName: "Status" },
    { columnName: "Commit Id" },
    { columnName: "Miscellaneous" }
  ];

  const dataTableObject: DataTableResponseObject = {
    columns: columns,
    rows: rows
  }

  

  console.log("finished generateDetectorReferenceTable method"); 
  console.log(dataTableObject); 
  return dataTableObject;



}


generateProgressDetectorReferenceTable(){
  
  //debugger; 
  const columns: DataTableResponseColumn[] = [
    { columnName: "Name" },
    { columnName: "Status" },
    { columnName: "Commit Id" },
    { columnName: "Miscellaneous" }
  ];

  let rows : any[][] = []; 

  var detectorKeys = Object.keys(this.detectorReferencesList["detectorReferences"]); 

  rows = detectorKeys.map(key =>{
    //debugger; 
  const name = key; 

  let path = `${this.resourceId}/detectors/${key}`;
  
  path = path + "/edit";
  
  let miscKey = ""; 

  const commitId = this.detectorReferencesList["detectorReferences"][key];
  let status = "";
  let misc = "";  
  if(this.detectorsToCheck.has(key)){
    status = `<span class="info-color"><i class="fa fa-refresh fa-spin fa-lg fa-fw"></i> Updating</span>`;
  }
  else if(this.errorDetectorsList.has(key)){
    status = `<span class="critical-color"><i class="fa fa-times-circle fa-lg"></i> ERROR </span>`;
    console.log(this.errorDetectorsList.get(key)); 
    miscKey = this.errorDetectorsList.get(key).toString(); 
    misc = `<a href="${path}">${miscKey}</a>`
    }
  else{
    status = this.detectorReferencesList["detectorReferences"][key] == this.gistCommitVersion ? 
      `<span class="success-color"><i class="fa fa-check-circle fa-lg"></i> Up to Date</span>`:
      `<span class="warning-color"><i class="fa fa-times-circle fa-lg"></i> Out of Date</span>`;
  }
  

  return [name, status, commitId, misc];

    
  });


  const dataTableObject: DataTableResponseObject = {
    columns: columns,
    rows: rows
  }
  console.log("finished generateDetectorReferenceTable method"); 
  console.log(dataTableObject); 
  return dataTableObject;

}

getGistCommitContent = (gistId, gistCommitVersion) => {
  return this.diagnosticApiService.getDevopsCommitContent(`${this.DevopsConfig.folderPath}/${gistId}/${gistId}.csx`, gistCommitVersion, this.resourceId);   
};


serializeQueryParams(obj) {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p) && obj[p] !== undefined) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}




}
