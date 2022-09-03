import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApplensGlobal } from '../../../applens-global';
import { DiagnosticApiService } from '../../../shared/services/diagnostic-api.service';
import { applensDocs } from '../../../shared/utilities/applens-docs-constant';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';

@Component({
  selector: 'applens-docs',
  templateUrl: './applens-docs.component.html',
  styleUrls: ['./applens-docs.component.scss']
})
export class ApplensDocsComponent implements OnInit {
  applensDocs = applensDocs;
  constructor(private _applensGlobal:ApplensGlobal, private diagnosticApiService: ApplensDiagnosticService, private ref: ChangeDetectorRef, private _activatedRoute: ActivatedRoute, private _diagnosticApi: DiagnosticApiService) { }
  
  markdownCode = [];
  folders = []

  codeRegEx = new RegExp("<applens-code.*?\/>","g");
  folderRegEx = new RegExp("(?<=folder=\").*?(?=\")", "g");

  htmlToAdd = "";
  fileNames: string[][] = [];

  category: string;
  doc: string;

  files:any[][] = [];

  docsRepoRoot: string = `AppLensDocumentation`;
  docsBranch = null;
  docsResource: string = `AppServiceDiagnostics`
  docStagingBranch: string = 'DocumentationStagingBranch';
  
  ngOnInit() {
      this._applensGlobal.updateHeader("");
      this._activatedRoute.paramMap.subscribe(params => {
        this.category = params.get('category');
        this.doc = params.get('doc');
        this._diagnosticApi.isStaging().subscribe(isStaging => {
          if (isStaging){this.docsBranch = this.docStagingBranch;}
          this.diagnosticApiService.getDetectorCode(`${this.docsRepoRoot}/${this.category}/${this.doc}/${this.doc}`, this.docsBranch, this.docsResource).subscribe(x=>{
            this.markdownCode = x.split(this.codeRegEx);
            this.folders = this.getCodeFolders(x);
            this.folders.forEach(f => {
              this.getFiles(f);
            });
          });
        });
      });
  }
  getCodeFolders(markdown: string){
    
    var folders = [];

    markdown.match(this.codeRegEx).forEach(x => {
      folders.push(x.match(this.folderRegEx)[0]);
    });

    return folders;
  }
  getFiles(folderName: string){
    let fileIndex = this.files.length;
    this.files.push([]);
    this.diagnosticApiService.getDetectorCode(`${this.docsRepoRoot}/${this.category}/${this.doc}/${folderName}/content`, this.docsBranch, this.docsResource).subscribe(names => {
      this.fileNames[fileIndex] = names.split('\n');
      let getFileObservables = [];
      this.fileNames[fileIndex].forEach(f => {
        getFileObservables.push(this.diagnosticApiService.getDetectorCode(`${this.docsRepoRoot}/${this.category}/${this.doc}/${folderName}/${f.replace(/\s/g,"")}`, this.docsBranch, this.docsResource)); 
      });
      forkJoin(getFileObservables).subscribe(fileContent => {
        this.files[fileIndex] = fileContent;
      });
    });
  }
}
