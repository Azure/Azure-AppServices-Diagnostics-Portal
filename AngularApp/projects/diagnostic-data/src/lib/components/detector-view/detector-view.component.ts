import { Moment } from 'moment';
import { BehaviorSubject } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Inject, Input, OnInit, Output, EventEmitter, Pipe, PipeTransform, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { DIAGNOSTIC_DATA_CONFIG, DiagnosticDataConfig } from '../../config/diagnostic-data-config';
import { DetectorResponse, Rendering, RenderingType, DataTableResponseObject, DownTime, DowntimeInteractionSource, DetectorMetaData, DetectorType, DiagnosticData } from '../../models/detector';
import { DetectorControlService } from '../../services/detector-control.service';
import { TelemetryEventNames } from '../../services/telemetry/telemetry.common';
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { CompilationProperties} from '../../models/compilation-properties';
import {GenericSupportTopicService} from '../../services/generic-support-topic.service';
import { ActivatedRoute, UrlSegment } from '@angular/router';
import { VersionService } from '../../services/version.service';
import { CXPChatService } from '../../services/cxp-chat.service';
import * as momentNs from 'moment';
import { xAxisPlotBand, xAxisPlotBandStyles, zoomBehaviors, XAxisSelection } from '../../models/time-series';
import { IDropdownOption } from 'office-ui-fabric-react';

