import { Component, AfterViewInit } from '@angular/core';
import { Globals } from '../../../globals';
import { DetectorControlService } from 'projects/diagnostic-data/src/lib/services/detector-control.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TelemetryService,TelemetryEventNames, TelemetrySource } from 'diagnostic-data';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'detector-command-bar',
  templateUrl: './detector-command-bar.component.html',
  styleUrls: ['./detector-command-bar.component.scss']
})
export class DetectorCommandBarComponent implements AfterViewInit{
  time: string;
  openTimePickerSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  constructor(private globals: Globals, private detectorControlService: DetectorControlService, private _route: ActivatedRoute, private router: Router, private telemetryService:TelemetryService) { }
  toggleOpenState() {
    this.telemetryService.logEvent(TelemetryEventNames.OpenGenie,{
      'Location':TelemetrySource.CategoryPage
    })
    this.globals.openGeniePanel = !this.globals.openGeniePanel;
  }

  sendFeedback() {
    this.telemetryService.logEvent(TelemetryEventNames.OpenFeedbackPanel,{
      'Location': TelemetrySource.CategoryPage
    });
    this.globals.openFeedback = !this.globals.openFeedback;
  }

  refreshPage() {
    let childRouteSnapshot = this._route.firstChild.snapshot;
    let childRouteType = childRouteSnapshot.url[0].toString();

    let instanceId = childRouteType === "overview" ? this._route.snapshot.params["category"] : (this._route.snapshot.params["category"] === "DiagnosticTools" ? childRouteSnapshot.url[1].toString(): childRouteType === "detectors" ? childRouteSnapshot.params["detectorName"] : childRouteSnapshot.params["analysisId"]);
    let isDiagnosticToolUIPage = this._route.snapshot.params["category"] === "DiagnosticTools" && childRouteType !== "overview" && instanceId !== "eventviewer" && instanceId !== "freblogs";

    const eventProperties = {
      'Category':this._route.snapshot.params['category'],
      'Location': TelemetrySource.CategoryPage
    };
    if (childRouteType === "detectors") {
      eventProperties['Detector'] = childRouteSnapshot.params['detectorName'];
      eventProperties['Type'] = 'detector';
    }else if(childRouteType === "analysis"){
      eventProperties['Analysis'] = childRouteSnapshot.params["analysisId"];
      eventProperties['Type'] = 'analysis';
    }else if (childRouteType === "overview") {
      eventProperties['Type'] = 'overview';
    }else if (this._route.snapshot.params["category"] === "DiagnosticTools") {
        eventProperties['Type'] = 'DiagnosticTools';
        eventProperties['Tool'] = instanceId ? instanceId : "";
    }

    this.telemetryService.logEvent(TelemetryEventNames.RefreshClicked,eventProperties);
    if (isDiagnosticToolUIPage)
    {
        // Currently there is no easy way to force reloading the static UI child component under DiagnosticTools Category
        this.router.navigate(['overview'], { relativeTo: this._route, skipLocationChange: true}).then(() => this.router.navigate([`tools/${instanceId}`], { relativeTo: this._route}));
    }
    else if (instanceId)
    {
      this.detectorControlService.refresh(instanceId);
    }
  }

  toggleOpenTimePicker() {
    // this.globals.openTimePicker = !this.globals.openTimePicker;
    // this.openTimePicker = !this.openTimePicker;
    this.openTimePickerSubject.next(true);
    this.updateAriaExpanded();
  }

  updateMessage(s: string) {
    this.time = s;
  }


  ngAfterViewInit() {
    // Async to get button element after grandchild is renderded
    setTimeout(()=>{
      this.updateAriaExpanded();
    });
  }


  updateAriaExpanded(){
    const btns = document.querySelectorAll("#fab-command-bar button");
    if(btns && btns.length > 0) {
      const dropdown = btns[btns.length - 1];
      dropdown.setAttribute("aria-expanded",`${this.globals.openTimePicker}`);
    }
  }
}
