import { Component, Input, OnInit, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { DirectionalHint } from 'office-ui-fabric-react/lib/Tooltip';
import { ITooltipOptions } from '@angular-react/fabric/lib/components/tooltip';
import { FabTeachingBubbleComponent, OpenAIArmService } from './../../../public_api';
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
  footer: string = 'Powered by ChatGPT';
  promptPrefix: string = 'Explain this Win32 status code ';

  // For tooltip display
  directionalHint = DirectionalHint.rightTopEdge;
  toolTipStyles = { 'backgroundColor': 'white', 'color': 'black', 'border': '2px' };
  teachingBubbleCalloutProps: ICalloutProps = {
    directionalHint: DirectionalHint.bottomLeftEdge,
    dismissOnTargetClick: true,
    //hidden: true // Will be set to false/true
  };

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
    this.processWithAiService(this.text);
  }

  onTooltipToggle(slice: any) {
    slice.visible = !slice.visible;
    if (slice.visible && !slice.hasBeenVisible) {
      slice.hasBeenVisible = true;
      console.log('tooltip made visible');
      const eventProperties = {
        text: slice.value,
        tooltip: slice.tooltip
      };
      this.telemetryService.logEvent(TelemetryEventNames.OpenAiMessageViewed, eventProperties);
    }
    else if (!slice.visible) {
      this.removeTeachingBubbleFromDom2(slice);
    }
  }

  showTooltip(slice: any) {
    if (!slice.visible) {
      this.onTooltipToggle(slice);
    }
    if (slice.showCoachmark) {
      slice.showCoachmark = false;
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

    while ((r = match.exec(originalText))) {
      this.slices.push({ id: `slice${id}`, enhance: false, value: r.input.substring(lastIndex, r.index) });
      id++;
      const s: string = r.input.substring(r.index, match.lastIndex);
      this.slices.push({  id: `slice${id}`, enhance: true, visible: false, value: s });
      id++;
      lastIndex = match.lastIndex;
    }
    this.slices.push({ id: `slice${id}`, enhance: false, value: originalText.substring(lastIndex) });

    // For each slice, call OpenAI service and store the response
    this.slices.forEach(s => {
      if (s.enhance) {
        const query: string = this.promptPrefix + s.value;
        this.chatService.getAnswer(query, true).subscribe((resp) => {
          if (resp) {
            s.tooltip = resp;
            s.showCoachmark = true;
          }
        },
        error => {
          console.error('failed to retrieve respones from server: ' + error);
        });
      }
    });
  }
}
