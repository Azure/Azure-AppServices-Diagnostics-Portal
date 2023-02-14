import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DetectorMetaData, RenderingType } from 'diagnostic-data';
import { IBasePickerProps, ITagPickerProps, ITagItemProps, ISuggestionModel, ITag, TagItem, IButtonStyles, IChoiceGroupOption, IDialogContentProps, IDialogProps, IDropdownOption, IDropdownProps, IIconProps, IPanelProps, IPersona, IPersonaProps, IPickerItemProps, IPivotProps, ITextFieldProps, MessageBarType, PanelType, SelectableOptionMenuItemType, TagItemSuggestion, IDropdown, ICalloutProps, ICheckboxStyleProps, ICheckboxProps } from 'office-ui-fabric-react';
import { KeyValuePair } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
import { Observable, of } from 'rxjs';
import { ApplensGlobal } from '../../../applens-global';
import { ComposerNodeModel, ITPromptSuggestionModel, NoCodeSupportedRenderingTypes } from '../models/detector-designer-models/node-models';
import { DevelopMode } from '../onboarding-flow/onboarding-flow.component';
import { ApplensDiagnosticService } from '../services/applens-diagnostic.service';

@Component({
  selector: 'node-composer',
  templateUrl: './node-composer.component.html',
  styleUrls: ['./node-composer.component.scss']
})

export class NodeComposer implements OnInit, OnDestroy {
  
  RenderingType = RenderingType;
  
  @Input() mode: DevelopMode = DevelopMode.Create;  
  @Input() nodeModel: ComposerNodeModel;
  @Output() nodeModelChange = new EventEmitter<ComposerNodeModel>();
  @Output() onNodeModelChange = new EventEmitter<INodeModelChangeEventProps>();
  @Output() onDuplicateClick = new EventEmitter<ComposerNodeModel>();
  @Output() onDeleteClick = new EventEmitter<ComposerNodeModel>();

  private readonly TPROMPT_SUGGESTIONS_ENABLED:boolean = false;

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

    this.initMonacoEditorOptions();
  }

  constructor(private _applensGlobal: ApplensGlobal, private _activatedRoute: ActivatedRoute, private _router: Router, public diagnosticApiService: ApplensDiagnosticService,private _httpClient: HttpClient ) {
    this._applensGlobal.updateHeader('');    
  }

  ngOnInit() {
    this.initComponent();
  }

  ngOnDestroy(): void {
    if(!!this.completionItemProviderDisposable) {
      this.completionItemProviderDisposable.dispose();
    }
  }

  public getRequiredErrorMessageOnTextField(value: string): string {
    if (!value) {
      return ' Value cannot be empty';
    };
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
    //let key:string = event.option.key.toString();
    this.nodeModel.renderingType = event.option.key;
    this.nodeModelChange.emit(this.nodeModel);
    this.onNodeModelChange.emit({fieldChanged:'renderingType', nodeModel:this.nodeModel});
  }

  public previewResults(event:any) {
    console.log('Preview results');
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

}

export interface INodeModelChangeEventProps {
  fieldChanged:string;
  nodeModel:ComposerNodeModel;
}