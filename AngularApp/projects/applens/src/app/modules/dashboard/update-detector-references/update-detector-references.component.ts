import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot, CanDeactivate, Params, Router, RouterStateSnapshot } from "@angular/router";
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import {
  CompilationProperties, DetectorControlService, DetectorResponse, HealthStatus, QueryResponse, CompilationTraceOutputDetails, LocationSpan, Position, GenericThemeService, StringUtilities, TableColumnOption, TableFilterSelectionOption, DataTableResponseObject, DataTableResponseColumn, FabDataTableComponent, TelemetryService, TelemetryEventNames
} from 'diagnostic-data';
import { forkJoin } from 'rxjs';
import { DevopsConfig } from '../../../shared/models/devopsConfig';
import { UriUtilities } from 'diagnostic-data';

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

  constructor( private diagnosticApiService: ApplensDiagnosticService, private _diagnosticApi: DiagnosticApiService, private _activatedRoute: ActivatedRoute, 
    private _telemetryService: TelemetryService) { }

 
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
  @Input() defaultBranch : string;
  @Input() owners: string[] = [];
  @Input() DevopsConfig: DevopsConfig;
  @Input() detectorReferencesDialogHidden : boolean = true; 
  @Input() detectorReferencesList : any[] = []; 

  DevelopMode = DevelopMode;
  HealthStatus = HealthStatus; 

  detectorsToCheck: Set<any> = new Set();  
  detectorsToUpdate: Map<string, any> = new Map(); 
  errorDetectorsList : Map<string, any> = new Map(); 
  updateDetectorSuccess : boolean = false; 
  updateDetectorFailed : boolean = false; 
  gistCommitVersion : string = ""; 
  detectorReferencesTable : DataTableResponseObject = null; 
  PRLink : string = "";
  submittedPanelTimer: any = null;
  panelText : string = "Error pushing changes to branch. Unable to update selected detectors"; 


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

    this._telemetryService.logEvent(TelemetryEventNames.SuperGistUpdateSelectedButtonClicked, {
      ResourceID: this.resourceId,
      ID: this.id,
    });
    
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
        tempReference = JSON.parse(res[1])['dependencies'] || {}; 
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
      
          forkJoin(requestsArr).subscribe( resArr => {
            tempReferenceList = resArr; 
            let refDict = {}; 

            for(let i =0; i < tempReferenceKeys.length; i++){
              refDict[tempReferenceKeys[i]] = resArr[i];
              
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
                let serializedParams = UriUtilities.serializeQueryParams(queryParams);
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
                  //if compilation AND runtime succeeds, add into update list 
                  if (this.queryResponse.compilationOutput.compilationSucceeded === true && this.queryResponse.runtimeSucceeded === true) {
                   
                    this.detectorsToCheck.delete(detector.Name);
                    this.detectorsToUpdate.set(detector.Name, res[1]);
                  } 
                  //else it's a compilation error, do not update and add detector error into errors list 
                  else if(this.queryResponse.compilationOutput.compilationSucceeded === false){
                    this.detectorsToCheck.delete(detector.Name); 
                    this.errorDetectorsList.set(detector.Name, this.queryResponse.compilationOutput.compilationTraces);
                  }
                  // if there was a runtime error, add into errors list. update the detector 
                  //error with runtime error 
                  else if(this.queryResponse.runtimeSucceeded === false){
                    if (this.queryResponse.runtimeLogOutput) {
                      this.queryResponse.runtimeLogOutput.forEach(element => {
                        if (element.exception) {
                          this.detectorsToCheck.delete(detector.Name); 
                          this.errorDetectorsList.set(detector.Name, `${element.timeStamp}: ${element.message}: ${element.exception.ClassName}: ${element.exception.Message}: ${element.exception.StackTraceString}`); 
                          
                        }
                      });
                    }
                  }

                  
                  //check if all detectors are done compiling /running
                  if(this.detectorsToCheck.size == 0){
                    this.updateDetectorPackageJsonAll(); 
                  }
                 
                  
                  }, err4 => { //error handling for getCompilerResponse 
                    this.detectorsToCheck.delete(detector.Name); 
                    this.errorDetectorsList.set(detector.Name, err4.message); 
                    
                    //check if all detectors are done compiling 
                    if(this.detectorsToCheck.size == 0){
                      this.updateDetectorPackageJsonAll(); 
                    }
                  });
              }, 
              err3 => { //error handling for activate query params 

                this.detectorsToCheck.delete(detector.Name); 
                this.errorDetectorsList.set(detector.Name, err3.message); 
                
                //check if all detectors are done compiling 
                if(this.detectorsToCheck.size == 0){
                  this.updateDetectorPackageJsonAll(); 
                }

              }
              ); 
      
              }, 
              err2 =>{ //error handling for inner forkjoin 

                this.detectorsToCheck.delete(detector.Name); 
                this.errorDetectorsList.set(detector.Name, err2.message); 
                
                //check if all detectors are done compiling 
                if(this.detectorsToCheck.size == 0){
                  this.updateDetectorPackageJsonAll(); 
                }

              }); 
          }, 
          err1 => { //error handling for outermost forkjoin 

            this.detectorsToCheck.delete(detector.Name); 
            this.errorDetectorsList.set(detector.Name, err1.message); 
            
            //check if all detectors are done compiling 
            if(this.detectorsToCheck.size == 0){
              this.updateDetectorPackageJsonAll(); 
            }

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
      this.updateDetectorFailed = true; 

    })
    

  }, err => {
    this.updateDetectorFailed = true; 
    this.displayUpdateDetectorResults(); 
    this._telemetryService.logException(err, "update-detector-references-component", {
      ResourceID: this.resourceId,
      ID: this.id,
    });

  }

  );
}


