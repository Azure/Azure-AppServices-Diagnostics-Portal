import { Moment } from 'moment';
import { BehaviorSubject } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Inject, Input, OnInit, Output, EventEmitter, Pipe, PipeTransform, SimpleChanges } from '@angular/core';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { DetectorResponse, Rendering, RenderingType, DataTableResponseObject, DownTime, DowntimeInteractionSource, DetectorMetaData, DetectorType, DiagnosticData } from '../../models/detector';
import { DetectorControlService } from '../../services/detector-control.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { CompilationProperties } from '../../models/compilation-properties';
import { GenericSupportTopicService } from '../../services/generic-support-topic.service';
import { ActivatedRoute, NavigationEnd, Params, Router } from '@angular/router';
import { VersionService } from '../../services/version.service';
import { CXPChatService } from '../../services/cxp-chat.service';
import * as momentNs from 'moment';
import { xAxisPlotBand, xAxisPlotBandStyles, zoomBehaviors, XAxisSelection } from '../../models/time-series';
import { IButtonStyles } from 'office-ui-fabric-react/lib/components/Button';
import { IChoiceGroupOption } from 'office-ui-fabric-react/lib/components/ChoiceGroup';
import { IDropdownOption } from 'office-ui-fabric-react/lib/components/Dropdown';
import { IIconProps } from 'office-ui-fabric-react/lib/components/Icon';
import { filter } from 'rxjs/operators';
import { GenericUserSettingService } from '../../services/generic-user-setting.service';

const moment = momentNs;
const minSupportedDowntimeDuration: number = 10;
const defaultDowntimeSelectionError: string = 'Downtimes less than 10 minutes are not supported. Select a time duration spanning at least 10 minutes.';

@Component({
  selector: 'detector-view',
  templateUrl: './detector-view.component.html',
  styleUrls: ['./detector-view.component.scss'],
  animations: [
    trigger('expand', [
      state('hidden', style({ height: '0px' })),
      state('shown', style({ height: '*' })),
      transition('* => *', animate('.25s')),
      transition('void => *', animate(0))
    ])
  ]
})
export class DetectorViewComponent implements OnInit {

  detectorDataLocalCopy: DetectorResponse;
  errorState: any;
  isPublic: boolean;

  supportDocumentContent: string = "";
  supportDocumentRendered: boolean = false;


  buttonViewVisible: boolean = false;
  buttonViewActiveComponent: string;

  readonly Feedback: string = 'Feedback';
  readonly Report: string = 'Report';

  private detectorResponseSubject: BehaviorSubject<DetectorResponse> = new BehaviorSubject<DetectorResponse>(null);
  private errorSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  detectorEventProperties: { [name: string]: string };
  ratingEventProperties: { [name: string]: string };
  authorEmails: string;
  insightsListEventProperties = {};

  emailToAuthor: string = '';
  emailToApplensTeam: string = '';

  cxpChatTrackingId: string = '';
  supportTopicId: string = '';
  cxpChatUrl: string = '';

  fabOptions: IDropdownOption[] = [];
  selectedKey: string = '';
  fabDropdownWidth: number;
  showDowntimeCallout: boolean = false;
  fabChoiceGroupOptions: IChoiceGroupOption[] = [];
  downtimeButtonStr: string = "";
  openTimePickerSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  timePickerButtonStr: string = "";
  buttonStyle: IButtonStyles = {
    root: {
     // color: "#323130",
      borderRadius: "12px",
      margin: " 0px 5px",
      background: "rgba(0, 120, 212, 0.1)",
      fontSize: "13",
      fontWeight: "600",
      height: "80%"
    },
    rootFocused: {
      border: "2px solid black",
    }
  }
  iconStyles:IIconProps["styles"] = {
    root: {
      color: "#0078d4"
    }
  }
  @Input()
  set detectorResponse(value: DetectorResponse) {
    this.resetGlobals();
    this.detectorResponseSubject.next(value);
  }

  @Input()
  set error(value: any) {
    this.errorSubject.next(value);
  }

