import { HealthStatus } from "./detector";

export interface CompilerResponse {
    compilationSucceeded: boolean;
    compilationTraces: string[];
    detailedCompilationTraces: CompilationTraceOutputDetails[];
    references: string[];
    assemblyBytes: string;
    pdbBytes: string;
    assemblyName: string;
    scriptETag: string;
}

export interface CompilationTraceOutputDetails
{
    severity: HealthStatus;
    message: string;
    location?: LocationSpan;
}

export interface LocationSpan
{
    start: Position;
    end: Position;
}

export interface Position
{
    linePos: number;
    colPos: number;
}

export interface RuntimeException {
    ClassName: string;
    Message: string;
    source: string;
    StackTraceString: string;
}

export interface RuntimeResponse {
    timeStamp: string;
    level: string;
    category: string;
    message: string;
    exception: RuntimeException;
    eventId: number;
}

export interface QueryResponse<T> {
    compilationOutput: CompilerResponse;
    runtimeSucceeded: boolean;
    runtimeLogOutput: RuntimeResponse[];
    invocationOutput: T;
}
