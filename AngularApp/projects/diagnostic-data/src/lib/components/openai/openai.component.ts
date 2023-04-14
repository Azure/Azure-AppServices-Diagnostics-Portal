import { Component, Input, OnInit, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { DirectionalHint } from 'office-ui-fabric-react/lib/Tooltip';
import { ITooltipOptions } from '@angular-react/fabric/lib/components/tooltip';
import { FabTeachingBubbleComponent } from './../../modules/fab-teachingbubble/public-api';
import { OpenAIArmService } from './../../services/openai-arm.service';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { ICalloutProps, ITeachingBubbleProps } from 'office-ui-fabric-react';

@Component({
  selector: 'openai',
  templateUrl: './openai.component.html',
  styleUrls: ['./openai.component.scss']
})
export class OpenaiComponent implements OnInit {

  @Input() text: string;
  @ViewChildren('tip') tips : QueryList<FabTeachingBubbleComponent>;

  slices: any[] = [];
  chatResponse: string;
  footer: string = 'Powered by App Service Diagnostics AI';
  promptPrefix: string = 'Explain this Win32 status code ';

  // For tooltip display
  directionalHint = DirectionalHint.rightTopEdge;
  toolTipStyles = { 'backgroundColor': 'white', 'color': 'black', 'border': '2px' };
  teachingBubbleCalloutProps: ICalloutProps = {
    directionalHint: DirectionalHint.bottomLeftEdge,
    dismissOnTargetClick: true,
  };
  coachMarkCookieName: string = 'openai-showCoachmark';
  showCoachmark: boolean = true;

  toolTipOptionsValue: ITooltipOptions = {
    calloutProps: {
      styles: {
        beak: this.toolTipStyles,
        beakCurtain: this.toolTipStyles,
        calloutMain: this.toolTipStyles
      }
    },
    styles: {
      content: this.toolTipStyles,
      root: this.toolTipStyles,
      subText: this.toolTipStyles
    }
  }

  coachmarkPositioningContainerProps = {
    directionalHint: DirectionalHint.bottomLeftEdge,
    doNotLayer: true
  };

  constructor(private chatService: OpenAIArmService, private telemetryService: TelemetryService, private changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit() {
    this.initCoachmarkFlag();
    this.processWithAiService(this.text);
  }

  initCoachmarkFlag() {
    try {
      const cookie: string = localStorage.getItem(this.coachMarkCookieName) || 'true';
      this.showCoachmark = cookie === 'true';
    }
    catch (error) {
      // Use TelemetryService logEvent when not able to access local storage.
      // Most likely due to browsing in InPrivate/Incognito mode.
      const e = new Error(`Error trying to retrieve ${this.coachMarkCookieName} from localStorage: ` + error);
      this.telemetryService.logException(e);
    }
  }

  onTooltipToggle(slice: any) {
    slice.visible = !slice.visible;
    if (slice.visible && !slice.hasBeenVisible) {
      slice.hasBeenVisible = true;
      const eventProperties = {
        text: slice.value,
        tooltip: slice.tooltip
      };
      this.telemetryService.logEvent(TelemetryEventNames.OpenAiMessageViewed, eventProperties);

      if (slice.showCoachmark) {
        slice.showCoachmark = false;
      }
      if (this.showCoachmark) {
        // Dismiss coachmarks because we need to show the coachmark only once.
        this.showCoachmark = false;
        localStorage.setItem(this.coachMarkCookieName, 'false');
      }
    }
    else if (!slice.visible) {
      this.removeTeachingBubbleFromDom2(slice);
    }
  }

  showTooltip(slice: any) {
    if (!slice.visible) {
      this.onTooltipToggle(slice);
    }
  }

  dismissTooltip(slice: any) {
    if (slice && slice.visible) {
//      this.removeTeachingBubbleFromDom(slice);
      this.removeTeachingBubbleFromDom2(slice);
    }
  }

  removeTeachingBubbleFromDom(slice: any) {
    const targetLabel = 'teachingbubble-' + slice.id;
    const htmlElements = document.querySelectorAll<HTMLElement>('.ms-TeachingBubble-content');
    for(let i = 0; i < htmlElements.length; i++) {
      const el = htmlElements[i];
      const label = el.getAttribute('aria-labelledby');
      if (label === targetLabel)
      {
        const calloutContainer : HTMLElement | null = el.closest('.ms-Callout-container');
        if (calloutContainer)
        {
          calloutContainer.remove();
          slice.visible = false;
        }
      }
    }

    /*
    const htmlElements = document.querySelectorAll<HTMLElement>('.ms-Callout.ms-TeachingBubble');
    if (htmlElements.length > 0) {
      htmlElements[0].parentElement.remove();
    }
    */
  }

  removeTeachingBubbleFromDom2(slice: any) {
    const st = '#' + slice.id;
    this.tips.forEach(c => {
      if (c.target === st) {
        c.reactNodeRef.nativeElement.destroyNode();
      }
    });
    slice.visible = false;
  }

  processWithAiService(originalText: string) {
    if (!originalText) {
      return;
    }

    // TODO: make this customizable
    const match: RegExp = /(^|\s)0x[8F][0-9A-F]{7}(\s|\.|$)/ig;
    let lastIndex = 0;
    let id = 0;
    let r;
    let isCoachmarkSet = false;

    while ((r = match.exec(originalText))) {
      this.slices.push({ id: `slice${id}`, enhance: false, value: r.input.substring(lastIndex, r.index) });
      id++;
      const s: string = r.input.substring(r.index, match.lastIndex);
      // Only the first enhancing slice will have showCoachMark enabled
      this.slices.push({ id: `slice${id}`, enhance: true, visible: false, value: s, showCoachmark: !isCoachmarkSet });
      isCoachmarkSet = true;
      id++;
      lastIndex = match.lastIndex;
    }
    this.slices.push({ id: `slice${id}`, enhance: false, value: originalText.substring(lastIndex) });

    // For each slice, call OpenAI service and store the response
    for(let i = 0; i < this.slices.length; i++) {
      const s = this.slices[i];
      if (s.enhance) {
        const query: string = this.promptPrefix + s.value;
        this.chatService.getAnswer(query, true).subscribe((resp) => {
          if (resp && resp.length > 2 && !resp.trim().toLowerCase().includes("we could not find any information about that")) {
            s.tooltip = resp;
          }
        },
        error => {
          const e = new Error('failed to retrieve respones from server: ' + error);
          this.telemetryService.logException(e);
        });
      }
    }
  }
}
