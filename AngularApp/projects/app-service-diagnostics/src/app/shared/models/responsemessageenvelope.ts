export interface ResponseMessageEnvelope<T> {
    id: string;
    name: string;
    type: string;
    kind: string;
    location: string;
    tags: any;
    properties: T;
}

export interface ResponseMessageCollectionEnvelope<T> {
    id: string;
    nextLink: string;
    value: T[];
}

export interface ApolloApiRequestBody {    
    properties: ApolloRequestBodyProperties
}

export interface ApolloRequestBodyProperties {
    triggerCriteria:ApolloApiTriggerCriteria[],
    parameters: Record<string, string>
}

export interface ApolloApiTriggerCriteria {
    name: string;
    value: string;
}
export interface ApolloApiResponse {
    title:string,
    content:string,
    replacementMaps:ApolloReplacementMap
    sections:any[],
    solutionId: string,
    provisioningState:string
}

export interface ApolloReplacementMap {
    diagnostics:ApolloDiagnostics[]
}

export interface ApolloDiagnostics {
    insights:ApolloInsights[],
    solutionId:string,
    status:string,
    statusDetails:string,
    replacementKey:string
}

export interface ApolloInsights {
    id:string,
    title:string,
    results:string,
    importanceLevel:string
}

export enum ApolloDiagApiMap {
    ListDetectors = 'ListDetectors',
    GetDetector = 'GetDetector',
}