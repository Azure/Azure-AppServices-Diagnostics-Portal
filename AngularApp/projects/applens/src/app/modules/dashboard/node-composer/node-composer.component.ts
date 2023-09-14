import { Moment } from 'moment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DetectorControlService, DetectorMetaData, RenderingType, ResponseTokensSize, TextModels } from 'diagnostic-data';
import { IBasePickerProps, ITagPickerProps, ITagItemProps, ISuggestionModel, ITag, TagItem, IButtonStyles, IChoiceGroupOption, IDialogContentProps, IDialogProps, IDropdownOption, IDropdownProps, IIconProps, IPanelProps, IPersona, IPersonaProps, IPickerItemProps, IPivotProps, ITextFieldProps, MessageBarType, PanelType, SelectableOptionMenuItemType, TagItemSuggestion, IDropdown, ICalloutProps, ICheckboxStyleProps, ICheckboxProps, PivotItem, List, IPivotItemProps } from 'office-ui-fabric-react';
import { KeyValuePair } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
import { Observable, of } from 'rxjs';
import { ApplensGlobal } from '../../../applens-global';
import { ComposerNodeModel, ITPromptSuggestionModel, NoCodeSupportedRenderingTypes } from '../models/detector-designer-models/node-models';
import { DevelopMode } from '../onboarding-flow/onboarding-flow.component';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';
import * as momentNs from 'moment';
import { CreateTextCompletionModel } from 'diagnostic-data';
import { ApplensOpenAIChatService } from '../../../shared/services/applens-openai-chat.service';
import { ResourceService } from '../../../shared/services/resource.service';
import { dynamicExpressionBody, kustoQueryDialogParams } from '../workflow/models/kusto';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoCodeSupportedDataSourceTypes, NoCodeExpressionBody, NodeSettings, NoCodeTableRenderingProperties, NoCodeGraphRenderingProperties, NoCodeInsightRenderingProperties, NoCodeMarkdownRenderingProperties, nodeJson, NoCodeExpressionResponse } from '../../../../../../diagnostic-data/src/lib/models/node-rendering-json-models';
import { toUnicode } from 'punycode';
import { get } from 'http';
const moment = momentNs;

@Component({
  selector: 'node-composer',
  templateUrl: './node-composer.component.html',
  styleUrls: ['./node-composer.component.scss']
})

export class NodeComposerComponent implements OnInit, OnDestroy {
  
  RenderingType = RenderingType;
  
  @Input() mode: DevelopMode = DevelopMode.Create;  
  @Input() nodeModel: ComposerNodeModel;
  @Output() nodeModelChange = new EventEmitter<ComposerNodeModel>();
  @Output() onNodeModelChange = new EventEmitter<INodeModelChangeEventProps>();
  @Output() onDuplicateClick = new EventEmitter<ComposerNodeModel>();
  @Output() onDeleteClick = new EventEmitter<ComposerNodeModel>();
  @Input() isNodeValid: () => void;
  nodeStatus: string = '';

  private readonly TPROMPT_SUGGESTIONS_ENABLED:boolean = false;
  startTime: Moment;
  endTime: Moment;
  templatized: boolean = false;
  resourceId: string;
  kustoQueryLabel: string = '';
  inputKustoQueryDialogParams: kustoQueryDialogParams;
  dRenderingSettings: any = {};
  noCodeExpression: NoCodeExpressionBody= new NoCodeExpressionBody;
  executionState = executionState;
  state: executionState = this.executionState.default;
  errorMessage: string = 'test error message';
  runButtonDisabled: boolean = false;
  detectorLoading: boolean = false;

  defaultKustoCluster: string = '';
  defaultKustoDatabase: string = '';
  dataSourceRequired: boolean = false;

  isMicrosoftWeb: boolean = false;

