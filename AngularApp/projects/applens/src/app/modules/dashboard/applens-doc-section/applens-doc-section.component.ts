import { ICommandBarItemOptions } from '@angular-react/fabric';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { inputControlHeight } from '@uifabric/azure-themes/lib/azure/Constants';
import { IButtonStyles, ICommandBarItemProps, ICommandBarProps, IPivotProps } from 'office-ui-fabric-react';
import { CompilationProperties } from 'projects/diagnostic-data/src/lib/models/compilation-properties';
import { CompilationTraceOutputDetails, LocationSpan, Position, QueryResponse } from 'projects/diagnostic-data/src/lib/models/compiler-response';
import { DetectorResponse, HealthStatus } from 'projects/diagnostic-data/src/lib/models/detector';
import { DetectorControlService } from 'projects/diagnostic-data/src/lib/services/detector-control.service';
import { BehaviorSubject } from 'rxjs';
import { getConfigFileParsingDiagnostics } from 'typescript';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import * as momentNs from 'moment';

const moment = momentNs;

@Component({
  selector: 'applens-doc-section',
  templateUrl: './applens-doc-section.component.html',
  styleUrls: ['./applens-doc-section.component.scss']
})
export class ApplensDocSectionComponent implements OnInit {
  codeObservable: BehaviorSubject<string> = new BehaviorSubject("");

  @Input() files = [];
  @Input() fileNames = [];