  @Input() startTime: Moment;
  @Input() endTime: Moment;
  @Input() showEdit: boolean = true;
  @Input() insideDetectorList: boolean = false;
  @Input() parentDetectorId: string = '';
  @Input() isSystemInvoker: boolean = false;
  @Input() authorInfo: string = '';
  @Input() feedbackDetector: string = '';
  @Input() developmentMode: boolean = false;
  @Input() script: string = '';
  @Input() detector: string = '';
  @Input() compilationPackage: CompilationProperties;
  @Input() analysisMode: boolean = false;
  @Input() isAnalysisView: boolean = false;
  @Input() isPopoutFromAnalysis: boolean = false;
  @Input() hideDetectorHeader: boolean = false;
  @Input() hideDetectorControl: boolean = false;
  @Input() isKeystoneView: boolean = false;
  @Input() isRiskAlertDetector: boolean = false;
  @Input() overWriteDetectorDescription: string = "";
  @Input() overWriteDetectorName:string = "";
  feedbackButtonLabel: string = 'Send Feedback';
  hideShieldComponent: boolean = false;

  downTimes: DownTime[] = [];
  supportsDownTime: boolean = false;
  selectedDownTime: DownTime;
  downtimeSelectionErrorStr: string = '';
  downtimeFilterDisabled: boolean = false;
  public xAxisPlotBands: xAxisPlotBand[] = null;
  public zoomBehavior: zoomBehaviors = zoomBehaviors.Zoom;
  // isMonitoring: boolean = false;
  @Input() set downtimeZoomBehavior(zoomBehavior: zoomBehaviors) {
    if (!!zoomBehavior) {
      this.zoomBehavior = zoomBehavior;
    }
    else {
      this.zoomBehavior = zoomBehaviors.Zoom;
    }
    if (zoomBehavior & zoomBehaviors.GeryOutGraph) this.downtimeFilterDisabled = true;
    if (zoomBehavior & zoomBehaviors.UnGreyGraph) this.downtimeFilterDisabled = false;
  }
  @Output() XAxisSelection: EventEmitter<XAxisSelection> = new EventEmitter<XAxisSelection>();
  public onXAxisSelection(event: XAxisSelection) {
    let downTime = new DownTime();
    downTime.StartTime = event.fromTime;
    downTime.EndTime = event.toTime;
    downTime.downTimeLabel = this.prepareCustomDowntimeLabel(event.fromTime, event.toTime);
    downTime.isSelected = true;

    if (this.validateDowntimeEntry(downTime)) {
      this.XAxisSelection.emit(event);
      this.downTimes = this.downTimes.filter(currDownTime =>
        !(!!currDownTime.downTimeLabel && currDownTime.downTimeLabel.length > 0 && currDownTime.downTimeLabel.startsWith('Custom selection')) &&
        !(!!currDownTime.downTimeLabel && currDownTime.downTimeLabel.length > 0 && currDownTime.downTimeLabel == this.getDefaultDowntimeEntry().downTimeLabel)
      );
      this.downTimes.forEach(d => { d.isSelected = false; });
      this.downTimes.push(downTime);
      this.populateFabricDowntimeDropDown(this.downTimes);
      this.onDownTimeChange(downTime, DowntimeInteractionSource.Graph);
    }
    else {
      this.downtimeTriggerLog(downTime, DowntimeInteractionSource.Graph, false, `Downtime valdation failed. Selected downtime is less than ${minSupportedDowntimeDuration} minutes`);
      this.updateDownTimeErrorMessage(defaultDowntimeSelectionError);
    }
  }

