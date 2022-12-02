import {
  AfterContentInit,
  AfterViewInit,
  Component,
  Inject,
  Input,
  OnInit,
  Pipe,
  PipeTransform,
  ViewEncapsulation
} from '@angular/core';
import {
  IDropdown,
  IDropdownOption
} from 'office-ui-fabric-react/lib/components/Dropdown';
import { ISelectableOption } from 'office-ui-fabric-react/lib/utilities/selectableOption';
import { InputType } from '../../../models/form';
import { TelemetryService } from '../../../services/telemetry/telemetry.service';
import { DropdownComponent } from '../../dropdown/dropdown.component';
import { FormStepView, StepViewContainer } from '../step-view-lib';

export function castTo<T>(): (row) => T {
  return (row) => row as T;
}

@Component({
  selector: 'form-step',
  templateUrl: './form-step.component.html',
  styleUrls: ['./form-step.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FormStepComponent implements OnInit, AfterViewInit {
  @Input() viewModel: StepViewContainer;

  formStepView: FormStepView;
  dropdownOptions: IDropdownOption[][];
  dropdown: IDropdown;
  dropdownRef: {
    current: IDropdown;
  };

  constructor(private _telemetryService: TelemetryService) {}

  ngAfterViewInit(): void {
    var afterInit = this.formStepView && this.formStepView.afterInit;
    if (afterInit != null) {
      afterInit();
    }
  }

  ngOnInit() {
    this.formStepView = <FormStepView>this.viewModel.stepView;

    var expandByDefault = this.formStepView.expandByDefault;
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
    this.formStepView.inputs.forEach((input, idx) => {
      if (input.itype == InputType.DropDown) {
        // let dropdown = (input as unknown a);
        if (input.value != null) {
          // this.formStepView.callback(idx, input.defaultChecked);
          input.callback(input.options[input.value]);
        }
      }
    });
    var push = this.formStepView.inputs.push.bind(this.formStepView.inputs);
    this.formStepView.inputs.push = (input) => {
      if (input.itype == InputType.DropDown) {
        var result = push(input);
        if (input.value != null) {
          input.callback(input.options[input.value]);
          // this.formStepView.callback(this.formStepView.inputs.length - 1, input.defaultChecked);
        }
        return result;
      }
    };
  }

  onChange(
    event: {
      event: any;
      target: any;
      option: ISelectableOption;
      index: number;
    },
    inputIdx: number
  ) {
    // this.formStepView.callback(dropdownIdx, <number>event.option.key);
    let input = this.formStepView.inputs[inputIdx];

    switch (input.itype) {
      case InputType.TextBox:
        if (input.callback) input.callback(event.target.value);

        break;
      case InputType.DropDown:
        let selectedKey = <number>event.option.key;
        input.value = selectedKey;
        if (input.callback) input.callback(input.options[selectedKey]);
        break;
    }
  }

  getOptions(dropdown: any): IDropdownOption[] {
    return [
      <IDropdownOption>{
        key: -1,
        text: dropdown.placeholder,
        isSelected: dropdown.defaultChecked == null,
        hidden: true
      }
    ].concat(
      dropdown.options.map((s, idx) => {
        return {
          key: idx,
          text: s,
          isSelected: idx == dropdown.defaultChecked
        };
      })
    );
  }

  gatherData(): { [key: string]: string } {
    let res = {};
    for (let input of this.formStepView.inputs) {
      switch (input.itype) {
        case InputType.DropDown:
          res[input.id] = input.options[input.value];
          break;
        default:
          res[input.id] = input.value;
      }
    }

    return res;
  }

  buttonClicked() {
    if (!this.formStepView.disableButton) {
      this.formStepView.disableButton = true;
      this.formStepView
        .callback(this.gatherData())
        .then(() => (this.formStepView.disableButton = false));
    }
  }
}
