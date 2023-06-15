import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { ApplensGlobal } from '../../../applens-global';

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss']
})
export class SearchBoxComponent implements OnInit {

  @Output() searchValueChange: EventEmitter<string> = new EventEmitter<string>();

  searchValue: string = null;
  searchControl: FormControl = new FormControl();
  sideMenuCollapsed: boolean = false;
  @Input() ariaLabel: string = "";

  constructor(private globals: ApplensGlobal){
    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(res => {
      this.searchValueChange.emit(this.searchValue);
    });
  }

  ngOnInit(): void {
    this.globals.sideMenuCollapsed.subscribe(collapsed => this.sideMenuCollapsed = collapsed);
  }
}
