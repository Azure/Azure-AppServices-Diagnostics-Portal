import { Component, OnInit } from '@angular/core';
import { ITextFieldProps } from 'office-ui-fabric-react';

@Component({
  selector: 'markdown-rendering-settings',
  templateUrl: './markdown-rendering-settings.component.html',
  styleUrls: ['./markdown-rendering-settings.component.scss']
})
export class MarkdownRenderingSettingsComponent implements OnInit {
  title: string = "";

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

}
