import {
  Component,
  Pipe,
  PipeTransform,
  Inject,
  OnInit,
  Input,
  ViewEncapsulation,
  ViewChild,
  ChangeDetectorRef,
  AfterViewInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  DiagnosticData,
  StepFlowManager,
  StepViewContainer,
  TelemetryService,
  InfoStepView,
  DropdownStepView,
  StepFlow,
  CheckStepView,
  InputStepView,
  ButtonStepView,
  PromiseCompletionSource
} from 'diagnostic-data';
import { Globals } from 'projects/app-service-diagnostics/src/app/globals';
import { CXPChatCallerService } from 'projects/app-service-diagnostics/src/app/shared-v2/services/cxp-chat-caller.service';
import { PortalService } from 'projects/app-service-diagnostics/src/app/startup/services/portal.service';
import { DataRenderBaseComponent } from 'projects/diagnostic-data/src/lib/components/data-render-base/data-render-base.component';
import { SiteInfoMetaData, Site } from '../../../models/site';
import { ArmService } from '../../../services/arm.service';
import { SiteService } from '../../../services/site.service';
import { CheckManager } from '../network-checks/check-manager';
import { FunctionAppFlowSet } from '../network-checks/functionapp-flows';
import { LogicAppFlowSet } from '../network-checks/logicapp-flows';
import { NetworkCheckFlow } from '../network-checks/network-check-flow';
import { NetworkCheckFlowSet } from '../network-checks/network-check-flow-set';
import { WebAppFlowSet } from '../network-checks/webapp-flow-set';
import { sampleFlow } from '../network-checks/network-check-flows/sampleFlow.js';
import { ApimFlowSet } from '../network-checks/apim-flows';
import { DiagProvider } from 'projects/app-service-diagnostics/src/app/shared/components/tools/network-checks/diag-provider';