  microsoftWebPrompt: string = `input: for an app named nmallick1

  StatsDWASWorkerProcessTenMinuteTable
  | where TIMESTAMP >= datetime('2023-03-15 00:00:00') and TIMESTAMP <= datetime('2023-03-16 00:00:00')  and EventPrimaryStampName == 'SomeStampName'
  | where ApplicationPool startswith 'nmallick1_' or ApplicationPool == 'nmallick1'
  | summarize by RoleInstance, Tenant, EventPrimaryStampName
  | join kind = inner (RoleInstanceHeartbeat
      | where PreciseTimeStamp >= datetime('2023-03-15 00:00:00') and PreciseTimeStamp <= datetime('2023-03-16 00:00:00') and EventPrimaryStampName == 'SomeStampName'
      | summarize take_any(MachineName), IP = take_any(Details) by RoleInstance, Tenant
      ) on RoleInstance, Tenant
  | project RoleInstance, Tenant, MachineName, IP
  
  output:
  StatsDWASWorkerProcessTenMinuteTable
  
  | where {Utilities.TimeAndTenantFilterQuery(cxt.StartTime, cxt.EndTime, cxt.Resource, "TIMESTAMP")}
  | where ApplicationPool startswith '{cxt.Resource.Name}_' or ApplicationPool == '{cxt.Resource.Name}'
  | summarize by RoleInstance, Tenant, EventPrimaryStampName
  | join kind = inner (RoleInstanceHeartbeat
      | where {Utilities.TimeAndTenantFilterQuery(cxt.StartTime, cxt.EndTime, "PreciseTimeStamp")}
      | summarize take_any(MachineName), IP = take_any(Details) by RoleInstance, Tenant
      ) on RoleInstance, Tenant
  | project RoleInstance, Tenant, MachineName, IP
  
  input: for an app named todoapiv420210108090805
  AntaresIISLogFrontEndTable | where PreciseTimeStamp >= datetime('2023-02-02 00:00:00') and PreciseTimeStamp <= datetime('2023-02-04 00:00:00')
      | where Cs_host in~ ("todoapiv420210108090805.azurewebsites.net","todoapiv420210108090805.azurewebsites.net:80","todoapiv420210108090805.azurewebsites.net:443")
      | where User_agent == 'AlwaysOn'
      | where Sc_status != 200
      | summarize count() by Sc_status
      | order by Sc_status asc
  
  output:
  AntaresIISLogFrontEndTable
  | where {Utilities.TimeAndTenantFilterQuery(cxt.StartTime, cxt.EndTime, cxt.Resource, "PreciseTimeStamp")}
  | where {Utilities.HostNamesFilterQuery(cxt.Resource.Hostnames)}
  | where User_agent == 'AlwaysOn'
  | where Sc_status != 200
  | summarize count() by Sc_status
  | order by Sc_status asc`

  // #region sample hardcoded data



  public sampleTestDataset:any =  [
    {
        "table": {
            "tableName": "",
            "columns": [
                {
                    "columnName": "Markdown",
                    "dataType": "String",
                    "columnType": null
                }
            ],
            "rows": [
                [
                    "<center><b><span style=\"color: red;\">Click the run button to see query results.</b></center></span>"
                ]
            ]
        },
        "renderingProperties": {
            "enableEmailButtons": false,
            "isContainerNeeded": true,
            "type": 9,
            "title": null,
            "description": null,
            "isVisible": true
        }
    }
];
// #endregion sample hardcoded data


  //#region Fabric element styles
  fabTextFieldStyleNoStretch: ITextFieldProps["styles"] = {
    field: {
      width: '300px'
    }
  };

  fabDropdownStyle: IDropdownProps["styles"] = {
    root: {
      display: 'flex',
      minWidth:'100px'
    },
    label: {
      paddingRight: '1em'
    },
    dropdownItem:{
      width:'200px'
    },
    errorMessage:{
      paddingLeft:'1em'
    },
    dropdown:{
      minWidth:'100px'
    }
  };

  pivotSelectedKey:string = '';

  pivotStyle: IPivotProps['styles'] = {
    root:{
      borderTop: '1px solid'
    }
  }
  //#endregion Fabric element styles

  renderingTypeOptions:IDropdownOption[] = [];

  //#region Monaco editor variables
    editorOptions: any;
    lightOptions: any;
    darkOptions: any;
    completionItemProviderDisposable: monaco.IDisposable = null;
  //#endregion Monaco editor variables

