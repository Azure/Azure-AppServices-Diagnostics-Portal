import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { IChoiceGroupOption } from 'office-ui-fabric-react';

@Component({
  selector: 'toggle-button',
  templateUrl: './toggle-button.component.html',
  styleUrls: ['./toggle-button.component.scss']
})
export class ToggleButtonComponent implements OnInit {

  selectedKey: string = "on";
  constructor() { }

  ngOnInit() {
    this.updateSelectedKey();
  }

  choiceGroupOptions: IChoiceGroupOption[] = [
    { key: 'on', text: 'On', defaultChecked: true, onClick: () => { this.setSelected(true) } },
    { key: 'off', text: 'Off', onClick: () => { this.setSelected(false) } }
  ];

  @Input() selected: boolean;
  @Input() ToggleText: string;
  @Output() selectedChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  updateSelectedKey() {
    this.selectedKey = this.selected ? 'on' : 'off';
  }

  setSelected(selected: boolean) {
    this.selected = selected;
    this.updateSelectedKey();
    this.selectedChange.emit(this.selected);
  }
}
