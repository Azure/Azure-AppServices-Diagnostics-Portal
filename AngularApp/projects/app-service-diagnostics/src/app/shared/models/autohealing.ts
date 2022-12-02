export enum AutoHealActionType {
  Recycle = 0,
  LogEvent = 1,
  CustomAction = 2
}

export class Features {
  AutoHealEnabled: boolean;
}

export class AutoHealSettings {
  autoHealEnabled: boolean;
  autoHealRules: AutoHealRules;
}

export class AutoHealRules {
  triggers: AutoHealTriggers;
  actions: AutoHealActions;
}

export class AutoHealTriggers {
  requests: RequestsBasedTrigger;
  privateBytesInKB: number;
  statusCodes: StatusCodesBasedTrigger[];
  statusCodesRange: StatusCodesRangeBasedTrigger[];
  slowRequests: SlowRequestsBasedTrigger;
  slowRequestsWithPath: SlowRequestsBasedTrigger[];
}

export class RequestsBasedTrigger {
  count: number;
  timeInterval: string;
}

export class StatusCodesBasedTrigger extends RequestsBasedTrigger {
  status: number;
  subStatus: number;
  win32Status: number;
  path: string;
}

export class StatusCodesRangeBasedTrigger extends RequestsBasedTrigger {
  path: string;
  statusCodes: string;
}

export class SlowRequestsBasedTrigger extends RequestsBasedTrigger {
  timeTaken: string;
  path: string;
}

export class AutoHealActions {
  actionType: AutoHealActionType;
  customAction: AutoHealCustomAction;
  minProcessExecutionTime: string;
}

export class AutoHealCustomAction {
  exe: string;
  parameters: string;
}

export class StatusCodeRules {
  statusCodes: StatusCodesBasedTrigger[];
  statusCodesRange: StatusCodesRangeBasedTrigger[];

  constructor(
    _statusCodes: StatusCodesBasedTrigger[],
    _statusCodesRange: StatusCodesRangeBasedTrigger[]
  ) {
    this.statusCodes = _statusCodes;
    this.statusCodesRange = _statusCodesRange;
  }
}

export class SlowRequestsRules {
  slowRequests: SlowRequestsBasedTrigger;
  slowRequestsWithPath: SlowRequestsBasedTrigger[];

  constructor(
    _slowRequests: SlowRequestsBasedTrigger,
    _slowRequestsWithPath: SlowRequestsBasedTrigger[]
  ) {
    this.slowRequests = _slowRequests;
    this.slowRequestsWithPath = _slowRequestsWithPath;
  }
}
