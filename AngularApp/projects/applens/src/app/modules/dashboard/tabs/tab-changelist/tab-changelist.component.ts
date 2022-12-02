import { Component, OnInit } from '@angular/core';
import { DiffEditorModel } from 'ngx-monaco-editor';
import { GithubApiService } from '../../../../shared/services/github-api.service';
import { Commit } from 'projects/applens/src/app/shared/models/commit';
import { ActivatedRoute } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { flatMap, map } from 'rxjs/operators';

@Component({
  selector: 'tab-detector-changelist',
  templateUrl: './tab-changelist.component.html',
  styleUrls: ['./tab-changelist.component.scss']
})
export class TabChangelistComponent implements OnInit {
  selectedCommit: Commit;
  code: string;
  loadingChange: number = 0;
  noCommitsHistory: boolean = false;
  id: string;
  commitsList: Commit[] = [];
  previousSha: string;
  previousCode: string;
  currentSha: string;
  currentCode: string;
  files: object = {};
  selectedFile: string;
  fileNames: string[];

  constructor(
    private _route: ActivatedRoute,
    private githubService: GithubApiService
  ) {}
  setCodeDiffView(commit: Commit, filePath: string) {
    // Because monaco editor instance is not able to show the code content change dynamically, we have to wait for the API calls of getting file content
    //  of the previous commit and current commit to complete, before we can load the view.
    // This flag is used to determine whether we have got the result of both the two commits from github api already.
    // We will only show the monaco editor view when loadingChange >= 2
    this.loadingChange = 0;

    let last = of('');
    if (commit.previousSha !== '') {
      last = this.githubService.getCommitContentByFilePath(
        filePath,
        commit.previousSha
      );
    }

    let cur: Observable<string> = this.githubService.getCommitContentByFilePath(
      filePath,
      commit.sha
    );

    forkJoin(last, cur).subscribe((codes) => {
      this.loadingChange++;
      this.previousSha = commit.previousSha;
      this.previousCode = codes[0];
      this.originalModel = {
        code: codes[0],
        language: 'csharp'
      };

      this.loadingChange++;
      this.currentSha = commit.sha;
      this.currentCode = codes[1];

      this.modifiedModel = {
        code: codes[1],
        language: 'csharp'
      };
    });
  }

  onChange() {
    this.setCodeDiffView(this.selectedCommit, this.selectedFile);
  }

  ngOnInit() {
    this.id = Object.values(this._route.parent.snapshot.params)[0];

    this.githubService.getChangelist(this.id).subscribe((res) => {
      this.commitsList = res;
      if (res && res.length > 0) {
        let defaultCommit = res[res.length - 1];

        if (this._route.snapshot.params['sha'] !== undefined) {
          let cs = this.commitsList.filter(
            (c) => c.sha === this._route.snapshot.params['sha']
          );
          if (cs.length > 0) {
            defaultCommit = cs[0];
          }
        }

        this.initialize(defaultCommit);
      } else {
        this.noCommitsHistory = true;
      }
    });
  }

  private initialize(commit: Commit) {
    this.selectedCommit = commit;
    this.fileNames = commit.changedFiles;
    this.selectedFile = this.fileNames[0];
    this.setCodeDiffView(commit, this.selectedFile);
  }

  options = {
    theme: 'vs-dark',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false
    },
    folding: true
  };
  originalModel: DiffEditorModel;
  modifiedModel: DiffEditorModel;
}
