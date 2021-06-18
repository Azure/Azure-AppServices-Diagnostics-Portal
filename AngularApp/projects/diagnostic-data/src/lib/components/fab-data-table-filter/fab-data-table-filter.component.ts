import { FabCheckboxComponent } from '@angular-react/fabric';
import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { DirectionalHint, IButtonStyles, IChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react';
import { TableFilterSelectionOption, TableFilter } from '../../models/data-table';

const all = "all";

@Component({
  selector: 'fab-data-table-filter',
  templateUrl: './fab-data-table-filter.component.html',
  styleUrls: ['./fab-data-table-filter.component.scss']
})
export class FabDataTableFilterComponent implements OnInit {
  TableFilterSelectionOption = TableFilterSelectionOption;
  @Input() tableFilter: TableFilter;
  @Input() options: string[];
  //To generate unique element id for call out
  filterId: string;
  filterSelector: string;
  @Input() index: number;
  @Input() tableId: number;

  @Output() onFilterUpdate: EventEmitter<Set<string>> = new EventEmitter<Set<string>>();
  name: string = "";
  filterOption: TableFilterSelectionOption = TableFilterSelectionOption.Single;
  selected: Set<string> = new Set<string>();
  optionsWithFormattedName: { name: string, formattedName: string, defaultSelection: boolean }[] = [];

  //For single choice
  optionsForSingleChoice: IChoiceGroupOption[] = [];
  selectedKey: string = "";
  displayName: string = "";
  isCallOutVisible: boolean = false;

  buttonStyle: IButtonStyles = {
    root: {
      color: "#323130",
      borderRadius: "12px",
      margin: " 0px 5px",
      background: "rgba(0, 120, 212, 0.1)",
      fontSize: "13",
      fontWeight: "600",
      height: "80%"
    }
  }
  constructor() { }

  ngOnInit() {
    this.filterOption = this.tableFilter.selectionOption;

    this.options.sort();

    this.filterId = `fab-data-table-filter-${this.tableId}-${this.index}`;
    this.filterSelector = `#${this.filterId}`;

    this.options.forEach(option => {
      this.optionsWithFormattedName.push({ name: option, formattedName: this.formatOptionName(option), defaultSelection: this.checkIsDefaultSelected(option) });
    });

    if (this.filterOption === TableFilterSelectionOption.Single) {
      this.initForSingleSelect();
      this.displayName = `${this.tableFilter.name} : ${this.selectedKey}`;
      this.emitSelectedOption();
    } else if (this.filterOption === TableFilterSelectionOption.Multiple) {
      this.initForMultipleSelection();
      this.updateMultipleSelectionText();

      this.emitSelectedOption();
    }
  }

  //For multiple selection
  toggleSelectAll(checked: boolean) {
    if (checked) {
      this.selected = new Set(this.options);
    } else {
      //Deselected All
      this.selected.clear();
    }
  }

  toggleSelectOption(checked: boolean, index: number) {
    const optionName = this.optionsWithFormattedName[index].name;
    if (checked) {
      this.selected.add(optionName);
    } else {
      this.selected.delete(optionName);
    }
  }

  getCheckedStatus(index: number): boolean {
    const optionName = this.optionsWithFormattedName[index].name;
    return this.selected.has(optionName);
  }

  getSelectedAllStatus(): boolean {
    return this.options.length === this.selected.size;
  }

  //For single selection
  initForSingleSelect() {
    //If has defaultSelection and can be found then make it as default select, otherwise use first one
    let option = this.optionsWithFormattedName[0];
    if (this.optionsWithFormattedName.find(o => o.defaultSelection === true)) {
      option = this.optionsWithFormattedName.find(o => o.defaultSelection === true);
    }

    this.selectedKey = option.formattedName;
    this.selected.add(option.name);

    this.optionsWithFormattedName.forEach(option => {
      this.optionsForSingleChoice.push({
        key: option.formattedName,
        text: option.formattedName,
        onClick: () => {
          this.selected.clear();
          this.selectedKey = option.formattedName;
          this.selected.add(option.name);
        },
      });
    });
  }

  initForMultipleSelection() {
    this.optionsWithFormattedName.forEach(o => {
      if (o.defaultSelection) {
        this.selected.add(o.name);
      }
    })
  }

  updateTableWithOptions() {
    this.updateText();
    this.emitSelectedOption();
    this.closeCallout();
  }

  private formatOptionName(name: string): string {
    let formattedString = name;
    //remove empty space and <i> tag
    formattedString = formattedString.replace(/&nbsp;/g, "");
    formattedString = formattedString.replace(/<i.*><\/i>/g, "");
    return formattedString;
  }

  private checkIsDefaultSelected(name: string): boolean {
    const set = new Set(this.tableFilter.defaultSelection);
    return set.has(name);
  }

  toggleCallout() {
    this.isCallOutVisible = !this.isCallOutVisible;
  }

  closeCallout() {
    this.isCallOutVisible = false;
  }

  updateText() {
    if (this.filterOption === TableFilterSelectionOption.Single) {
      this.displayName = `${this.tableFilter.name} : ${this.selectedKey}`;
    } else if (this.filterOption === TableFilterSelectionOption.Multiple) {
      this.updateMultipleSelectionText();
    }
  }

  private updateMultipleSelectionText() {
    if (this.selected.size === 0 || this.selected.size === this.options.length) {
      //Selected nothing will be same as selected all as for display
      this.displayName = `${this.tableFilter.name} : ${all}`;
    } else if (this.selected.size == 1) {
      const selectedName = Array.from(this.selected)[0];
      const formattedSelectionName = this.optionsWithFormattedName.find(o => selectedName === o.name).formattedName;
      this.displayName = `${this.tableFilter.name} : ${formattedSelectionName}`;
    } else if (this.selected.size < this.options.length) {
      this.displayName = `${this.tableFilter.name} : ${this.selected.size} of ${this.options.length} selected`;
    }
  }

  emitSelectedOption() {
    //For multiple selection,if selected nothing when clicking from callout or no default selection then it will show as selected nothing ,but for updating table it will be same as selected everything
    if (this.filterOption === TableFilterSelectionOption.Multiple && this.selected.size === 0) {
      this.onFilterUpdate.emit(new Set(this.options));
    } else {
      this.onFilterUpdate.emit(this.selected);
    }
  }
}
