import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, ExtraOptions, NavigationEnd, Router, RouterModule } from '@angular/router';
import { inputControlHeight } from '@uifabric/azure-themes/lib/azure/Constants';
import { numberFormat } from 'highcharts';
import { resetControlledWarnings } from 'office-ui-fabric-react';
import { forkJoin } from 'rxjs';
import { ApplensGlobal } from '../../../applens-global';
import { DocumentationRepoSettings } from '../../../shared/models/documentationRepoSettings';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { applensDocs } from '../../../shared/utilities/applens-docs-constant';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import { ApplensDocumentationService } from '../services/applens-documentation.service';

export enum ComponentType {
  Markdown,
  CodeWindow,
  InPageLink
}

export enum DocumentMode {
  docsPage,
  examplesTab
}

@Component({
  selector: 'applens-docs',
  templateUrl: './applens-docs.component.html',
  styleUrls: ['./applens-docs.component.scss']
})

export class ApplensDocsComponent implements OnInit {
  @Input() mode: DocumentMode = DocumentMode.docsPage;
  @Input() category: string = "";
  @Input() doc: string = "";
  
  applensDocs = applensDocs;
  constructor(private _applensGlobal:ApplensGlobal, private diagnosticApiService: ApplensDiagnosticService, private ref: ChangeDetectorRef,
    private _activatedRoute: ActivatedRoute, private _diagnosticApi: DiagnosticApiService, private _router: Router, private _documentationService: ApplensDocumentationService) {
   }

  ComponentType = ComponentType;
  
  markdownCode = [];
  folders = [];
  images = [];
  inPageLinks = [];

  codeRegEx = new RegExp("<applens-code.*?\/>","g");
  folderRegEx = new RegExp("(?<=folder=\").*?(?=\")", "g");
  imageRegEx = new RegExp("(?<=image=\").*?(?=\")", "g");

  inPageLinkRegEx = new RegExp ("<inPageLink.*?\/>","g");
  inPageTargetRegEx = new RegExp ("(?<=target=\").*?(?=\")","g");
  inPageTextRegEx = new RegExp ("(?<=text=\").*?(?=\")","g");

  customTagRegEx = new RegExp("<applens-code.*?\/>|<inPageLink.*?\/>","g")

  fileNames: string[][] = [];

  

  files:any[][] = [];

  componentsList: {Type: Number, Component: Number}[] = [];

  documentationRepoSettings: DocumentationRepoSettings;
  docsBranch = null;
  
  ngOnInit() {
    this._applensGlobal.updateHeader("");
    this._activatedRoute.paramMap.subscribe(params => {
      this.reset();
      if (this.mode == DocumentMode.docsPage){
        this.category = params.get('category');
        this.doc = params.get('doc');
      }
      
      this.initialize();
    });
  }
  ngOnChanges(){
    this.reset();
    this.initialize();
  }
  initialize(){
    this._documentationService.getDocsRepoSettings().subscribe(settings => {
      this.documentationRepoSettings = settings;

      if (this.documentationRepoSettings.isStaging) { this.docsBranch = this.documentationRepoSettings.stagingBranch; }
      this.diagnosticApiService.getDetectorCode(`${this.documentationRepoSettings.root}/${this.category}/${this.doc}/${'index'}`, this.docsBranch, this.documentationRepoSettings.resourceId).subscribe(x => {
        this.populateComponentsList(x);
        this.markdownCode = x.split(this.customTagRegEx);
        this.folders = this.getCodeFolders(x);
        this.folders.forEach(f => {
          this.getFiles(f);
        });
        this.inPageLinks = this.getInPageLinks(x);
      });
    });
  }
  reset(){
    this.componentsList = [];
    this.files = [];
    this.fileNames = [];
    this.markdownCode = [];
    this.images = [];
  }
  getInPageLinks(source: string){
    let linkList = [];
    source.match(this.inPageLinkRegEx).forEach(link => {
      linkList.push({Text: link.match(this.inPageTextRegEx), Target: link.match(this.inPageTargetRegEx)});
    });
    return linkList;
  }
  populateComponentsList(source: string){
    let markdownList = source.split(this.customTagRegEx);
    let customTags = source.match(this.customTagRegEx);

    let sourceIndex = 0;
    let ctIndex = 0;
    let mdIndex = 0;

    let codeWindows = 0;
    let inPageLinks = 0;

    while(sourceIndex < source.length){
      if (!!customTags && !!customTags[ctIndex] && source.indexOf(customTags[ctIndex]) == sourceIndex){
        if (customTags[ctIndex].match(this.codeRegEx) != null)
          this.componentsList.push({Type: ComponentType.CodeWindow, Component: codeWindows++})// add code window
        else if (customTags[ctIndex].match(this.inPageLinkRegEx) != null)
          this.componentsList.push({Type: ComponentType.InPageLink, Component: inPageLinks++})// add inpage link
        sourceIndex += customTags[ctIndex].length;
        ctIndex += 1;
      }
      else if (!!markdownList && !!markdownList[mdIndex]) {
        this.componentsList.push({Type: ComponentType.Markdown, Component: mdIndex});
        sourceIndex += markdownList[mdIndex].length;
        mdIndex += 1;
      }
    }
  }
  getCodeFolders(markdown: string){
    
    var folders = [];

    markdown.match(this.codeRegEx).forEach(x => {
      folders.push(x.match(this.folderRegEx)[0]);
      var imageList = x.match(this.imageRegEx);
      this.images.push(!!imageList ? imageList[0] : "");
    });

    return folders;
  }
  getFiles(folderName: string){
    let fileIndex = this.files.length;
    this.files.push([]);
    this.fileNames.push([]);
    this.diagnosticApiService.getDevOpsTree(`${this.documentationRepoSettings.root}/${this.category}/${this.doc}/${folderName}`, this.docsBranch, this.documentationRepoSettings.resourceId).subscribe(names => {
      names.files.forEach(element => {
        this.fileNames[fileIndex].push(element.split('/').at(-1));
      });
      let getFileObservables = [];
      this.fileNames[fileIndex].forEach(f => {
        getFileObservables.push(this.diagnosticApiService.getDetectorCode(`${this.documentationRepoSettings.root}/${this.category}/${this.doc}/${folderName}/${f}`, this.docsBranch, this.documentationRepoSettings.resourceId)); 
      });
      forkJoin(getFileObservables).subscribe(fileContent => {
        this.files[fileIndex] = fileContent;
      });
    });
  }
  scrollToSection(section: string){
    document.getElementById(section).scrollIntoView();
  }
}
