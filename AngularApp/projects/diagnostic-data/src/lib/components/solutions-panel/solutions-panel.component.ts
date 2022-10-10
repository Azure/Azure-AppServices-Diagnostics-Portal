import { Component, Input, OnInit,Inject, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IMessageBarProps, MessageBarType, PanelType } from 'office-ui-fabric-react';
import { Observable } from 'rxjs';
import { DiagnosticDataConfig, DIAGNOSTIC_DATA_CONFIG } from '../../config/diagnostic-data-config';
import { GenericThemeService } from '../../services/generic-theme.service';
import { Solution } from '../solution/solution';

@Component({
  selector: 'solutions-panel',
  templateUrl: './solutions-panel.component.html',
  styleUrls: ['./solutions-panel.component.scss']
})
export class SolutionsPanelComponent implements OnInit, OnDestroy {

  constructor(private _activatedRoute:ActivatedRoute, private _themeService: GenericThemeService,  @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
    this.isPublic = config && config.isPublic;
  }

  @Input() isPanelOpenObservable: Observable<boolean>;
  @Input() solutions: Solution[] = [];
  @Input() width: string = "800px";
  @Input() title: string = "";
  isOpen: boolean = false;
  panelType: PanelType = PanelType.custom;
  isPublic: boolean = true;
  resourceName: string = "";
  messageBarType: MessageBarType = MessageBarType.info;
  messageBarStyles: IMessageBarProps["styles"] = {
    root: {
      backgroundColor: "#F0F6FF"
    },
    icon: {
      color: "#015CDA"
    }
  };

  ngOnInit() {
    this.isPanelOpenObservable.subscribe(isOpen => this.isOpen = isOpen);
    const routeParams = this._activatedRoute.root.firstChild.firstChild.firstChild.snapshot.params;
    this.resourceName = routeParams['resourcename'] || routeParams['resourceName'] || "";

    this._themeService.currentThemeSub.subscribe(() => {
        this.messageBarStyles = {
            root: {
                backgroundColor: this._themeService.getPropertyValue("--messageBarBackground"),
                color: this._themeService.getPropertyValue("--bodyText"),
            },
            icon: {
              color: this._themeService.getPropertyValue("--messageBarIconColor")
            }
        }
    });
  }

    dismissPanel() {
    this.isOpen = false;
  }

  ngOnDestroy(): void {
    this.isOpen = false;
    this.removePanelFromDom();
  }

  //
  // Workaround as the Solutions Panel is not getting closed on
  // router.navigateByUrl() call. solutionPanelComponentClass is
  // just a bogus CSS class added to the <fab-panel> template to
  // ensure we don't end up deleting other open fab-panel in DOM
  //
  
  removePanelFromDom() {
    const htmlElement = document.querySelectorAll<HTMLElement>('.ms-Panel.is-open.solutionPanelComponentClass');
    if (htmlElement.length > 0) {
      htmlElement[0].parentElement.remove();
    }
  }
}
