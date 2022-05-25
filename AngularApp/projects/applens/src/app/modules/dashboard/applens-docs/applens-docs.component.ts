import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApplensGlobal } from '../../../applens-global';
import { applensDocs } from '../../../shared/utilities/applens-docs-constant';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';

@Component({
  selector: 'applens-docs',
  templateUrl: './applens-docs.component.html',
  styleUrls: ['./applens-docs.component.scss']
})
export class ApplensDocsComponent implements OnInit {
  applensDocs = applensDocs;
  constructor(private _applensGlobal:ApplensGlobal, private diagnosticApiService: ApplensDiagnosticService, private ref: ChangeDetectorRef) { }
  
  markdownCode = [];

  codeRegEx = new RegExp("<applens-code.*?\/>","g");
  folderRegEx = new RegExp("(?<=folder=\").*?(?=\")", "g");

  htmlToAdd = "";
  
  ngOnInit() {
      this._applensGlobal.updateHeader("");

      this.diagnosticApiService.getDetectorCode(`documentation/insight/insightmarkdown.txt`, "darreldonald/documentationTestBranch", "/subscriptions/00000000-0000-0000-0000-000000000000/resourceGroups/Fake-RG/providers/Microsoft.AzurePortal/sessions/adasdasdasdasd/").subscribe(x=>{
        this.markdownCode = x.split(this.codeRegEx);
        var folders = this.getCodeFolders(x);
        for(var i = 0; i < this.markdownCode.length; i++){
          this.htmlToAdd = this.htmlToAdd.concat(`<markdown ngPreserveWhitespaces [data]="markdownCode[${i}]"></markdown>\n`);
          if (i < folders.length)
          this.htmlToAdd = this.htmlToAdd.concat(`<p>folder name: ${folders[i]}</p>\n`);
        }
        // this.markdownCode.forEach(mdSection => {
        //   this.htmlToAdd = this.htmlToAdd.concat(`<markdown ngPreserveWhitespaces [data]="'${mdSection}'"></markdown>\n`);
        // });
        // folders.forEach(f => {
        //   this.htmlToAdd = this.htmlToAdd.concat(`<p>folder name: ${f}</p>\n`);
        // })
      });
  }
  getCodeFolders(markdown: string){
    
    var folders = [];

    markdown.match(this.codeRegEx).forEach(x => {
      folders.push(x.match(this.folderRegEx)[0]);
    });

    return folders;
  }
}