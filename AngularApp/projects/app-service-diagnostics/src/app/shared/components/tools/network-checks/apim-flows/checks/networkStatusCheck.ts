import {
  checkResultLevel,
  CheckStepView,
  StatusStyles,
  StepFlowManager,
  StepView
} from 'diagnostic-data';
import { DiagProvider } from '../../diag-provider';
import {
  ConnectivityStatusContract,
  ConnectivityStatusType,
  NetworkStatusByLocationContract
} from '../contracts/NetworkStatus';
import { iconContainerStyles, iconStyles } from '../data/constants';

export const APIM_API_VERSION = '2021-12-01-preview';

function getWorstNetworkStatus(
  statuses: NetworkStatusByLocationContract[]
): checkResultLevel {
  return getWorstStatus(
    statuses.map((service) =>
      getWorstNetworkStatusOfLocation(service.networkStatus.connectivityStatus)
    )
  );
}
function getWorstNetworkStatusOfLocation(
  statuses: ConnectivityStatusContract[]
): checkResultLevel {
  return getWorstStatus(
    statuses.map((service) => rateConnectivityStatus(service))
  );
}

export function getWorstStatus(statuses: checkResultLevel[]): checkResultLevel {
  let worst = checkResultLevel.pass;

  function rating(st: checkResultLevel) {
    return [
      checkResultLevel.error,
      checkResultLevel.fail,
      checkResultLevel.warning,
      checkResultLevel.info,
      checkResultLevel.loading,
      checkResultLevel.pass,
      checkResultLevel.hidden
    ].findIndex((s) => s == st);
  }

  for (let status of statuses) {
    if (rating(status) < rating(worst)) worst = status;
  }

  return worst;
}

function rateConnectivityStatus(
  status: ConnectivityStatusContract
): checkResultLevel {
  switch (status.status) {
    case ConnectivityStatusType.Success:
      return checkResultLevel.pass;
    case ConnectivityStatusType.Init:
      return checkResultLevel.info;
    case ConnectivityStatusType.Fail:
      return status.isOptional
        ? checkResultLevel.warning
        : checkResultLevel.fail;
    default:
      return checkResultLevel.pass;
  }
}

function generateStatusMarkdownTable(
  statuses: ConnectivityStatusContract[]
): string {
  function isThreeHoursOld(t: Date): boolean {
    let now = new Date().getTime();
    return now - 3 * 60 * 60 * 1000 > t.getTime();
  }

  // let lastUpdated = statuses.length > 0 ? `${statuses[0].lastUpdated}` : "";
  let statusIconMarkdown = (
    stale: boolean,
    status: checkResultLevel
  ): string => {
    let statusIcon = (icon: StatusStyles, text: string) =>
      `<div style="${iconContainerStyles}"><i class="${icon}" style="${iconStyles}"></i><span>${text}</span></div>`;
    if (stale) {
      switch (status) {
        case checkResultLevel.pass:
          return statusIcon(StatusStyles.WarningIcon, 'Stale');
        case checkResultLevel.warning:
          return statusIcon(StatusStyles.CriticalIcon, 'Error (Optional)');
        case checkResultLevel.fail:
          return statusIcon(StatusStyles.CriticalIcon, 'Error');
      }
    } else {
      switch (status) {
        case checkResultLevel.pass:
          return statusIcon(StatusStyles.HealthyIcon, 'Success');
        case checkResultLevel.warning:
          return statusIcon(StatusStyles.CriticalIcon, 'Error (Optional)');
        case checkResultLevel.fail:
          return statusIcon(StatusStyles.CriticalIcon, 'Error');
      }
    }
  };

  let nowrap = (text: string) =>
    `<span style="white-space: nowrap">${text}</span>`;

  return (
    `
    | ${nowrap('Status')} | ${nowrap('Name')} | ${nowrap(
      'Resource Group'
    )} | ${nowrap('Details')} |
    |--------|------|----------------|---------|
    ` +
    statuses
      .map((status) => {
        let lastUpdated = new Date(status.lastUpdated);
        let stale = isThreeHoursOld(lastUpdated);
        return `|   ${statusIconMarkdown(
          stale,
          rateConnectivityStatus(status)
        )} | ${status.name} | ${nowrap(status.resourceType)} | ${
          status.error
        } |`;
      })
      .join(`\n`)
  );
}

async function getNetworkStatusView(
  diagProvider: DiagProvider,
  resourceId: string
): Promise<StepView> {
  const networkStatusResponse = await diagProvider.getResource<
    NetworkStatusByLocationContract[]
  >(resourceId + '/networkstatus', APIM_API_VERSION);
  const networkStatuses = networkStatusResponse.body;
  const view = new CheckStepView({
    title: 'Connectivity status',
    level: getWorstNetworkStatus(networkStatuses),
    id: 'firstStep',
    bodyMarkdown:
      'Connectivity to required dependencies (e.g. Azure Storage) is necessary to perform the core functions. ' +
      'If the service cannot connect to optional dependencies (e.g. e-mail server), only the respective functionality ' +
      '(e.g. e-mail notifications) will not work. ' +
      'Stale status means that the service status has not updated in over 3 hours and could mean the service is experiencing network connection issues.',
    subChecks: networkStatuses.map((status) => {
      let worstLocationStatus = getWorstNetworkStatusOfLocation(
        status.networkStatus.connectivityStatus
      );
      return {
        title: status.location,
        level: worstLocationStatus,
        bodyMarkdown: generateStatusMarkdownTable(
          status.networkStatus.connectivityStatus
        )
      };
    })
  });

  return view;
}
export function networkStatusCheck(
  flowMgr: StepFlowManager,
  diagProvider: DiagProvider,
  resourceId: any
) {
  flowMgr.addView(
    getNetworkStatusView(diagProvider, resourceId),
    'Running network checks'
  );
}
