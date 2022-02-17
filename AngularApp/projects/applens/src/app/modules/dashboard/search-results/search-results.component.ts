import { Component, OnInit } from '@angular/core';
import { SearchService } from '../services/search.service';
import { Location } from '@angular/common';
import { ApplensGlobal } from '../../../applens-global';

@Component({
  selector: 'search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss']
})
export class SearchResultsComponent implements OnInit {
  constructor(public _searchService: SearchService, private _location: Location, private _applensGlobal: ApplensGlobal) {
  }

  navigateBack() {
    this._location.back();
  }

  ngOnInit() {
    this._applensGlobal.updateHeader("Searching");
  }
}