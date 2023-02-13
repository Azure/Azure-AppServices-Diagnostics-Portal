import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RenderingType } from 'diagnostic-data';
import { IBasePickerProps, ITagPickerProps, ITagItemProps, ISuggestionModel, ITag, TagItem, IButtonStyles, IChoiceGroupOption, IDialogContentProps, IDialogProps, IDropdownOption, IDropdownProps, IIconProps, IPanelProps, IPersona, IPersonaProps, IPickerItemProps, IPivotProps, ITextFieldProps, MessageBarType, PanelType, SelectableOptionMenuItemType, TagItemSuggestion, IDropdown, ICalloutProps, ICheckboxStyleProps, ICheckboxProps } from 'office-ui-fabric-react';
import { KeyValuePair } from 'projects/app-service-diagnostics/src/app/shared/models/portal';
import { ApplensGlobal } from '../../../applens-global';
import { ComposerNodeModel, NoCodeSupportedRenderingTypes } from '../models/detector-designer-models/node-models';
import { DevelopMode } from '../onboarding-flow/onboarding-flow.component';

@Component({
  selector: 'node-composer',
  templateUrl: './node-composer.component.html',
  styleUrls: ['./node-composer.component.scss']
})

export class NodeComposer {
  
  RenderingType = RenderingType;
  
  @Input() mode: DevelopMode = DevelopMode.Create;  
  @Input() nodeModel: ComposerNodeModel;
  @Output() nodeModelChange = new EventEmitter<ComposerNodeModel>();
  @Output() onNodeModelChange = new EventEmitter<INodeModelChangeEventProps>();
  @Output() onDuplicateClick = new EventEmitter<ComposerNodeModel>();
  @Output() onDeleteClick = new EventEmitter<ComposerNodeModel>();

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

  constructor(private _applensGlobal: ApplensGlobal, private _activatedRoute: ActivatedRoute, private _router: Router ) {
    this._applensGlobal.updateHeader('');
    this.initComponent();
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

  public setMocanoReference(editor:any) {
    this.nodeModel.editorRef = editor;
  }

}

export interface INodeModelChangeEventProps {
  fieldChanged:string;
  nodeModel:ComposerNodeModel;
}