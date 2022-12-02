import { Component, Input, OnInit } from '@angular/core';
import { ResourceService } from '../../../shared/services/resource.service';
import {
  ActivatedRoute,
  NavigationEnd,
  NavigationExtras,
  Router
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'resource-menu-item',
  templateUrl: './resource-menu-item.component.html',
  styleUrls: ['./resource-menu-item.component.scss']
})
export class ResourceMenuItemComponent implements OnInit {
  selected: boolean = false;

  currentRoutePathSubject: BehaviorSubject<string[]> = new BehaviorSubject<
    string[]
  >(null);

  @Input()
  set currentRoutePath(path: string[]) {
    this.currentRoutePathSubject.next(path);
  }

  constructor(
    public resourceService: ResourceService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.currentRoutePathSubject.subscribe((path) => {
      if (path) {
        this.selected = path.length === 1 && path[0] === 'home';
      }
    });
  }

  navigate() {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute
    };

    this._router.navigate(['./home'], navigationExtras);
  }
}