  lightOptions = {
    theme: 'vs',
    language: 'csharp',
    fontSize: 14,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false
    },
    folding: true
  };

  editorOptions = this.lightOptions

  isMultipleSamples: boolean = false;

  commandbarStyle: ICommandBarProps['styles'] = {
    root: {
      backgroundColor: '#e6e6e6 !important',
      color: '#e6e6e6',
      height: '29px'
    },
    primarySet: {
      backgroundColor: '#e6e6e6 !important',
      color: '#e6e6e6',
      height: '29px'
    },
    secondarySet: {
      backgroundColor: '#e6e6e6 !important',
      color: '#e6e6e6',
      height: '29px'
    }
  }

  commandBarButtonStyle: IButtonStyles = {
    root: {
      backgroundColor: '#e6e6e6',
      padding: '0px'
    },
    flexContainer: {
      backgroundColor: '#e6e6e6',
      paddingRight: '8px'
    }
  }

  pivotStyle: IPivotProps['styles'] = {
    linkIsSelected: {
      selectors: {
        '::before': {
        bottom: '39px',
        height: '5px',
        left: '0px',
        right: '0px'
        }
      },
      backgroundColor: '#e6e6e6'
    }
  }

  runButtonDisabled: boolean = false;
  buildOutput: string[];
  detailedCompilationTraces: CompilationTraceOutputDetails[];
  reference: object = {};
  runButtonText = "Run";
  compilationPackage: CompilationProperties  = new CompilationProperties();
  queryResponse: QueryResponse<DetectorResponse>;
  public showDetailedCompilationTraces: boolean = true;
  runButtonStyle: IButtonStyles = {
    root: {
      cursor: 'default',
      backgroundColor: '#e6e6e6 !important'
    },
    rootDisabled: {
      pointerEvents: 'auto',
      cursor: "not-allowed",
      color: "grey",
      backgroundColor: '#e6e6e6 !important'
    }
  };
  runIcon: any = { iconName: 'Play' };
  private _monacoEditor: monaco.editor.ICodeEditor = null;
  errorState: any;
  startTime: momentNs.Moment = moment.utc().subtract(1, 'days')
  endTime: momentNs.Moment = moment.utc();
  
  

  constructor(private diagnosticApiService: ApplensDiagnosticService, private _activatedRoute: ActivatedRoute, private _detectorControlService: DetectorControlService) { }

  ngOnInit() {
  }

  ngOnChanges(){
  }
  
  copyCode(code){
    navigator.clipboard.writeText(code);
  }

  runCompilation(code: string) {
    this.queryResponse = undefined;
    if (this.runButtonDisabled) {
      return;
    }
    this.buildOutput = [];
    this.buildOutput.push("------ Build started ------");
    this.detailedCompilationTraces = [];
    this.detailedCompilationTraces.push({
      severity: HealthStatus.None,
      message: '------ Build started ------',
      location: {
        start: {
          linePos: 0,
          colPos: 0
        } as Position,
        end: {
          linePos: 0,
          colPos: 0
        } as Position
      } as LocationSpan
    } as CompilationTraceOutputDetails);
    let currentCode = code;

    var body = {
      script: code,
      references: this.reference,
      entityType: 'signal'
    };

    this.disableRunButton();
    this.runButtonText = "Running";

    let isSystemInvoker: boolean = false;

    this._activatedRoute.queryParams.subscribe((params: Params) => {
      let queryParams = JSON.parse(JSON.stringify(params));
      queryParams.startTime = undefined;
      queryParams.endTime = undefined;
      let serializedParams = this.serializeQueryParams(queryParams);
      if (serializedParams && serializedParams.length > 0) {
        serializedParams = "&" + serializedParams;
      };
      this.diagnosticApiService.getCompilerResponse(body, isSystemInvoker, "__documentation_sample__", this._detectorControlService.startTimeString,
        this._detectorControlService.endTimeString, '', '', {
        scriptETag: this.compilationPackage.scriptETag,
        assemblyName: this.compilationPackage.assemblyName,
        formQueryParams: serializedParams,
        getFullResponse: true
      }, "__documentation_sample__", true)
        .subscribe((response: any) => {
          this.queryResponse = response.body;
          
          this.enableRunButton();
          this.runButtonText = "Run";
          if (this.queryResponse.compilationOutput.compilationTraces) {
            this.queryResponse.compilationOutput.compilationTraces.forEach(element => {
              this.buildOutput.push(element);
            });
          }
          if (this.queryResponse.compilationOutput.detailedCompilationTraces) {
            this.showDetailedCompilationTraces = true;
            this.queryResponse.compilationOutput.detailedCompilationTraces.forEach(traceElement => {
              this.detailedCompilationTraces.push(traceElement);
            });
          }
          else {
            this.showDetailedCompilationTraces = false;
          }
          // If the script etag returned by the server does not match the previous script-etag, update the values in memory
          if (response.headers.get('diag-script-etag') != undefined && this.compilationPackage.scriptETag !== response.headers.get('diag-script-etag')) {
            this.compilationPackage.scriptETag = response.headers.get('diag-script-etag');
            this.compilationPackage.assemblyName = this.queryResponse.compilationOutput.assemblyName;
            this.compilationPackage.assemblyBytes = this.queryResponse.compilationOutput.assemblyBytes;
            this.compilationPackage.pdbBytes = this.queryResponse.compilationOutput.pdbBytes;
          }

          if (this.queryResponse.compilationOutput.compilationSucceeded === true) {
            this.buildOutput.push("========== Build: 1 succeeded, 0 failed ==========");
            this.detailedCompilationTraces.push({
              severity: HealthStatus.None,
              message: '========== Build: 1 succeeded, 0 failed ==========',
              location: {
                start: {
                  linePos: 0,
                  colPos: 0
                } as Position,
                end: {
                  linePos: 0,
                  colPos: 0
                } as Position
              } as LocationSpan
            } as CompilationTraceOutputDetails);
          } else {
            this.buildOutput.push("========== Build: 0 succeeded, 1 failed ==========");
            this.detailedCompilationTraces.push({
              severity: HealthStatus.None,
              message: '========== Build: 0 succeeded, 1 failed ==========',
              location: {
                start: {
                  linePos: 0,
                  colPos: 0
                } as Position,
                end: {
                  linePos: 0,
                  colPos: 0
                } as Position
              } as LocationSpan
            } as CompilationTraceOutputDetails);
          }

          if (this.queryResponse.runtimeLogOutput) {
            this.queryResponse.runtimeLogOutput.forEach(element => {
              if (element.exception) {
                this.buildOutput.push(element.timeStamp + ": " +
                  element.message + ": " +
                  element.exception.ClassName + ": " +
                  element.exception.Message + "\r\n" +
                  element.exception.StackTraceString);

                this.detailedCompilationTraces.push({
                  severity: HealthStatus.Critical,
                  message: `${element.timeStamp}: ${element.message}: ${element.exception.ClassName}: ${element.exception.Message}: ${element.exception.StackTraceString}`,
                  location: {
                    start: {
                      linePos: 0,
                      colPos: 0
                    },
                    end: {
                      linePos: 0,
                      colPos: 0
                    }
                  }
                });
              }
              else {
                this.buildOutput.push(element.timeStamp + ": " + element.message);
                this.detailedCompilationTraces.push({
                  severity: HealthStatus.Info,
                  message: `${element.timeStamp}: ${element.message}`,
                  location: {
                    start: {
                      linePos: 0,
                      colPos: 0
                    },
                    end: {
                      linePos: 0,
                      colPos: 0
                    }
                  }
                });
              }
            });
          }

        }, ((error: any) => {
          this.enableRunButton();
          this.runButtonText = "Run";
          this.buildOutput.push("Something went wrong during detector invocation.");
          this.buildOutput.push("========== Build: 0 succeeded, 1 failed ==========");
          this.detailedCompilationTraces.push({
            severity: HealthStatus.Critical,
            message: 'Something went wrong during detector invocation.',
            location: {
              start: {
                linePos: 0,
                colPos: 0
              },
              end: {
                linePos: 0,
                colPos: 0
              }
            }
          });
          this.detailedCompilationTraces.push({
            severity: HealthStatus.None,
            message: '========== Build: 0 succeeded, 1 failed ==========',
            location: {
              start: {
                linePos: 0,
                colPos: 0
              },
              end: {
                linePos: 0,
                colPos: 0
              }
            }
          });
        }));
    });
  }

  disableRunButton() {
    this.runButtonDisabled = true;
    this.runIcon = {
      iconName: 'Play',
      styles: {
        root: {
          color: 'grey'
        }
      }
    };
  }

  enableRunButton() {
    this.runButtonDisabled = false;
    this.runIcon = { iconName: 'Play' };
  }

  serializeQueryParams(obj) {
    var str = [];
    for (var p in obj)
      if (obj.hasOwnProperty(p) && obj[p] !== undefined) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
  }
}
