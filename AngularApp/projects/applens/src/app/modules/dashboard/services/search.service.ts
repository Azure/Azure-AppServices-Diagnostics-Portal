import { Injectable } from '@angular/core';

@Injectable()
export class SearchService {
  public searchIsEnabled: boolean = true;
  public searchTerm: string = '';
  public resourceHomeOpen: boolean = false;
  constructor() {}
  ngOnInit() {}
}