@Component({
  selector: 'network-troubleshooter',
  templateUrl: './network-troubleshooter.component.html',
  styleUrls: ['./network-troubleshooter.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NetworkTroubleshooterComponent
  extends DataRenderBaseComponent
  implements OnInit, AfterViewInit
{
  protected processData(data: DiagnosticData) {
    super.processData(data);
  }

  @ViewChild('networkCheckingTool', { static: false })
  networkCheckingToolDiv: any;
  title: string = 'Network/Connectivity Troubleshooter';
  description: string =
    'Check your network connectivity and troubleshoot network issues';
  stepFlowManager: StepFlowManager;
  stepViews: StepViewContainer[] = [];

  diagProvider: DiagProvider;
  siteInfo: SiteInfoMetaData & Site & { fullSiteName: string };
  vnetIntegrationDetected = null;
  openFeedback = false;
  debugMode = false;
  supportTopic: string;

  cxpChatTrackingId: string = '';
  supportTopicId: string = '';
  sapSupportTopicId: string = '';
  cxpChatUrl: string = '';

  logEvent: (
    eventMessage: string,
    properties: { [name: string]: string },
    measurements?: any
  ) => void;
  private _feedbackQuestions =
    '- Is your networking issue resolved? \r\n\r\n\r\n' +
    '- What was the issue?\r\n\r\n\r\n' +
    '- If the issue was not resolved, what can be the reason?\r\n\r\n\r\n' +
    '- What else do you expect from this tool?\r\n';

  //checks: any[];

  constructor(
    private _siteService: SiteService,
    private _armService: ArmService,
    private _telemetryService: TelemetryService,
    private _globals: Globals,
    private _route: ActivatedRoute,
    private _router: Router,
    private _portalService: PortalService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _cxpChatService: CXPChatCallerService
  ) {
    super(_telemetryService);
    try {
      var feedbackPanelConfig = {
        defaultFeedbackText: this._feedbackQuestions,
        detectorName: 'NetworkCheckingTool',
        notResetOnDismissed: true,
        url: window.location.href
      };
      _globals.messagesData.feedbackPanelConfig = feedbackPanelConfig;
      var queryParams = _route.snapshot.queryParams;
      if (queryParams['redirectFrom'] === 'supportTopic') {
        this.supportTopic = queryParams['supportTopic'];
      }
      if (queryParams['supportTopicId']) {
        this.supportTopicId = queryParams['supportTopicId'];
      }
      if (queryParams['sapSupportTopicId']) {
        this.sapSupportTopicId = queryParams['sapSupportTopicId'];
      }
      this.logEvent = (
        eventMessage: string,
        properties: { [name: string]: string } = {},
        measurements?: any
      ) => {
        properties.redirectFrom = queryParams['redirectFrom'];
        _telemetryService.logEvent(eventMessage, properties, measurements);
      };
      window['networkCheckLinkClickEventLogger'] = (
        viewId: string,
        url: string,
        text: string
      ) => {
        this.logEvent('NetworkCheck.LinkClick', { viewId, url, text });
      };
      window['logDebugMessage'] = _globals.logDebugMessage;
      if (window['debugMode']) {
        _telemetryService['telemetryProviders'] = [];
        this.debugMode = window['debugMode'];
        this.loadClassesToGlobalContext();
      }

      var siteInfo = this._siteService.currentSiteMetaData.value;
      var fullSiteName =
        siteInfo.siteName + (siteInfo.slot == '' ? '' : '-' + siteInfo.slot);
      this.stepFlowManager = new StepFlowManager(
        this.stepViews,
        _telemetryService,
        siteInfo.resourceUri,
        this._changeDetectorRef
      );
      this.siteInfo = {
        ...this._siteService.currentSiteMetaData.value,
        ...this._siteService.currentSite.value,
        fullSiteName
      };

      this.diagProvider = new DiagProvider(
        this.siteInfo,
        _armService,
        _siteService,
        _portalService.shellSrc,
        _globals,
        _telemetryService
      );
      this.loadFlowsAsync();
    } catch (error) {
      this.stepFlowManager.errorMsg =
        'Initialization failure, retry may not help.';
      this.stepFlowManager.errorDetailMarkdown =
        '```\r\n\r\n' + error.stack + '\r\n\r\n```';
      _telemetryService.logException(error, 'NetworkCheck.Initialization');
      console.log(error);
    }
  }
  ngAfterViewInit() {
    this.stepFlowManager.setDom(this.networkCheckingToolDiv.nativeElement);
  }

  getProviders(resourceUri: string) {
    resourceUri = resourceUri.toLowerCase();
    var m = resourceUri.match(/.*?\/providers\/microsoft\.(.*?)\/.*/);
    if (m.length >= 2) {
      return m[1];
    } else {
      throw new Error(`unknown provider ${resourceUri}`);
    }
  }

  async loadFlowsAsync(): Promise<void> {
    try {
      var globals = this._globals;
      var mgr = this.stepFlowManager;

      globals.messagesData.currentNetworkCheckFlow = null;
      var telemetryService = this._telemetryService;
      var flowSet: NetworkCheckFlowSet;

      if (this.siteInfo.kind == null) {
        this.siteInfo.kind = this.getProviders(this.siteInfo.resourceUri);
      }

      if (
        this.siteInfo.kind.includes('functionapp') &&
        !this.siteInfo.kind.includes('workflowapp')
      ) {
        // function app
        if (this.supportTopic && this.siteInfo.sku.toLowerCase() == 'dynamic') {
          mgr.addView(
            new InfoStepView({
              id: 'NotSupportedCheck',
              title:
                'VNet integration is not supported for Consumption Plan Function Apps.',
              infoType: 1,
              markdown:
                'For more information please review <a href="https://docs.microsoft.com/en-us/azure/app-service/web-sites-integrate-with-vnet" target="_blank">Integrate your app with an Azure virtual network</a>.'
            })
          );
          return;
        }
        flowSet = new FunctionAppFlowSet();
      } else if (this.siteInfo.kind.includes('workflowapp')) {
        // logic apps
        flowSet = new LogicAppFlowSet();
      } else if (this.siteInfo.kind == 'apimanagement') {
        flowSet = new ApimFlowSet();
      } else {
        flowSet = new WebAppFlowSet();
      }
      var flows = this.processFlows(flowSet.flows);

      if (window.location.hostname == 'localhost' || this.debugMode) {
        flows = flows.concat(this.processFlows([sampleFlow]));
      }

      if (this.debugMode) {
        window['logDebugMessage'] = console.log.bind(console);
        var remoteFlows: any = await CheckManager.loadRemoteCheckAsync(true);
        if (Object.keys(remoteFlows).length > 0) {
          var remoteStepFlows = this.processFlows(remoteFlows, '(debug)');
          flows = flows.concat(remoteStepFlows);
          mgr.addView(
            new CheckStepView({
              id: 'debugCheckLoadingStatus',
              title: `Successfully load ${
                Object.keys(remoteFlows).length
              } debug flow(s)`,
              level: 0
            })
          );
        } else {
          mgr.addView(
            new CheckStepView({
              id: 'debugCheckLoadingStatus',
              title: `Failed to load any debug flow, is local check server running?`,
              level: 2
            })
          );
        }
      }

      var dropDownView = new DropdownStepView({
        id: 'InitialDropDown',
        description: 'Tell us more about the problem you are experiencing:',
        dropdowns: [
          {
            options: flows.map((f) => f.title),
            placeholder: 'Please select...',
            defaultChecked:
              this.supportTopic === 'Outbound Connectivity' ? 0 : undefined
          }
        ],
        expandByDefault: this.supportTopic !== 'Outbound Connectivity',
        async callback(
          dropdownIdx: number,
          selectedIdx: number
        ): Promise<void> {
          mgr.reset(state);
          var flow = flows[selectedIdx];
          globals.messagesData.currentNetworkCheckFlow = flow.id;
          globals.messagesData.feedbackPanelConfig.detectorName =
            'NetworkCheckingTool.' + flow.id;
          telemetryService.logEvent('NetworkCheck.FlowSelected', {
            flowId: flow.id
          });
          mgr.setFlow(flow);
        },
        onDismiss: () => {
          telemetryService.logEvent('NetworkCheck.DropdownDismissed', {});
        },
        afterInit: () => {
          telemetryService.logEvent('NetworkCheck.DropdownInitialized', {
            flowSet: flowSet.name
          });
        }
      });
      var state = mgr.addView(dropDownView);
    } catch (e) {
      console.log('loadFlowsAsync failed', e);
      this.stepFlowManager.errorMsg =
        'Initialization failure: failed to load flows, retry may not help.';
      this.stepFlowManager.errorDetailMarkdown =
        '```\r\n\r\n' + e.stack + '\r\n\r\n```';
      this._telemetryService.logException(e, 'NetworkCheck.Initialization');
    }
  }

  processFlows(flows: any, postfix?: string): StepFlow[] {
    return Object.keys(flows).map((key) => {
      var flow = flows[key];
      if (postfix != null) {
        flow.title += ' ' + postfix;
      }
      flow.id = flow.id || key;
      var siteInfo = this.siteInfo;
      var diagProvider = this.diagProvider;
      var stepFlow: StepFlow = {
        id: flow.id,
        title: flow.title,
        description: flow.description || null,
        async run(flowMgr: StepFlowManager): Promise<void> {
          return flow.func(siteInfo, diagProvider, flowMgr);
        }
      };
      return stepFlow;
    });
  }

  ngOnInit(): void {
    this._telemetryService.logEvent('NetworkCheck.FirstPageLoad');
    //Load CXP chat bubble only when in case submission.
    if (this.sapSupportTopicId || this.supportTopicId) {
      this.renderCXPChatButton();
    }
  }

  convertFromNetworkCheckFlow(flow: NetworkCheckFlow): StepFlow {
    var siteInfo = this.siteInfo;
    var diagProvider = this.diagProvider;
    var stepFlow: StepFlow = {
      id: flow.id,
      title: flow.title,
      description: flow.description || null,
      async run(flowMgr: StepFlowManager): Promise<void> {
        return flow.func(siteInfo, diagProvider, flowMgr);
      }
    };

    return stepFlow;
  }

  loadClassesToGlobalContext() {
    var globalClasses = {
      DropdownStepView,
      CheckStepView,
      InputStepView,
      InfoStepView,
      ButtonStepView,
      PromiseCompletionSource
    };
    Object.keys(globalClasses).forEach(
      (key) => (window[key] = globalClasses[key])
    );
  }

  showChatButton(): boolean {
    return this.cxpChatTrackingId != '' && this.cxpChatUrl != '';
  }

  renderCXPChatButton() {
    if (this.cxpChatTrackingId === '' && this.cxpChatUrl === '') {
      let effectiveSupportTopicId: string = '';
      effectiveSupportTopicId = this.sapSupportTopicId
        ? this.sapSupportTopicId
        : this.supportTopicId;
      if (
        this._cxpChatService &&
        this._cxpChatService.isSupportTopicEnabledForLiveChat(
          effectiveSupportTopicId
        )
      ) {
        this.cxpChatTrackingId = this._cxpChatService.generateTrackingId(
          effectiveSupportTopicId
        );
        this.supportTopicId = effectiveSupportTopicId;
        this._cxpChatService
          .getChatURL(effectiveSupportTopicId, this.cxpChatTrackingId)
          .subscribe((chatApiResponse: any) => {
            if (chatApiResponse && chatApiResponse != '') {
              this.cxpChatUrl = chatApiResponse;
            }
          });
      }
    }
  }
}
