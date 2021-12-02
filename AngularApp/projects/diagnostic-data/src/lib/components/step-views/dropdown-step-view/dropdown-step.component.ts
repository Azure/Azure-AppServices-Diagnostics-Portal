
import { Component, Pipe, PipeTransform, Inject, OnInit, Input, ViewEncapsulation, AfterViewInit, AfterContentInit } from '@angular/core';
import { IDropdown, IDropdownOption } from 'office-ui-fabric-react/lib/components/Dropdown';
import { ISelectableOption } from 'office-ui-fabric-react/lib/utilities/selectableOption';
import { TelemetryService } from '../../../services/telemetry/telemetry.service';
import { DropdownStepView, StepViewContainer } from '../step-view-lib';

@Component({
  selector: 'dropdown-step',
  templateUrl: './dropdown-step.component.html',
  styleUrls: ['./dropdown-step.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DropDownStepComponent implements OnInit, AfterViewInit {
  @Input() viewModel: StepViewContainer;
  dropdownStepView: DropdownStepView;
  dropdownOptions: IDropdownOption[][];
  dropdown: IDropdown;
  dropdownRef: {
    current: IDropdown
  };

  constructor(private _telemetryService: TelemetryService) {

  }

  ngAfterViewInit(): void {
    var afterInit = this.dropdownStepView && this.dropdownStepView.afterInit;
    if (afterInit != null) {
      afterInit();
    }
  }

  ngOnInit() {
    this.dropdownStepView = <DropdownStepView>this.viewModel.stepView;
    var expandByDefault = this.dropdownStepView.expandByDefault;
    this.dropdownRef = {
      set current(val: IDropdown) {
        if (val != null) {
          this.dropdown = val;
          if (expandByDefault) {
            val.focus(true);
          }
        }
      },

      get current() {
        return this.dropdown;
      }
    };
    this.dropdownStepView.dropdowns.forEach((dropdown, idx) => {
      if (dropdown.defaultChecked != null) {
        this.dropdownStepView.callback(idx, dropdown.defaultChecked);
      }
    });
    var push = this.dropdownStepView.dropdowns.push.bind(this.dropdownStepView.dropdowns);
    this.dropdownStepView.dropdowns.push = (dropdown => {
      var result = push(dropdown);
      if (dropdown.defaultChecked != null) {
        this.dropdownStepView.callback(this.dropdownStepView.dropdowns.length - 1, dropdown.defaultChecked);
      }
      return result;
    });
  }

  onChange(event: { event: any, option: ISelectableOption, index: number }, dropdownIdx: number) {
    this.dropdownStepView.callback(dropdownIdx, <number>event.option.key);
  }

  getOptions(dropdown: any): IDropdownOption[] {
    return [<IDropdownOption>{ key: -1, text: dropdown.placeholder, isSelected: dropdown.defaultChecked == null, hidden: true }]
      .concat(dropdown.options.map((s, idx) => {
        return { key: idx, text: s, isSelected: idx == dropdown.defaultChecked };
      }));
  }

}

@Pipe({
  name: 'getDropdownOptions'
})
export class GetDropdownOptionsPipe implements PipeTransform {
  transform(dropdown: {
    description?: string,
    options: string[],
    defaultChecked?: number,
    placeholder: string
  }, args?: any): IDropdownOption[] {
    // generate IDropdownOption from dropdown
    if (dropdown == null) {
      return [];
    } else {
      return [<IDropdownOption>{ key: -1, text: dropdown.placeholder, isSelected: dropdown.defaultChecked == null, hidden: true }]
        .concat(dropdown.options.map((s, idx) => {
          return { key: idx, text: s, isSelected: idx == dropdown.defaultChecked };
        }));
    }
  }
}
