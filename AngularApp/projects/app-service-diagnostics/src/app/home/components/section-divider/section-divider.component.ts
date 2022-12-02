import {
  Component,
  OnInit,
  Input,
  ContentChildren,
  QueryList
} from '@angular/core';
import {
  trigger,
  state,
  style,
  transition,
  animate
} from '@angular/animations';
import {
  ActivatedRoute,
  Router,
  NavigationExtras,
  NavigationEnd,
  Scroll
} from '@angular/router';
import { TelemetryService, TelemetryEventNames } from 'diagnostic-data';

@Component({
  selector: 'section-divider',
  templateUrl: './section-divider.component.html',
  styleUrls: ['./section-divider.component.scss'],
  animations: [
    trigger('expand', [
      state('shown', style({ height: '*' })),
      state('hidden', style({ height: '0px' })),
      transition('* => *', animate('.1s'))
    ])
  ]
})
export class SectionDividerComponent implements OnInit {
  @Input() isOverview: boolean = false;
  @Input() label: string;
  @Input() initiallySelected: boolean = true;
  @Input() collapsible: boolean = true;
  @Input() disableExpandIcon: boolean = false;
  @Input() routePath: string = '';
  @Input() initiallyExpanded: boolean = true;
  @Input() category: string = '';
  expanded: boolean = true;
  overviewImagePath: string = '../../../../assets/img/detectors/Overview.svg';
  selected: boolean = true;

  constructor(
    private _route: Router,
    private _activatedRoute: ActivatedRoute,
    private telemetryService: TelemetryService
  ) {}

  ngOnInit() {
    this.selected = this.initiallySelected;
    this.expanded = this.initiallyExpanded;
  }

  isSelected() {
    if (this._route.url.includes(this.routePath)) {
      return true;
    } else {
      return false;
    }
  }

  sectionHeaderClick() {
    this.telemetryService.logEvent(TelemetryEventNames.CategoryNavItemClicked, {
      DetectorName: this.label,
      CategoryName: this.category
    });
    this.navigateTo(`${this.routePath}`);
  }

  navigateTo(path: string) {
    let navigationExtras: NavigationExtras = {
      queryParamsHandling: 'preserve',
      preserveFragment: true,
      relativeTo: this._activatedRoute
    };
    this._route.navigate(path.split('/'), navigationExtras);
  }

  toUpperCase(label: string) {
    return label.toUpperCase();
  }
}