const moment = momentNs;
const minSupportedDowntimeDuration:number = 10;
const defaultDowntimeSelectionError:string = 'Downtimes less than 10 minutes are not supported. Select a time duration spanning at least 10 minutes.';

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

  cxpChatTrackingId:string= '';
  cxpChatUrl:string = '';

  fabOptions: IDropdownOption[] = [];
  selectedKey:string = '';
  fabDropdownWidth:number

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
  @Input() isCategoryOverview:boolean = false;
  feedbackButtonLabel: string = 'Send Feedback';

  downTimes: DownTime[] = [];
  supportsDownTime:boolean = false;
  selectedDownTime: DownTime;
  downtimeSelectionErrorStr:string = '';
  public xAxisPlotBands: xAxisPlotBand[] = null;
  public zoomBehavior: zoomBehaviors = zoomBehaviors.Zoom;
  @Output() XAxisSelection:EventEmitter<XAxisSelection> = new EventEmitter<XAxisSelection>();	
  public onXAxisSelection(event:XAxisSelection) {    
    let downTime = new DownTime();
    downTime.StartTime = event.fromTime;
    downTime.EndTime = event.toTime;
    downTime.downTimeLabel = `Custom selection from ${this.getTimestampAsString(event.fromTime)} to ${this.getTimestampAsString(event.toTime)}`;
    downTime.isSelected = true;

    if(this.validateDowntimeEntry(downTime)) {
      this.XAxisSelection.emit(event);
      this.downTimes = this.downTimes.filter(currDownTime=>  
        !(!!currDownTime.downTimeLabel && currDownTime.downTimeLabel.length > 0 && currDownTime.downTimeLabel.startsWith('Custom selection'))  &&
        !(!!currDownTime.downTimeLabel && currDownTime.downTimeLabel.length > 0  && currDownTime.downTimeLabel == this.getDefaultDowntimeEntry().downTimeLabel)
      );
      this.downTimes.forEach(d=>{d.isSelected = false;});
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
  hideDetectorControl: boolean = false;
  private isLegacy:boolean;

  constructor(@Inject(DIAGNOSTIC_DATA_CONFIG) config: DiagnosticDataConfig, private telemetryService: TelemetryService,
    private detectorControlService: DetectorControlService, private _supportTopicService: GenericSupportTopicService, private _cxpChatService: CXPChatService, protected _route: ActivatedRoute,private versionService:VersionService) {
    this.isPublic = config && config.isPublic;
    this.feedbackButtonLabel = this.isPublic ? 'Send Feedback' : 'Rate Detector';
  }

  ngOnInit() {
    this.versionService.isLegacySub.subscribe(isLegacy => this.isLegacy = isLegacy);
    this.loadDetector();
    this.errorSubject.subscribe((data: any) => {
      this.errorState = data;
    });

    // If it is using the new route, don't show those buttons
    // this.hideDetectorControl = this._route.snapshot.parent.url.findIndex((x: UrlSegment) => x.path === 'categories') > -1;
    //Remove after A/B Test
    if (this.isLegacy) {
      this.hideDetectorControl = false;
    } else {
      this.hideDetectorControl = this._route.snapshot.parent.url.findIndex((x: UrlSegment) => x.path === 'categories') > -1;
    }

    // The detector name can be retrieved from  url column of application insight resource pageviews table.
    if (!this.insideDetectorList) {
      this.telemetryService.logPageView(TelemetryEventNames.DetectorViewLoaded, { "detectorId": this.detector });
    }
  }

  protected loadDetector() {
    this.detectorResponseSubject.subscribe((data: DetectorResponse) => {
      let metadata: DetectorMetaData = data? data.metadata: null;
      this.detectorDataLocalCopy = data;
      if (data) {
        this.detectorEventProperties = {
          'StartTime': this.startTime.toISOString(),
          'EndTime': this.startTime.toISOString(),
          'DetectorId': data.metadata.id,
          'ParentDetectorId': this.parentDetectorId,
          'Url': window.location.href
        };

        if (data.metadata.supportTopicList && data.metadata.supportTopicList.findIndex(supportTopic => supportTopic.id === this._supportTopicService.supportTopicId) >= 0) {
          this.populateSupportTopicDocument();
          if(this.isPublic && !this.isAnalysisView && data.metadata.type === DetectorType.Detector) {
            //Since the analysis view is already showing the chat button, no need to show the chat button on the detector (csx) implementing the analysis view.
            this.renderCXPChatButton();
          }
          else {
                var checkOutcome = {
                  _supportTopicServiceObj: !!this._supportTopicService,
                  supportTopicId: (!!this._supportTopicService)? this._supportTopicService.supportTopicId : '_supportTopicService is NULL',
                  _cxpChatService: !!this._cxpChatService,
                  isSupportTopicEnabledForLiveChat:  (!!this._supportTopicService && !!this._cxpChatService)? this._cxpChatService.isSupportTopicEnabledForLiveChat(this._supportTopicService.supportTopicId): null,
                  isPublic: !!this.isPublic,
                  isAnalysisView: !!this.isAnalysisView,
                  DetectorMetadata: data.metadata
                };
                this._cxpChatService.logChatEligibilityCheck('Call to CXP Chat API skipped for analysis', JSON.stringify(checkOutcome));            
          }          
        }
        else {
                    var checkOutcome = {
            _supportTopicServiceObj: !!this._supportTopicService,
            supportTopicId: (!!this._supportTopicService)? this._supportTopicService.supportTopicId : '_supportTopicService is NULL',
            _cxpChatService: !!this._cxpChatService,
            isSupportTopicEnabledForLiveChat:  (!!this._supportTopicService && !!this._cxpChatService)? this._cxpChatService.isSupportTopicEnabledForLiveChat(this._supportTopicService.supportTopicId): null,
            isPublic: !!this.isPublic,
            isAnalysisView: !!this.isAnalysisView,
            DetectorMetadata: data.metadata
          };          
          this._cxpChatService.logChatEligibilityCheck('Call to CXP Chat API skipped. Detector does not match support Topic', JSON.stringify(checkOutcome));   
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
          if (downTime) {
            this.zoomBehavior = zoomBehaviors.CancelZoom | zoomBehaviors.FireXAxisSelectionEvent;
            this.supportsDownTime = true;
            this.parseDownTimeData(downTime.table);
            let defaultDowntime = this.downTimes.find(x => x.isSelected);
            if (defaultDowntime == null && this.downTimes.length > 0) {
              this.downTimes[0].isSelected = true;
              defaultDowntime = this.downTimes[0];
              this.downtimeTriggerLog(defaultDowntime, DowntimeInteractionSource.DefaultFromUI, true, '');
            }
            else {
              if(this.downTimes.length > 0) {
                this.downtimeTriggerLog(defaultDowntime, DowntimeInteractionSource.DefaultFromDetector, true, '');
              }
              else {
                this.downtimeTriggerLog(defaultDowntime, DowntimeInteractionSource.DefaultFromDetector, false, 'No downtimes detected by the detector.');
              }
            }
            if(!!defaultDowntime) {
              this.selectedDownTime = defaultDowntime;
              this.downTimeChanged.emit(defaultDowntime);              
            }            
          }
          else {
            this.resetGlobals();
          }
        }
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
  }

  getTimestampAsString(dateTime:Moment) {
    return dateTime.format('DD-MMM-YY hh:mm A') + ' UTC';
  }

  getDowntimeLabel(d: DownTime) {
    return d.downTimeLabel;
  }

  private setxAxisPlotBands(includeAllBands:boolean = false, customDownTime?:DownTime):void {
    if(customDownTime == null && this.downTimes.length<1 && this.selectedDownTime == null) {
      this.xAxisPlotBands = [];      
    }
    else {      
      this.xAxisPlotBands = [];
      if(!!customDownTime) {
        var currentPlotBand :xAxisPlotBand = {
          color: '#FCFFC5',
          from:customDownTime.StartTime,
          to:customDownTime.EndTime,
          style:xAxisPlotBandStyles.BehindPlotLines,
          borderWidth:1,
          borderColor:'red'
        };        
        this.xAxisPlotBands.push(currentPlotBand);
      }
      else {
        if(includeAllBands) {
          this.downTimes.forEach(downtime => {
            var currentPlotBand :xAxisPlotBand = {
              color:downtime.isSelected? '#FFCAC4' : '#FCFFC5',
              from:downtime.StartTime,
              to:downtime.EndTime,
              style:xAxisPlotBandStyles.BehindPlotLines           
            };
            this.xAxisPlotBands.push(currentPlotBand);
          });
        }
        else {
          var currentPlotBand :xAxisPlotBand = {
            color: '#FCFFC5',
            from:this.selectedDownTime.StartTime,
            to:this.selectedDownTime.EndTime,
            style:xAxisPlotBandStyles.BehindPlotLines,
            borderWidth:1,
            borderColor:'red'
          };        
          this.xAxisPlotBands.push(currentPlotBand);
        }
      }      
    }
  }

  calculateFabWidth(options: IDropdownOption[]): number {
    //each char 7px  
    let length = 0;
    options.forEach(option => {
      length = Math.max(length, option.text.length);
    });
    return (length * 7)+50;
  }

  selectFabricKey(event: { option: IDropdownOption }) {
    this.selectedKey = this.getKeyForDownTime(event.option.data);
    this.onDownTimeChange(event.option.data, DowntimeInteractionSource.Dropdown);
  }

  private getKeyForDownTime(d: DownTime):string {
    return `${this.getTimestampAsString(d.StartTime)}-${this.getTimestampAsString(d.EndTime)}`
  }

  getDefaultFabricDownTimeEntry():IDropdownOption {
    let d = this.getDefaultDowntimeEntry();
    return {
      key:this.getKeyForDownTime(d),
        text: this.getDowntimeLabel(d),
        ariaLabel: this.getDowntimeLabel(d),
        data: d,
        isSelected: d.isSelected
    } as IDropdownOption;    
  }
  
  getDefaultDowntimeEntry() : DownTime {
    return {
      StartTime: momentNs.utc('1990-01-01 00:00:00'),
      EndTime: momentNs.utc('1990-01-01 00:00:00'),
      isSelected:false,
      downTimeLabel: 'Drag and select a time window on the graph'
    } as DownTime;
  }

  private populateFabricDowntimeDropDown(downTimes: DownTime[]) : void {
    if(!!downTimes) {
      this.fabOptions = [];
      downTimes.forEach(d => {
        this.fabOptions.push({
          key:this.getKeyForDownTime(d),
          text: this.getDowntimeLabel(d),
          ariaLabel: this.getDowntimeLabel(d),
          data: d,
          isSelected: d.isSelected
        });

        if(d.isSelected) {
          this.selectedKey = this.getKeyForDownTime(d);
        }

      });

      this.fabOptions.push(this.getDefaultFabricDownTimeEntry());

      let defaultOption = this.fabOptions.find(x => x.isSelected);
      if (defaultOption == null && this.fabOptions.length > 0) {
        this.fabOptions[0].isSelected = true;
        this.selectedKey = this.getKeyForDownTime(this.fabOptions[0].data);
      }

      this.fabDropdownWidth = this.calculateFabWidth(this.fabOptions);

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
        if(d.isSelected) {
          this.selectedDownTime = d;
        }
        if(this.validateDowntimeEntry(d)) {
          this.downTimes.push(d);
        }        
      }
      let selectedDownTime = this.downTimes.find(downtime => downtime.isSelected == true);
      if(selectedDownTime == null && this.downTimes.length > 0) {
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

  updateDownTimeErrorMessage(msg:string) {
    this.downtimeSelectionErrorStr = msg;
  }

  validateDowntimeEntry(selectedDownTime:DownTime):boolean {
    if(momentNs.duration(selectedDownTime.EndTime.diff(selectedDownTime.StartTime)).asMinutes() < minSupportedDowntimeDuration) {
      return false;
    }
    else {
      return true;
    }
  }

  downtimeTriggerLog(downtime:DownTime, downtimeInteractionSource:string, downtimeTriggerred:boolean, text:string) {
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

  onDownTimeChange(selectedDownTime:DownTime, downtimeInteractionSource:string) {
    if( selectedDownTime.downTimeLabel != this.getDefaultDowntimeEntry().downTimeLabel   && 
         momentNs.duration(selectedDownTime.StartTime.diff(this.startTime)).asMinutes() > 0 &&
         momentNs.duration(this.endTime.diff(selectedDownTime.EndTime)).asMinutes() > 0
    ) {
      if(this.validateDowntimeEntry(selectedDownTime)) {
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
      let reason = selectedDownTime.downTimeLabel === this.getDefaultDowntimeEntry().downTimeLabel?  'Placeholder downtime entry selected' : 'Selected downtime is out of bounds';
      this.downtimeTriggerLog(selectedDownTime, downtimeInteractionSource, false, reason);
    }
  }
  protected logEvent(eventMessage: string, eventProperties?: any, measurements?: any) {
    for (const id of Object.keys(this.detectorEventProperties)) {
      if (this.detectorEventProperties.hasOwnProperty(id)) {
        eventProperties[id] = String(this.detectorEventProperties[id]);
      }
    }
    this.telemetryService.logEvent(eventMessage, eventProperties, measurements);
  }

  showChatButton():boolean {
    return this.isPublic && !this.isAnalysisView && this.cxpChatTrackingId != '' && this.cxpChatUrl != '';
  }


  renderCXPChatButton(){
    if(this.cxpChatTrackingId === '' && this.cxpChatUrl === '') {
      if(this._supportTopicService && this._cxpChatService && this._cxpChatService.isSupportTopicEnabledForLiveChat(this._supportTopicService.supportTopicId)) {
          this.cxpChatTrackingId = this._cxpChatService.generateTrackingId();
          this._cxpChatService.getChatURL(this._supportTopicService.supportTopicId, this.cxpChatTrackingId).subscribe((chatApiResponse:any)=>{
            if (chatApiResponse && chatApiResponse != '') {
              this.cxpChatUrl = chatApiResponse;
            }
          });               
      }
      else {
        var checkOutcome = {
          _supportTopicServiceObj: !!this._supportTopicService,
          supportTopicId: (!!this._supportTopicService)? this._supportTopicService.supportTopicId : '_supportTopicService is NULL',
          _cxpChatService: !!this._cxpChatService,
          isSupportTopicEnabledForLiveChat:  (!!this._supportTopicService && !!this._cxpChatService)? this._cxpChatService.isSupportTopicEnabledForLiveChat(this._supportTopicService.supportTopicId): null
        };

        this._cxpChatService.logChatEligibilityCheck('Call to CXP Chat API skipped', JSON.stringify(checkOutcome));
      }
    }
  }

  populateSupportTopicDocument(){
    if (!this.supportDocumentRendered){
      this._supportTopicService.getSelfHelpContentDocument().subscribe(res => {
        if (res && res.length>0){
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
