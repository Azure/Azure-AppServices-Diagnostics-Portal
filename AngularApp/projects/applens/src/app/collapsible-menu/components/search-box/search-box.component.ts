import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss']
})
export class SearchBoxComponent {

  @Output() searchValueChange: EventEmitter<string> = new EventEmitter<string>();

  searchValue: string = null;
  searchControl: FormControl = new FormControl();
  
  @Input() ariaLabel: string = "";

  constructor(){
    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(res => {
      this.searchValueChange.emit(this.searchValue);
    });
  }
}
