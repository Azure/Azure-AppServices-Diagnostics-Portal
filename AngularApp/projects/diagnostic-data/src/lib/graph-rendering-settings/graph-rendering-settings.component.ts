import { Component, OnInit } from '@angular/core';
import { IDropdownProps, ITextFieldProps } from 'office-ui-fabric-react';

@Component({
  selector: 'graph-rendering-settings',
  templateUrl: './graph-rendering-settings.component.html',
  styleUrls: ['./graph-rendering-settings.component.scss']
})
export class GraphRenderingSettingsComponent implements OnInit {
  title: string = "";
  desc: string = "";
  selectedType: string = 'line';
  graphTypeOptions: IDropdownProps['options'] = [
    {key: 'line', text: 'line'},
    {key: 'bar', text: 'bar'},
    {key: 'stack', text: 'stack'}
  ];

  dropdownStyle: IDropdownProps['styles'] = {
    root: {
      display: "flex"
    },
    label: {
      marginRight: "10px",
      width: "fit-content"
    },
    dropdown: {
      width: "fit-content"
    }
  }

  textBoxStyle: ITextFieldProps['styles'] = {
    root: {
      display: "flex"
    },
    wrapper: {
      display: "flex"
    },
    fieldGroup: {
      marginLeft: "10px"
    }
  }

  constructor() { }

  ngOnInit(): void {
  }

  // changeType(event:any){
  //   this.selectedType = event.option.key;
  // }

}
