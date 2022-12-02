import { Injectable } from '@angular/core';
import { IMessageFlowProvider } from '../../interfaces/imessageflowprovider';
import { Message, TextMessage, ButtonListMessage } from '../../models/message';
import { MessageGroup } from '../../models/message-group';
import { RegisterMessageFlowWithFactory } from '../message-flow.factory';
import { SolutionsMessage } from '../../common/solutions-message/solutions-message.component';
import {
  GraphMessage,
  GraphMessageData
} from '../../common/graph-message/graph-message.component';
import { ProblemStatementMessage } from '../../common/problem-statement-message/problem-statement-message.component';
import { IDetectorResponse } from '../../../shared/models/detectorresponse';
import { Observable, BehaviorSubject } from 'rxjs';
import { ISolution } from '../../../shared/models/solution';
import { SiteInfoMetaData } from '../../../shared/models/site';
import { AppAnalysisService } from '../../../shared/services/appanalysis.service';
import { SiteService } from '../../../shared/services/site.service';
import { MessageSender, ButtonActionType } from '../../models/message-enums';
import { AuthService } from '../../../startup/services/auth.service';
import { ResourceType } from '../../../shared/models/portal';

@Injectable()
@RegisterMessageFlowWithFactory()
export class CpuAnalysisChatFlow extends IMessageFlowProvider {
  private cpuDetectorResponseSubject: BehaviorSubject<IDetectorResponse> =
    new BehaviorSubject(null);
  private solutionListSubject: BehaviorSubject<ISolution[]> =
    new BehaviorSubject(null);

  public cpuDetectorResponse: IDetectorResponse;

  private siteInfoMetaData: SiteInfoMetaData;

  private graphData: GraphMessageData = {
    detectorMetricsTitle: 'Overall CPU Usage per Instance',
    detectorMetricsDescription:
      'This graphs shows the total CPU usage on each of the instances where your application is running. ' +
      'Below you can look at a specific instance and see how much CPU each app is consuming.',
    instanceDetailTitle: 'App CPU Usage Breakdown',
    instanceDetailDescription:
      'This shows the average CPU usage, in percent out of 100, for each application in the given time window.',
    detectorMetrics: new BehaviorSubject(null),
    instanceDetailMetrics: new BehaviorSubject(null)
  };

  constructor(
    private _appAnalysisService: AppAnalysisService,
    private _siteService: SiteService,
    private _authService: AuthService
  ) {
    super();
    if (this._authService.resourceType === ResourceType.Site) {
      this._siteService.currentSiteMetaData.subscribe((siteInfo) => {
        if (siteInfo) {
          this.siteInfoMetaData = siteInfo;
        }
      });
    }
  }

  GetMessageFlowList(): MessageGroup[] {
    const messageGroupList: MessageGroup[] = [];

    const cpuAnalysisGroup: MessageGroup = new MessageGroup(
      'cpuanalysis',
      [],
      () => 'feedbackprompt'
    );
    cpuAnalysisGroup.messages.push(
      new TextMessage(
        'I noticed that your app was experiencing high CPU usage within the last 24 hours. Would you like me to show you more details about the issues we found?'
      )
    );
    cpuAnalysisGroup.messages.push(
      new ButtonListMessage(
        this._getButtonListForHealthCheck(),
        'Show CPU Analysis'
      )
    );
    cpuAnalysisGroup.messages.push(
      new TextMessage('Yes I want to see CPU issues', MessageSender.User, 0)
    );
    cpuAnalysisGroup.messages.push(
      new ProblemStatementMessage(this.cpuDetectorResponseSubject, 2000)
    );
    cpuAnalysisGroup.messages.push(
      new TextMessage(
        'Below is your CPU Usage for the last 24 hours. The first graph shows the overall CPU usage on each instance. The second graph shows the CPU usage breakdown per app, according to the specific instance selected in the dropdown.',
        MessageSender.System,
        2000
      )
    );
    cpuAnalysisGroup.messages.push(new GraphMessage(this.graphData, 0));
    cpuAnalysisGroup.messages.push(
      new TextMessage(
        'Would you like to see the troubleshooting suggestions that I have tailored to your specific issue?',
        MessageSender.System,
        3000
      )
    );
    cpuAnalysisGroup.messages.push(
      new ButtonListMessage(
        this._getButtonListForSolutionPrompt(),
        'Show CPU solutions'
      )
    );
    cpuAnalysisGroup.messages.push(
      new TextMessage('Yes!', MessageSender.User, 0)
    );
    cpuAnalysisGroup.messages.push(
      new SolutionsMessage(this.solutionListSubject, 2000)
    );

    messageGroupList.push(cpuAnalysisGroup);

    const noCpuAnalysisGroup: MessageGroup = new MessageGroup(
      'nocpuanalysis',
      [],
      () => 'feedbackprompt'
    );
    noCpuAnalysisGroup.messages.push(
      new TextMessage('No Thanks', MessageSender.User, 0)
    );
    noCpuAnalysisGroup.messages.push(
      new TextMessage(
        "No problem. You can still access all the data by going to 'High CPU' above"
      )
    );

    messageGroupList.push(noCpuAnalysisGroup);

    return messageGroupList;
  }

  private _getCpuDetectorResponse() {
    this._siteService.currentSite.subscribe((site) => {
      if (
        site &&
        site.kind &&
        site.kind.toLowerCase().indexOf('linux') === -1 &&
        site.kind.toLowerCase().indexOf('functionapp') === -1
      ) {
        this._appAnalysisService
          .getDetectorResource(
            this.siteInfoMetaData.subscriptionId,
            this.siteInfoMetaData.resourceGroupName,
            this.siteInfoMetaData.siteName,
            this.siteInfoMetaData.slot,
            'availability',
            'sitecpuanalysis'
          )
          .subscribe((response) => {
            this.cpuDetectorResponse = response;
            this.cpuDetectorResponseSubject.next(this.cpuDetectorResponse);
            this.graphData.detectorMetrics.next(
              response.metrics.filter((x) => x.name === 'Overall CPU Percent')
            );
            this.graphData.instanceDetailMetrics.next(
              response.metrics.filter((x) => x.name !== 'Overall CPU Percent')
            );

            if (response.abnormalTimePeriods.length > 0) {
              this.solutionListSubject.next(
                response.abnormalTimePeriods[
                  response.abnormalTimePeriods.length - 1
                ].solutions
              );
            }
          });
      }
    });
  }

  private _getButtonListForHealthCheck(): any {
    return [
      {
        title: 'Yes I want to see CPU issues',
        type: ButtonActionType.Continue,
        next_key: ''
      },
      {
        title: 'No Thanks',
        type: ButtonActionType.SwitchToOtherMessageGroup,
        next_key: 'nocpuanalysis'
      }
    ];
  }

  private _getButtonListForSolutionPrompt(): any {
    return [
      {
        title: 'Yes I would like to see the troubleshooting options',
        type: ButtonActionType.Continue,
        next_key: ''
      },
      {
        title: 'No Thanks',
        type: ButtonActionType.SwitchToOtherMessageGroup,
        next_key: 'nocpuanalysis'
      }
    ];
  }
}
