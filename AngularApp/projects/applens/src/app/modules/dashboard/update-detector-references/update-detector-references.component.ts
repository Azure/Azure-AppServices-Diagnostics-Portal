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

 
  @Input() id: string; //gist id 
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
  @Input() detectorReferencesList : any[] = []; 



  DevelopMode = DevelopMode;



  detectorsToCheck: Set<any> = new Set();  
  detectorsToUpdate: Map<string, any> = new Map(); 
  errorDetectorsList : Map<string, any> = new Map(); 
  updateDetectorSuccess : boolean = false; 
  gistCommitVersion : string = ""; 
  updatedDetectors : object= {};
  detectorReferencesTable : DataTableResponseObject = null; 




  ngOnInit(): void {

    this._activatedRoute.params.subscribe((params: Params) => {
      if (params.hasOwnProperty('gist')) {

        this.id = params['gist']; 
        this.displayDetectorReferenceTable(); 
   }
    });

  }


  ngAfterViewInit() {
  }
  
  
  
  updateDetectorReferences(detectorReferences : any[]) {
    
    detectorReferences.forEach( key => {
      this.detectorsToCheck.add(key.Name); 
    })
   
    this.detectorReferencesTable = this.generateProgressDetectorReferenceTable(); 

    detectorReferences.forEach( detector =>{
      this.checkCompilation(detector, detectorReferences.length); 
    }); 
    

  }

  private checkCompilation(detector : any, num: number) {

    //if detector is already up to date, do not update 
    if( this.detectorReferencesList["detectorReferences"][detector.Name] == this.gistCommitVersion){
      this.detectorsToCheck.delete(detector.Name); 
      if(this.detectorsToCheck.size == 0){
        this.updateDetectorPackageJsonAll(); 
      }
      return; 
    }

    else{

      let tempCode; 
      let tempReference; 
      let tempReferenceList = []; 
      let tempUtterances; 
      var body;

      

      let code = this.diagnosticApiService.getDetectorCode(`${detector.Name}/${detector.Name}.csx`, this.Branch, this.resourceId);
      let utterances = this.diagnosticApiService.getDetectorCode(`${detector.Name}/metadata.json`, this.Branch, this.resourceId); 
      let reference = this.diagnosticApiService.getDetectorCode(`${detector.Name}/package.json`, this.Branch, this.resourceId); 

      forkJoin([code, reference, utterances]).subscribe( res =>{

        tempCode = res[0]; 
        tempReference = JSON.parse(res[1])['dependencies'] || {}; // 
        tempUtterances = JSON.parse(res[2]).utterances; 

        let tempReferenceKeys = Object.keys(tempReference); 
        let requestsArr = []; 

        tempReferenceKeys.forEach(el => {
          if( el == this.id){
            requestsArr.push(this.getGistCommitContent(el, this.gistCommitVersion)); 
          }
          else{
            requestsArr.push(this.getGistCommitContent(el,tempReference[el])); 
          }
      });
      
          forkJoin(requestsArr).subscribe( res2 => {
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

            this._activatedRoute.queryParams.subscribe((params: Params) => {

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

                    this.queryResponse = response.body;
              //if compilation succeeds, update 
                  if (this.queryResponse.compilationOutput.compilationSucceeded === true) {
                   
                    this.detectorsToCheck.delete(detector.Name);
                    this.detectorsToUpdate.set(detector.Name, res[1]);
                    if(this.detectorsToCheck.size == 0){
                      this.updateDetectorPackageJsonAll(); 
                    }
                  
                  } 
                  //else do not update and add into errors list 
                  else {
                     
                    this.updatedDetectors[detector.Name] == false; 
                    this.detectorsToCheck.delete(detector.Name); 
                    this.errorDetectorsList.set(detector.Name, this.queryResponse.compilationOutput.compilationTraces);
                    
                    //check if all detectors are done compiling 
                    if(this.detectorsToCheck.size == 0){
                      this.updateDetectorPackageJsonAll(); 
                    }
                 
                  }
                  if (this.queryResponse.runtimeLogOutput) {
                    this.queryResponse.runtimeLogOutput.forEach(element => {
                      if (element.exception) {
              
                        console.log(`${element.timeStamp}: ${element.message}: 
                        ${element.exception.ClassName}: ${element.exception.Message}: ${element.exception.StackTraceString}`);
                      
                        }
                      });
                      }
                  
                  }, err => {
                    
                    this.updatedDetectors[detector.Name] = false; 
                    this.detectorsToCheck.delete(detector.Name); 
                    this.errorDetectorsList.set(detector.Name, err); 
                    
                    //check if all detectors are done compiling 
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
 
  var requestBranch = `dev/${this.userName.split("@")[0]}/gist/${this.id.toLowerCase()}`; 
  if(this.useAutoMergeText){
    requestBranch = this.Branch; 
  }
    
  const DetectorObservable = this.diagnosticApiService.pushDetectorChanges(requestBranch, gradPublishFiles, gradPublishFileTitles, `${commitMessageStart} ${this.id} Detector References Author : ${this.userName}`, 
  commitType, this.resourceId); 
  const makePullRequestObservable = this.diagnosticApiService.makePullRequest(requestBranch, this.defaultBranch, `Changing ${this.id} detector references`, this.resourceId, this.owners, "temp description");

  
  DetectorObservable.subscribe(_ => {

    makePullRequestObservable.finally( () => {
      this.displayUpdateDetectorResults(); 
    }).subscribe( _ => {
      this.PRLink = `${_["webUrl"]}/pullrequest/${_["prId"]}`;
      this.updateDetectorSuccess = true; 

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


displayDetectorReferenceTable(){ 

    this.diagnosticApiService.getGistId(this.id).subscribe( data=>{ 
    this.detectorReferencesList = data;
    this.gistCommitVersion = this.detectorReferencesList["currentCommitVersion"]; 
    
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
  //console.log(this.errorDetectorsList.get(key)); 
  miscKey = this.errorDetectorsList.get(key).toString(); 
  misc = `<a href="${path}">${miscKey}</a>`
  }
  else if( this.detectorsToUpdate.has(key) && this.updateDetectorSuccess){
  misc = `<a href="${this.PRLink}">PR LINK</a>`
  }


  return [name, status, commitId, misc];
  });


  this.detectorReferencesTable = this.generateDetectorReferenceTable(rows); 
  this.detectorsToCheck.clear(); 
  this.updatedDetectors = {}; 
  this.detectorsToUpdate.clear(); 
  this.updateDetectorSuccess = false; 
  this.errorDetectorsList.clear(); 



}


generateDetectorReferenceTable(rows: any[][]){
  
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
    //console.log(this.errorDetectorsList.get(key)); 
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