  @Output() downTimeChanged: EventEmitter<DownTime> = new EventEmitter<DownTime>();
  private isLegacy: boolean;

  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private telemetryService: TelemetryService,
    private detectorControlService: DetectorControlService, private _supportTopicService: GenericSupportTopicService, private _cxpChatService: CXPChatService, protected _route: ActivatedRoute, private versionService: VersionService, private _router: Router, private _genericUserSettingsService: GenericUserSettingService) {
    this.isPublic = config && config.isPublic;
    this.feedbackButtonLabel = this.isPublic ? 'Send Feedback' : 'Rate Detector';
  }

  ngOnInit() {
    if (this._route.snapshot.data.tabKey == 'Monitoring' || this._route.snapshot.data.tabKey == 'Analytics')
        this.buttonStyle = {root:{display: "none"}};
    this.versionService.isLegacySub.subscribe(isLegacy => this.isLegacy = isLegacy);
    this._route.params.subscribe(p => {
      this.loadDetector();
    });

    this.errorSubject.subscribe((data: any) => {
      this.errorState = data;
      if (!!this.errorState) {
        let errorDetails = {
          'isPublic': this.isPublic.toString(),
          'errorDetails': JSON.stringify(this.errorState)
        };

        this.logEvent("DetectorLoadingError", errorDetails);
      }
    });

    // If it is using the new route, don't show those buttons
    // this.hideDetectorControl = this._route.snapshot.parent.url.findIndex((x: UrlSegment) => x.path === 'categories') > -1;
    //Remove after A/B Test
    // if (this.isLegacy) {
    //   this.hideDetectorControl = false;
    // } else {
    //   this.hideDetectorControl = this._route.snapshot.parent.url.findIndex((x: UrlSegment) => x.path === 'categories') > -1;
    // }

    // The detector name can be retrieved from  url column of application insight resource pageviews table.
    if (!this.insideDetectorList) {
      this.telemetryService.logPageView(TelemetryEventNames.DetectorViewLoaded, { "detectorId": this.detector });
    }

    if (this._route.snapshot.queryParamMap.has('hideShieldComponent') && !!this._route.snapshot.queryParams['hideShieldComponent']) {
      this.hideShieldComponent = true;
    }

    this.detectorControlService.timePickerStrSub.subscribe(s => {
      this.timePickerButtonStr = s;
    });
  }

  protected loadDetector() {
    this.detectorResponseSubject.subscribe((data: DetectorResponse) => {
      if (!this.isPublic)
      {
        this._genericUserSettingsService.isWaterfallViewMode().subscribe(isWaterfallViewMode =>
            {
                if (isWaterfallViewMode)
                {
                    this.detectorDataLocalCopy = data;
                }
                else
                {
                    this.detectorDataLocalCopy = this.mergeDetectorListResponse(data);
                }
            });
      }
      else
      {
            this.detectorDataLocalCopy = this.mergeDetectorListResponse(data);
      }


      if (data) {
        this.detectorEventProperties = {
          'StartTime': this.startTime.toISOString(),
          'EndTime': this.endTime.toISOString(),
          'DetectorId': data.metadata.id,
          'ParentDetectorId': this.parentDetectorId,
          'Url': window.location.href
        };

        if (data.metadata.supportTopicList && data.metadata.supportTopicList.findIndex(supportTopic => supportTopic.id === this._supportTopicService.supportTopicId) >= 0) {
          this.populateSupportTopicDocument();
          if (this.isPublic && !this.isAnalysisView && data.metadata.type === DetectorType.Detector) {
            //Since the analysis view is already showing the chat button, no need to show the chat button on the detector (csx) implementing the analysis view.
            this.renderCXPChatButton();
          }
        }

        this.ratingEventProperties = {
          'DetectorId': data.metadata.id,
          'Url': window.location.href
        };

        this.feedbackDetector = this.isSystemInvoker ? this.feedbackDetector : data.metadata.id;
        let subject = encodeURIComponent(`Detector Feedback for ${this.feedbackDetector}`);
        let body = encodeURIComponent('Current site: ' + window.location.href + '\n' + 'Please provide feedback here:');
        this.emailToApplensTeam = `mailto:applensdisc@microsoft.com?subject=${subject}&body=${body}`;

        if (!this.isSystemInvoker && data.metadata && data.metadata.author) {
          this.authorInfo = data.metadata.author;
        }

        if (this.authorInfo !== '') {
          const separators = [' ', ',', ';', ':'];
          const authors = this.authorInfo.split(new RegExp(separators.join('|'), 'g'));
          const authorsArray: string[] = [];
          authors.forEach(author => {
            if (author && author.length > 0) {
              authorsArray.push(`${author}@microsoft.com`);
            }
          });
          this.authorEmails = authorsArray.join(';');
          this.emailToAuthor = `mailto:${this.authorEmails}?cc=applensdisc@microsoft.com&subject=${subject}&body=${body}`;
        }

        this.buttonViewActiveComponent = null;
        this.buttonViewVisible = false;

        this.logInsights(data);

        if (this.isAnalysisView) {
          let downTime = data.dataset.find(set => (<Rendering>set.renderingProperties).type === RenderingType.DownTime);
          if (this.isInCaseSubmission()) {
            //Disable downtimes in case submission
            downTime = null;
          }
          if (!!downTime) {
            this.zoomBehavior = zoomBehaviors.CancelZoom | zoomBehaviors.FireXAxisSelectionEvent;
            this.supportsDownTime = true;
            this.parseDownTimeData(downTime.table);
            let defaultDowntime = null;
            let defaultDowntimeTriggerSource: string = '';
            if (this._route.snapshot.queryParamMap.has('startTimeChildDetector') && !!this._route.snapshot.queryParams['startTimeChildDetector']
              && this._route.snapshot.queryParamMap.has('endTimeChildDetector') && !!this._route.snapshot.queryParams['endTimeChildDetector']) {
              //Query string contains downtime. This is when the analysis is opened via a shared link
              if (!moment.utc(this._route.snapshot.queryParams['startTimeChildDetector']).isValid() || !moment.utc(this._route.snapshot.queryParams['endTimeChildDetector']).isValid()) {
                this.downtimeTriggerLog(defaultDowntime, DowntimeInteractionSource.DefaultFromQueryParams, false, 'Supplied downtime is of invalid format.');
              }
              else {
                let qStartTime = moment.utc(this._route.snapshot.queryParams['startTimeChildDetector']);
                let qEndTime = moment.utc(this._route.snapshot.queryParams['endTimeChildDetector']);

                if (this.startTime.isSameOrBefore(qStartTime) && this.endTime.isSameOrAfter(qEndTime)) {
                  //Make sure the passed in downtime is within the start and end time range of the detector
                  defaultDowntime = this.downTimes.find(x => x.StartTime.isSame(qStartTime) && x.EndTime.isSame(qEndTime));
                  if (!!defaultDowntime) {
                    //The downtime that was shared in the link is a part of the detector identified downtime
                    defaultDowntime.isSelected = true;
                    this.downTimes.forEach(downtime => {
                      downtime.isSelected = this.isDowntimeSame(downtime, defaultDowntime);
                    });
                  }
                  else {
                    //The downtime that was shared in the link is a custom downtime selected by the user. Add a custom downtime to the list
                    this.downTimes.forEach(downtime => {
                      downtime.isSelected = false;
                    });

                    defaultDowntime = {
                      StartTime: qStartTime,
                      EndTime: qEndTime,
                      downTimeLabel: this.prepareCustomDowntimeLabel(qStartTime, qEndTime),
                      isSelected: true
                    } as DownTime;
                    this.downTimes.push(defaultDowntime);
                  }
                  defaultDowntimeTriggerSource = DowntimeInteractionSource.DefaultFromQueryParams;
                }
                else {
                  this.downtimeTriggerLog(defaultDowntime, DowntimeInteractionSource.DefaultFromQueryParams, false, 'Supplied downtime is out of bounds.');
                }
              }
            }

            if (defaultDowntime == null) {
              //Query string did not contain a downtime or was out of bounds
              defaultDowntime = this.downTimes.find(x => x.isSelected);
              if (defaultDowntime == null && this.downTimes.length > 0) {
                this.downTimes[0].isSelected = true;
                defaultDowntime = this.downTimes[0];
                defaultDowntimeTriggerSource = DowntimeInteractionSource.DefaultFromDetector;
              }
              else {
                if (this.downTimes.length > 0) {
                  defaultDowntimeTriggerSource = DowntimeInteractionSource.DefaultFromDetector;
                }
                else {
                  this.downtimeTriggerLog(defaultDowntime, DowntimeInteractionSource.DefaultFromDetector, false, 'No downtimes detected by the detector.');
                }
              }
            }

            if (!!defaultDowntime) {
              this.populateFabricDowntimeDropDown(this.downTimes);
              this.onDownTimeChange(defaultDowntime, defaultDowntimeTriggerSource);
            }
          }
          else {
            this.resetGlobals();
          }
        }

        //After loading detectors, foucs indicator will land into detector title
        //For now asynchronouslly to foucs after render, it should have better solution
        setTimeout(() => {
          if (document.querySelector("#time-picker-button button")) {
            (<HTMLInputElement>document.querySelector("#time-picker-button button")).focus();
          }
        });
      }
    });
  }

  resetGlobals() {
    this.downTimes = [];
    this.selectedDownTime = null;
    this.supportsDownTime = false;
    this.xAxisPlotBands = [];
    this.zoomBehavior = zoomBehaviors.Zoom;
    this.populateFabricDowntimeDropDown(this.downTimes);
    this.updateDownTimeErrorMessage("");
  }

  getTimestampAsString(dateTime: Moment) {
    return dateTime.format(this.detectorControlService.stringFormat) + ' UTC';
  }

  getDowntimeLabel(d: DownTime) {
    return d.downTimeLabel;
  }

  private setxAxisPlotBands(includeAllBands: boolean = false, customDownTime?: DownTime): void {
    if (customDownTime == null && this.downTimes.length < 1 && this.selectedDownTime == null) {
      this.xAxisPlotBands = [];
    }
    else {
      this.xAxisPlotBands = [];
      if (!!customDownTime) {
        var currentPlotBand: xAxisPlotBand = {
          color: '#e5f9fe',
          from: customDownTime.StartTime,
          to: customDownTime.EndTime,
          style: xAxisPlotBandStyles.BehindPlotLines,
          borderWidth: 1,
          borderColor: '#015cda'
        };
        this.xAxisPlotBands.push(currentPlotBand);
      }
      else {
        if (includeAllBands) {
          this.downTimes.forEach(downtime => {
            if (!!downtime && !!downtime.StartTime && !!downtime.EndTime) {
              var currentPlotBand: xAxisPlotBand = {
                color: downtime.isSelected ? '#FFCAC4' : '#e5f9fe',
                from: downtime.StartTime,
                to: downtime.EndTime,
                style: xAxisPlotBandStyles.BehindPlotLines
              };
              this.xAxisPlotBands.push(currentPlotBand);
            }
          });
        }
        else {
          if (!!this.selectedDownTime && !!this.selectedDownTime.StartTime && !!this.selectedDownTime.EndTime) {
            var currentPlotBand: xAxisPlotBand = {
              color: '#e5f9fe',
              from: this.selectedDownTime.StartTime,
              to: this.selectedDownTime.EndTime,
              style: xAxisPlotBandStyles.BehindPlotLines,
              borderWidth: 1,
              borderColor: '#015cda'
            };
            this.xAxisPlotBands.push(currentPlotBand);
          }
        }
      }
    }
  }


  selectFabricKey() {
    this.downtimeButtonStr = this.selectedDownTime.downTimeLabel;
    this.onDownTimeChange(this.selectedDownTime, DowntimeInteractionSource.Dropdown);
    this.showDowntimeCallout = false;
  }

  private getKeyForDownTime(d: DownTime): string {
    if (!!d && !!d.StartTime && !!d.EndTime) {
      return `${this.getTimestampAsString(d.StartTime)}-${this.getTimestampAsString(d.EndTime)}`
    }
    else {
      return '';
    }
  }

  getDefaultFabricDownTimeEntry(): IChoiceGroupOption {
    let d = this.getDefaultDowntimeEntry();
    const defaultOption: IChoiceGroupOption = {
      key: this.getKeyForDownTime(d),
      text: this.getDowntimeLabel(d),
      ariaLabel: this.getDowntimeLabel(d),
      onClick: () => {
        this.selectedKey = this.getKeyForDownTime(d);
      }
    }
    return defaultOption;
  }

  prepareCustomDowntimeLabel(startTime: Moment, endTime: Moment): string {
    return `Custom selection from ${this.getTimestampAsString(startTime)} to ${this.getTimestampAsString(endTime)}`;
  }

  getDefaultDowntimeEntry(): DownTime {
    return {
      StartTime: momentNs.utc('1990-01-01 00:00:00'),
      EndTime: momentNs.utc('1990-01-01 00:00:00'),
      isSelected: false,
      downTimeLabel: 'Drag and select a time window on the graph'
    } as DownTime;
  }

  private populateFabricDowntimeDropDown(downTimes: DownTime[]): void {
    if (!!downTimes) {
      this.fabChoiceGroupOptions = [];
      downTimes.forEach(d => {
        this.fabChoiceGroupOptions.push({
          key: this.getKeyForDownTime(d),
          text: this.getDowntimeLabel(d),
          ariaLabel: this.getDowntimeLabel(d),
          onClick: () => {
            this.selectedKey = this.getKeyForDownTime(d);
            this.selectedDownTime = d;
          }
        });
      })

      this.fabChoiceGroupOptions.push(this.getDefaultFabricDownTimeEntry());
      const defaultDowntime = this.downTimes.find(x => x.isSelected);
      if(defaultDowntime != null) {
        this.selectedKey = this.getKeyForDownTime(defaultDowntime);
        this.selectedDownTime = defaultDowntime;
      } else if(this.fabChoiceGroupOptions.length > 0) {
        this.selectedKey = this.fabChoiceGroupOptions[0].key;
        this.selectedDownTime = this.fabChoiceGroupOptions.length > 1 ? this.downTimes[0] : this.getDefaultDowntimeEntry();
      }
      this.downtimeButtonStr = this.selectedDownTime.downTimeLabel;
    }
  }

  private parseDownTimeData(table: DataTableResponseObject) {

    if (!(table.rows === undefined || table.rows.length < 1)) {

      const startTimeIndex = 0;
      const endTimeIndex = 1;
      const downtimeLabelIndex = 2;
      const isSelectedIndex = 3;

      this.downTimes = [];
      for (let i: number = 0; i < table.rows.length; i++) {
        const row = table.rows[i];
        let d = new DownTime();
        d.StartTime = moment.utc(row[startTimeIndex]);
        d.EndTime = moment.utc(row[endTimeIndex]);
        d.downTimeLabel = row[downtimeLabelIndex];
        d.isSelected = row[isSelectedIndex];
        if (d.isSelected) {
          this.selectedDownTime = d;
        }
        if (this.validateDowntimeEntry(d)) {
          this.downTimes.push(d);
        }
      }
      let selectedDownTime = this.downTimes.find(downtime => downtime.isSelected == true);
      if (selectedDownTime == null && this.downTimes.length > 0) {
        this.downTimes[0].isSelected = true;
        this.selectedDownTime = this.downTimes[0];
      }
      let downtimeListForLogging = {
        'DowntimesIdentifiedCount': this.downTimes.length,
        'DowntimesIdentifiedList': JSON.stringify(this.downTimes)
      };

      this.logEvent(TelemetryEventNames.DowntimeListPassedByDetector, downtimeListForLogging);

      this.populateFabricDowntimeDropDown(this.downTimes);
      this.setxAxisPlotBands(false);
    }
  }

  isDowntimeSame(downtime1: DownTime, downtime2: DownTime): boolean {
    return downtime1.StartTime.isSame(downtime2.StartTime) && downtime1.EndTime.isSame(downtime2.EndTime);
  }

  toggleButtonView(feature: string) {
    if (this.buttonViewVisible) {
      this.buttonViewVisible = false;
      if (this.buttonViewActiveComponent !== feature) {
        setTimeout(() => {
          this.buttonViewActiveComponent = feature;
          this.buttonViewVisible = true;
        }, 250);
      } else {
        setTimeout(() => {
          this.buttonViewActiveComponent = null;
        }, 250);
      }
    } else {
      this.buttonViewActiveComponent = feature;
      this.buttonViewVisible = true;
    }
  }

  protected logInsights(data: DetectorResponse) {
    if (data.dataset) {
      let totalCount: number = 0;
      let successCount: number = 0;
      let criticalCount: number = 0;
      let warningCount: number = 0;
      let infoCount: number = 0;
      let defaultCount: number = 0;
      const insightsList = [];
      const insightsNameList: string[] = [];

      const statusColumnIndex = 0;
      const insightColumnIndex = 1;
      const isExpandedIndex = 4;

      data.dataset.forEach(dataset => {
        if (dataset.renderingProperties && dataset.renderingProperties.type === RenderingType.Insights) {
          dataset.table.rows.forEach(row => {
            if ((insightsNameList.find(insightName => insightName === row[insightColumnIndex])) == null) {
              {
                const isExpanded: boolean = row.length > isExpandedIndex ? row[isExpandedIndex].toLowerCase() === 'true' : false;
                const insightInstance = {
                  'Name': row[insightColumnIndex],
                  'Status': row[statusColumnIndex],
                  'IsExpandedByDefault': isExpanded
                };
                insightsList.push(insightInstance);
                insightsNameList.push(row[insightColumnIndex]);

                switch (row[statusColumnIndex]) {
                  case 'Critical':
                    criticalCount++;
                    break;
                  case 'Warning':
                    warningCount++;
                    break;
                  case 'Success':
                    successCount++;
                    break;
                  case 'Info':
                    infoCount++;
                    break;
                  default:
                    defaultCount++;
                }
              }
            }
          });
        }
      });

      totalCount = insightsList.length;

      const insightSummary = {
        'Total': totalCount,
        'Critical': criticalCount,
        'Warning': warningCount,
        'Success': successCount,
        'Info': infoCount,
        'Default': defaultCount
      };

      this.insightsListEventProperties = {
        'InsightsList': JSON.stringify(insightsList),
        'InsightsSummary': JSON.stringify(insightSummary)
      };

      this.logEvent(TelemetryEventNames.InsightsSummary, this.insightsListEventProperties);
    }
  }

  updateDownTimeErrorMessage(msg: string) {
    this.downtimeSelectionErrorStr = msg;
  }

  validateDowntimeEntry(selectedDownTime: DownTime): boolean {
    if (!!selectedDownTime && !!selectedDownTime.StartTime && !!selectedDownTime.EndTime) {
      if (momentNs.duration(selectedDownTime.EndTime.diff(selectedDownTime.StartTime)).asMinutes() < minSupportedDowntimeDuration) {
        return false;
      }
      else {
        return true;
      }
    }
    else {
      return false;
    }
  }

  downtimeTriggerLog(downtime: DownTime, downtimeInteractionSource: string, downtimeTriggerred: boolean, text: string) {
    const downtimeListForLogging = {
      'DowntimeInteractionSource': downtimeInteractionSource,
      'Downtime': JSON.stringify(downtime),
      'DowntimeTriggered': downtimeTriggerred,
      'DetectorStartTime': `${this.startTime.format("YYYY-MM-DDTHH:mm:ss")}Z`,
      'DetectorEndTime': `${this.endTime.format("YYYY-MM-DDTHH:mm:ssZ")}Z`,
      'Reason': text
    };
    this.logEvent(TelemetryEventNames.DowntimeInteraction, downtimeListForLogging);
  }

  onDownTimeChange(selectedDownTime: DownTime, downtimeInteractionSource: string) {
    if (!!selectedDownTime && !!selectedDownTime.StartTime && !!selectedDownTime.EndTime &&
      selectedDownTime.downTimeLabel != this.getDefaultDowntimeEntry().downTimeLabel &&
      momentNs.duration(selectedDownTime.StartTime.diff(this.startTime)).asMinutes() > -5 && //Allow a 5 min variance since backend normalizes starttime in 5 min timegrain
      momentNs.duration(this.endTime.diff(selectedDownTime.EndTime)).asMinutes() > -5 //Allow a 5 min variance since backend normalizes endtime in 5 min timegrain
    ) {
      if (this.validateDowntimeEntry(selectedDownTime)) {
        this.updateDownTimeErrorMessage('');
        this.selectedDownTime = selectedDownTime;
        this.downTimeChanged.emit(this.selectedDownTime);
        this.setxAxisPlotBands(false);
        this.downtimeTriggerLog(selectedDownTime, downtimeInteractionSource, true, '');
      }
      else {
        this.downtimeTriggerLog(selectedDownTime, downtimeInteractionSource, false, `Downtime valdation failed. Selected downtime is less than ${minSupportedDowntimeDuration} minutes`);
        this.updateDownTimeErrorMessage(defaultDowntimeSelectionError);
      }
    }
    else {
      let reason = '';
      if (!!selectedDownTime && !!selectedDownTime.downTimeLabel) {
        reason = selectedDownTime.downTimeLabel === this.getDefaultDowntimeEntry().downTimeLabel ? 'Placeholder downtime entry selected' : 'Selected downtime is out of bounds';
      }
      else {
        reason = (!!selectedDownTime) ? 'Empty downtime label' : 'Null downtime selected';
      }
      this.downtimeTriggerLog(selectedDownTime, downtimeInteractionSource, false, reason);
    }
  }
  protected logEvent(eventMessage: string, eventProperties?: any, measurements?: any) {
    if (!!this.detectorEventProperties) {
      for (const id of Object.keys(this.detectorEventProperties)) {
        if (this.detectorEventProperties.hasOwnProperty(id)) {
          eventProperties[id] = String(this.detectorEventProperties[id]);
        }
      }
    }

    this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
  }

  showChatButton(): boolean {
    return this.isPublic && !this.isAnalysisView && this.cxpChatTrackingId != '' && this.cxpChatUrl != '';
  }

  isInCaseSubmission(): boolean {
    return !!this._supportTopicService && !!this._supportTopicService.supportTopicId && this._supportTopicService.supportTopicId != '';
  }


  renderCXPChatButton() {
    if (this.cxpChatTrackingId === '' && this.cxpChatUrl === '') {
      let effectiveSupportTopicId:string = '';
      effectiveSupportTopicId = (this._supportTopicService && this._supportTopicService.sapSupportTopicId) ? this._supportTopicService.sapSupportTopicId : this._supportTopicService.supportTopicId;
      if (this._supportTopicService && this._cxpChatService && this._cxpChatService.isSupportTopicEnabledForLiveChat(effectiveSupportTopicId)) {
        this.cxpChatTrackingId = this._cxpChatService.generateTrackingId(effectiveSupportTopicId);
        this.supportTopicId = effectiveSupportTopicId;
        this._cxpChatService.getChatURL(effectiveSupportTopicId, this.cxpChatTrackingId).subscribe((chatApiResponse: any) => {
          if (chatApiResponse && chatApiResponse != '') {
            this.cxpChatUrl = chatApiResponse;
          }
        });
      }
    }
  }

  populateSupportTopicDocument() {
    if (!this.supportDocumentRendered) {
      this._supportTopicService.getSelfHelpContentDocument().subscribe(res => {
        if (res && res.length > 0) {
          var htmlContent = res[0]["htmlContent"];
          // Custom javascript code to remove top header from support document html string
          var tmp = document.createElement("DIV");
          tmp.innerHTML = htmlContent;
          var h2s = tmp.getElementsByTagName("h2");
          if (h2s && h2s.length > 0) {
            h2s[0].remove();
          }

          // Set the innter html for support document display
          this.supportDocumentContent = tmp.innerHTML;
          this.supportDocumentRendered = true;

        }
      });
    }
  }

  getDownTimeButtonStrForDetector(queryParams: Params) {
    let buttonStr = "";
    if (!!queryParams["startTimeChildDetector"] && !!queryParams['endTimeChildDetector']) {
      const qStartTime = moment.utc(queryParams["startTimeChildDetector"]);
      const qEndTime = moment.utc(queryParams['endTimeChildDetector']);
      buttonStr = this.prepareCustomDowntimeLabel(qStartTime, qEndTime);
    }
    return buttonStr;
  }

  //Merge all child detectors and put it into last place
  private mergeDetectorListResponse(response: DetectorResponse):DetectorResponse {

    if(!response || !response.dataset || !response.dataset.find(d => d.renderingProperties.type === RenderingType.DetectorList)) return response;

    const mergedResponse = {...response};
    let lastIndex = 0;
    const detectorIds:string[] = [];
    for(let i = 0;i < response.dataset.length;i++){
      const data = response.dataset[i];
      const isVisible = (<Rendering>data.renderingProperties).isVisible;
      if(data.renderingProperties.type === RenderingType.DetectorList && isVisible !== false){
        lastIndex = i;
        const detectors:string[] = data.renderingProperties.detectorIds ? data.renderingProperties.detectorIds : [];
        detectorIds.push(...detectors);
      }
    }

    const dataSet = mergedResponse.dataset.filter((data,index) => {
      return data.renderingProperties.type !== RenderingType.DetectorList || index === lastIndex;
    });

    const detectorMetaData = dataSet.find(d => d.renderingProperties.type === RenderingType.DetectorList);
    if(detectorMetaData){
      detectorMetaData.renderingProperties.detectorIds = detectorIds;
    }

    mergedResponse.dataset = dataSet;
    return mergedResponse;
  }

  closeDownTimeCallOut() {
    this.showDowntimeCallout = false;
  }
}

@Pipe({
  name: 'renderfilter',
  pure: false
})
export class RenderFilterPipe implements PipeTransform {
  transform(items: DiagnosticData[], isAnalysisView: any): any {
    if (!items || !isAnalysisView) {
      return items;
    }
    if (isAnalysisView)
      return items.filter(item => item.renderingProperties.type !== RenderingType.SearchComponent);
    else
      return items;
  }
}
