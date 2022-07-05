import { Component, AfterViewInit, ViewChild, TemplateRef, AfterContentInit, OnInit, OnDestroy, Inject } from '@angular/core';
import { DirectionalHint, ICheckProps, IPanelProps, PanelType } from 'office-ui-fabric-react';
import { ActivatedRoute } from '@angular/router';
import * as momentNs from 'moment';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { PIIUtilities } from '../../utilities/pii-utilities';
import { TelemetryEventNames, TelemetrySource } from '../../services/telemetry/telemetry.common';
import { Guid } from '../../utilities/guid';
import { DiagnosticDataConfig, DIAGNOSTIC_DATA_CONFIG } from '../../config/diagnostic-data-config';
import { GenieGlobals } from '../../services/genie.service';

const moment = momentNs;

@Component({
  selector: 'fabric-feedback',
  templateUrl: './fabric-feedback.component.html',
  styleUrls: ['./fabric-feedback.component.scss']
})
export class FabricFeedbackComponent implements AfterViewInit, OnInit, OnDestroy {
  type: PanelType = PanelType.custom;
  siteName: string = "";
  ratingEventProperties: { [key: string]: any } = {};
  feedbackPanelConfig: { defaultFeedbackText?: string, notResetOnDismissed?: boolean, detectorName?: string, url?: string } = {};
  feedbackText: string = "";
  panelWidth: string = "315px";
  feedbackIcons: { id: string, text: string, ariaLabel: string }[] =
    [
      {
        id: "Sad",
        text: "dissatisfied",
        ariaLabel: "Are you satisfied with your experience? Dissatisfied Radio button 1 of 3"
      },
      {
        id: "EmojiNeutral",
        text: "ok",
        ariaLabel: "Are you satisfied with your experience? Ok Radio button 2 of 3"
      },
      {
        id: "Emoji2",
        text: "satisfied",
        ariaLabel: "Are you satisfied with your experience? Satisfied Radio button 3 of 3"
      }
    ];
  submitted: boolean = false;
  rating: number = 0;
  checked: boolean = false;
  submittedPanelTimer: any = null;
  checkLabel: string = "Microsoft can email you about your feedback";
  tooltipDirectionalHint = DirectionalHint.rightBottomEdge;

  submittedPanelStyles: IPanelProps["styles"] = {
    root: {
      height: "80px",
    },
    content: {
      padding: "0px"
    },
    navigation: {
      height: "18px"
    }
  }
  currentTime: string = "";
  isPublic: boolean = false;
  constructor(protected telemetryService: TelemetryService, public globals: GenieGlobals, private activatedRoute: ActivatedRoute, @Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig) {
    this.isPublic = config && config.isPublic;
  }

  submitFeedback() {
    const eventProps = {
      Rating: String(this.rating),
      Feedback: PIIUtilities.removePII(this.feedbackText)
    };
    const detectorName = this.feedbackPanelConfig.detectorName || this.globals.getDetectorName();
    if (this.isPublic) {
      const isHomepage = !this.activatedRoute.root.firstChild.firstChild.firstChild.firstChild.snapshot.params["category"];
      this.ratingEventProperties["Location"] = isHomepage ? TelemetrySource.LandingPage : TelemetrySource.CategoryPage;
    } else {
      const user = this.globals.getUserAlias();
      this.ratingEventProperties["User"] = user;
      this.ratingEventProperties["Location"] = detectorName ? TelemetrySource.OverviewPage : TelemetrySource.DetectorPage
    }
    this.ratingEventProperties["DetectorId"] = detectorName;
    this.ratingEventProperties["Url"] = window.location.href;
    this.ratingEventProperties["MayContact"] = this.checked;
    this.ratingEventProperties["FeedbackId"] = Guid.newShortGuid();
    this.ratingEventProperties["isPublic"] = this.isPublic
    this.logEvent(TelemetryEventNames.StarRatingSubmitted, eventProps);

    this.reset();
    this.submitted = true;
  }

  setRating(index: number) {
    this.rating = index + 1;
  }

  protected logEvent(eventMessage: string, eventProperties?: any, measurements?: any) {
    for (const id of Object.keys(this.ratingEventProperties)) {
      if (this.ratingEventProperties.hasOwnProperty(id)) {
        eventProperties[id] = String(this.ratingEventProperties[id]);
      }
    }
    this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
  }

  ngOnInit() {
    this.reset();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      const eles = document.querySelectorAll("#feedback-icons i");
      if (eles && eles.length > 0) {
        eles.forEach((ele, index) => {
          ele.setAttribute("role", "button");
          ele.setAttribute("name", this.feedbackIcons[index].text);
        });
      }
    });
  }

  reset() {
    this.rating = 0;
    this.feedbackText = this.feedbackPanelConfig.defaultFeedbackText || "";
    this.checked = false;
    this.globals.openFeedback = false;
  }

  dismissedFeedbackHandler() {
    if (this.feedbackPanelConfig.notResetOnDismissed) {
      this.globals.openFeedback = false;
      return;
    }
    this.reset();
  }

  dismissedSubmittedHandler() {
    this.submitted = false;
  }

  onOpenSubmittedPanel() {
    this.currentTime = moment(Date.now()).format("hh:mm A");
    this.submittedPanelTimer = setTimeout(() => {
      this.dismissedSubmittedHandler();
    }, 3000);
  }

  onOpenFeedbackPanel() {
    const globals = this.globals;
    if (this.isPublic && globals.messagesData.feedbackPanelConfig != null && globals.messagesData.feedbackPanelConfig.url.split("?")[0] == window.location.href.split("?")[0]) {
      this.feedbackPanelConfig = globals.messagesData.feedbackPanelConfig;
      this.feedbackText = this.feedbackPanelConfig.defaultFeedbackText || "";
    }else if (this.feedbackPanelConfig.url != window.location.href.split("?")[0]){
      this.feedbackPanelConfig.url = window.location.href.split("?")[0];
    }

    if (document.getElementsByName("feedback-icon-rating") != undefined && document.getElementsByName("feedback-icon-rating").length>0 && document.getElementsByName("feedback-icon-rating")[0] != undefined)
    {
        (<HTMLElement>document.getElementsByName("feedback-icon-rating")[0]).focus();
    }

  }

  ngOnDestroy() {
    this.submittedPanelTimer = null;
  }
}