displayDetectorReferenceTable(){ 

    this.diagnosticApiService.getGistDetailsById(this.id).subscribe( data=>{ 

    this._telemetryService.logEvent(TelemetryEventNames.SuperGistAPILoaded, {
      ResourceID: this.resourceId,
      ID: this.id,
    });

    this.detectorReferencesList = data;
    this.gistCommitVersion = this.detectorReferencesList["currentCommitVersion"]; 
    
    var detectorKeys = Object.keys(this.detectorReferencesList["detectorReferences"]); 
    
    let rows: any[][] = [];
    const resourceId = this.diagnosticApiService.resourceId;
    rows = detectorKeys.map(key => {
    
      let path = `${this.resourceId}/detectors/${key}`;
      path = path + "/edit";

     const name = key;
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
  miscKey = this.errorDetectorsList.get(key).toString(); 
  misc = `<a href="${path}" target="_blank">${miscKey}</a>`
  }
  else if( this.detectorsToUpdate.has(key) && this.updateDetectorSuccess){
  misc = `<a href="${this.PRLink}" target="_blank">PR LINK</a>`
  }


  return [name, status, commitId, misc];
  });


  this.detectorReferencesTable = this.generateDetectorReferenceTable(rows); 
  this.detectorsToCheck.clear(); 
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

  const columns: DataTableResponseColumn[] = [
    { columnName: "Name" },
    { columnName: "Status" },
    { columnName: "Commit Id" },
    { columnName: "Miscellaneous" }
  ];

  let rows : any[][] = []; 

  var detectorKeys = Object.keys(this.detectorReferencesList["detectorReferences"]); 

  rows = detectorKeys.map(key =>{
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
    miscKey = this.errorDetectorsList.get(key).toString(); 
    misc = `<a href="${path}" target="_blank">${miscKey}</a>`
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



onOpenUpdateFailedPanel() {
  this.submittedPanelTimer = setTimeout(() => {
    this.dismissUpdateHandler();
  }, 5000);
}

dismissUpdateHandler() {
  this.updateDetectorFailed = false; 
}



}