  public initMonacoEditorOptions(): void {
    this.lightOptions = {
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

    this.darkOptions = {
      theme: 'vs-dark',
      language: 'csharp',
      fontSize: 14,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      minimap: {
        enabled: false
      },
      folding: true
    };

    this.editorOptions = this.lightOptions;
  }

  public initComponent() {
   this.isMicrosoftWeb = this.resourceService.ArmResource.provider.toLowerCase() === 'microsoft.web' && this.resourceService.ArmResource.resourceTypeName.toLowerCase() === 'sites';

   this.nodeModel.validationObservable.subscribe( validationMessage => {
      this.nodeStatus = validationMessage;
      this.nodeModel.invalidReason = validationMessage;
   });

   this.getDefaultClusterParams();

    //Initialize rendering type options with only the supported entity types
    this.renderingTypeOptions = [];
    let index = 0;
    for (let supportedRenderingType in NoCodeSupportedRenderingTypes) {
      let displayText = RenderingType[supportedRenderingType];
      if(displayText == RenderingType[RenderingType.TimeSeries]) {
        displayText = 'Graph';
      }
      if(displayText == RenderingType[RenderingType.Insights]) {
        displayText = 'Insight';
      }
      this.renderingTypeOptions.push(<IDropdownOption>{
        key: Number(supportedRenderingType),
        text: displayText,
        selected: false,
        index: index++,
        itemType: SelectableOptionMenuItemType.Normal
      });
    }

    this.startTime = this._detectorControl.startTime;
    this.endTime = this._detectorControl.endTime;

    this.pivotSelectedKey = this.nodeModel.id + '_Query';

    this.initMonacoEditorOptions();
  }

  constructor(private _applensGlobal: ApplensGlobal, private _activatedRoute: ActivatedRoute, private _router: Router,
    private _detectorControl: DetectorControlService, public diagnosticApiService: ApplensDiagnosticService,private _httpClient: HttpClient, private _openAIService: ApplensOpenAIChatService,
    private resourceService: ResourceService, private _detectorControlService: DetectorControlService ) {
    this._applensGlobal.updateHeader('');
  }

  ngOnInit() {
    this.initComponent();
    this.resourceId = this.resourceService.getCurrentResourceId();
    this.nodeModel.settings.renderingSettings = new NoCodeTableRenderingProperties;
    this.nodeModelChange.emit(this.nodeModel);
  }

  ngOnDestroy(): void {
    if(!!this.completionItemProviderDisposable) {
      this.completionItemProviderDisposable.dispose();
    }
  }

  public checkIfNodeValid() {
    
    if (this.isNodeValid) {
      this.isNodeValid();
    }
    else {
      return '';
    }
  }

  public removeSpacesFromQueryName(event:any):void {
    this.nodeModel.queryName = this.nodeModel.queryName.replace(/(\b|_|-)\s?(\w)/g, (c) => {return c.replace(/[\s|_|-]/g, '').toUpperCase();} )
    this.nodeModelChange.emit(this.nodeModel);
    this.onNodeModelChange.emit({fieldChanged:'queryName', nodeModel:this.nodeModel});
    if(this.TPROMPT_SUGGESTIONS_ENABLED && this.nodeModel.editorRef && this.nodeModel.code.replace(/\s/g, '') == '' ) {
      this.nodeModel.editorRef.trigger('FetchCodeSample', 'editor.action.triggerSuggest', {additionaArguments: 'some more context'})
    }
  }

  public onRenderingTypeChange(event:any) {
    this.removeProjectStatement(this.getProjectStatement(this.nodeModel.renderingType));
    this.nodeModel.renderingType = event.option.key;
    this.setRenderingSettings(event.option.key);
    this.setProjectStatement(this.getProjectStatement(this.nodeModel.renderingType));
    this.nodeModelChange.emit(this.nodeModel);
    this.onNodeModelChange.emit({fieldChanged:'renderingType', nodeModel:this.nodeModel});
  }
  
  setRenderingSettings(type: NoCodeSupportedRenderingTypes){
    switch (type) {
      case RenderingType.Table:
        this.nodeModel.settings.renderingSettings = new NoCodeTableRenderingProperties;
        break;
      case RenderingType.TimeSeries:
        this.nodeModel.settings.renderingSettings = new NoCodeGraphRenderingProperties;
        break;
      case RenderingType.Insights:
        this.nodeModel.settings.renderingSettings = new NoCodeInsightRenderingProperties;
        break;
      case RenderingType.Markdown:
        this.nodeModel.settings.renderingSettings = new NoCodeMarkdownRenderingProperties;
        break;
      default:
        this.nodeModel.settings.renderingSettings = new NoCodeTableRenderingProperties;
        break;
    }
  }

  getProjectStatement(renderingType: NoCodeSupportedRenderingTypes){
    switch(renderingType){
      case RenderingType.Insights:
        return `| project Status, Message, Description, ['Recommended Action'], ['Customer Ready Content']`;
      case RenderingType.Markdown:
        return '| project Title, MarkdownString';
      default:
        return '';
    }
  }

  setProjectStatement(projectStatement: string){
    if(!this.nodeModel.code.toLowerCase().replace(/\s/g, "").endsWith(projectStatement.toLowerCase().replace(/\s/g, ""))){
      this.nodeModel.code = this.nodeModel.code.endsWith('\n') || this.nodeModel.code.endsWith('\r') ? this.nodeModel.code.concat(projectStatement) : this.nodeModel.code.concat('\r\n', projectStatement);
    }
  }

  removeProjectStatement(projectStatement: string){
    if(projectStatement != '' && this.nodeModel.code.toLowerCase().replace(/\s/g, "").endsWith(projectStatement.toLowerCase().replace(/\s/g, ""))){
      this.nodeModel.code = this.nodeModel.code.slice(0, this.nodeModel.code.lastIndexOf('|'));
    }
  }

  public changePivotSelectedTab(event:any) {
    this.pivotSelectedKey = (<PivotItem>event.item).props.itemKey;
  }

  public previewResults(event:any) {
    if (this.templatized){
      this.runButtonDisabled = true;
      this.state = this.executionState.running;
      this.sampleTestDataset = null;
      this.pivotSelectedKey = this.nodeModel.id + '_Result';
      this.noCodeExpression.OperationName = this.nodeModel.queryName;
      this.noCodeExpression.Text = this.nodeModel.code;
      this.noCodeExpression.NodeSettings = this.nodeModel.settings;
      this.diagnosticApiService.evaluateNoCodeExpression(this.noCodeExpression, this._detectorControlService.startTimeString, this._detectorControlService.endTimeString).subscribe( x => {
        this.sampleTestDataset = x.res;
        this.state = this.executionState.success;
        this.runButtonDisabled = false;
      },
      error => {
        this.state = this.executionState.failure;
        this.errorMessage = error.error;
        this.runButtonDisabled = false;
        });
    }
    else {
      this.templatized = true;
      this.templatizeQuery(event);
    }
  }

  public setResult(res: NoCodeExpressionResponse) {
    this.sampleTestDataset = res.res;
  }

  buildRenderingProps(){
    return {
      "type": this.nodeModel.renderingType,
      "title": "Sample Table",
      "description": "Some description here",
      "isVisible": true,
      "graphType": 0
    }
  }
  rsc(event: any){
    this.nodeModel.settings = event.instance;
    if (this.dataSourceRequired) {
      this.nodeModel.hasDataSource = event.instance.dataSourceSettings.isValid();
    }
    this.checkIfNodeValid();
  }

  writeDatasetJson(response){ 
    let renderingProps = this.buildRenderingProps();
    return {
      "table": response,
      "renderingProperties": renderingProps
    }
  }

  public writeNodeJson(){
    let node: nodeJson = {
      queryName: this.nodeModel.queryName,
      nodeExpression: this.noCodeExpression
    };
    return node;
  }

  public duplicateNode(event:any) {
    this.onDuplicateClick.emit(this.nodeModel);
  }

  public deleteNode(event:any) {
    this.onDeleteClick.emit(this.nodeModel);
  }

  public unescapeCodeString(escapedCodeString:string):string {
    if(!escapedCodeString) {
      return '';
    }
    escapedCodeString = escapedCodeString.replace(/\\r/g, '\r');
    escapedCodeString = escapedCodeString.replace(/\\n/g, '\n');
    escapedCodeString = escapedCodeString.replace(/\\t/g, '\t');
    escapedCodeString = escapedCodeString.replace(/\"/g, '"');
    escapedCodeString = escapedCodeString.replace(/\\/g, '');
    return escapedCodeString;
  }


  public getCodeSuggestionsFromTPrompt(): Observable<monaco.languages.CompletionList>
  {
    const queryName = this.nodeModel.queryName;
    return this.diagnosticApiService.getTPromptCodeSuggestions(queryName)
    .map<ITPromptSuggestionModel[], monaco.languages.CompletionList>((tPromptSuggestions:ITPromptSuggestionModel[]) => {
      return <monaco.languages.CompletionList>{
        suggestions: tPromptSuggestions.map<monaco.languages.CompletionItem>((suggestion:ITPromptSuggestionModel) => {
          return <monaco.languages.CompletionItem>{
            label: suggestion.queryName,
            kind: monaco.languages.CompletionItemKind.Text,
            insertText: this.unescapeCodeString(suggestion.codeText),
            documentation: `${suggestion.detectorName} (${suggestion.queryName})\r\n--------------------------------\r\n${suggestion.description}`,
            range: {
              startLineNumber:1,
              endLineNumber:1,
              startColumn:1,
              endColumn:1
            }
          }
        })
      };
    });
  }

  public setMocanoReference(editor:monaco.editor.ICodeEditor) {
    // Disable TPrompt integration for now. Will be enabled in future PRs
    if(this.TPROMPT_SUGGESTIONS_ENABLED) {
      const diagnosticApiService = this.diagnosticApiService;
      const _this = this;
      this.completionItemProviderDisposable = monaco.languages.registerCompletionItemProvider('csharp', {
        provideCompletionItems: function(model, position, completionContext, cancellationToken) {
          // This check will ensure that evem though the provider is registered at global level, it will return suggestions only for the editor of this component        
          if(model.id === editor.getModel().id) {
            return _this.getCodeSuggestionsFromTPrompt().toPromise();
          }
          else {
            return Promise.resolve({
              suggestions:[]
            });
          }
        }
      });
    }

    this.nodeModel.editorRef = editor;
  }

  private templatizeQuery(event = null){
    this.isMicrosoftWeb = true;
    let appName = 'todoapiv420210108090805';
    let prompt = this.isMicrosoftWeb ? CreateTextCompletionModel(`${this.microsoftWebPrompt}\n\nfor an app named ${appName}\n\n${this.nodeModel.code}\n\noutput:\n`, TextModels.Default, ResponseTokensSize.Large) : CreateTextCompletionModel(`prompt2`);
    
    this._openAIService.generateTextCompletion(prompt, null, true).subscribe(template => {
      this.nodeModel.code = template.text;
      this.previewResults(event);
    });
  }

  private getDefaultClusterParams() {
    this.dataSourceRequired = !this.isMicrosoftWeb && !(this.defaultKustoCluster && this.defaultKustoDatabase)
    this.diagnosticApiService.getKustoMappings().subscribe(clusterParams => {
      if (clusterParams && clusterParams.length > 0 && clusterParams[0].publicDatabaseName && clusterParams[0].publicClusterName) {
        this.defaultKustoCluster = clusterParams[0].publicClusterName;
        this.defaultKustoDatabase = clusterParams[0].publicDatabaseName;
        this.nodeModel.hasDataSource = true;
      }
      else {
        this.nodeModel.hasDataSource = false;
      }
      this.checkIfNodeValid();
    },
    error => {
      this.nodeModel.hasDataSource = false;
      this.checkIfNodeValid();
    });
  }

  onChangeQueryName(event:any) {
    this.nodeModel.queryName = event.newValue;
    this.checkIfNodeValid();
  }
}

export interface INodeModelChangeEventProps {
  fieldChanged:string;
  nodeModel:ComposerNodeModel;
}

export enum executionState {
  default = 0,
  success = 1,
  failure = 2,
  running = 3
}