import * as momentNs from 'moment';
import { Solution, SolutionButtonOption } from '../components/solution/solution';
import { TableColumnOption } from './data-table';
import { MetricType } from './time-series';

export interface ArmObject {
    id: string;
    name: string;
    type: string;
}

export interface DetectorResponse {
    dataset: DiagnosticData[];
    metadata: DetectorMetaData;
    status: Status;
    dataProvidersMetadata: DataProviderMetadata[];
    suggestedUtterances: any;
}

export interface Status {
    statusId: HealthStatus;
    message: string;
}

export enum HealthStatus {
    Critical,
    Warning,
    Info,
    Success,
    None,
    Onboarding
}

export interface DiagnosticData {
    table: DataTableResponseObject;
    renderingProperties: any; // This is any so that we can correctly case it depending on rendering type
}

export interface DataTableResponseObject {
    // tableName: string;
    columns: DataTableResponseColumn[];
    rows: any[][];
}

export interface DataTableResponseColumn {
    columnName: string;
    dataType?: string;
    columnType?: string;
}

export interface DetectorMetaData {
    id: string;
    name: string;
    description: string;
    author: string;
    supportTopicList: SupportTopic[];
    analysisTypes: string[];
    type: DetectorType;
    category: string;
    score: number;
    internalOnly:boolean;
}

export interface DataProviderMetadata {
    providerName: string;
    propertyBag: PropertyBag[];

}

export interface PropertyBag {
    key: string;
    value: any;
}

export interface KustoPropertyBagValue {
    text: string;
    url: string;
}

export interface SupportTopic {
    id: string;
    pesId: string;
}

export enum DetectorType {
    Detector = "Detector",
    Analysis = "Analysis",
    CategoryOverview = "CategoryOverview",
    DiagnosticTool = "DiagnosticTool"
}
export enum RenderingType {
    NoGraph = 0,
    Table,
    TimeSeries,
    TimeSeriesPerInstance,
    PieChart,
    DataSummary,
    Email,
    Insights,
    DynamicInsight,
    Markdown,
    DetectorList,
    DropDown,
    Cards,
    Solution,
    Guage,
    Form,
    ChangeSets,
    ChangeAnalysisOnboarding,
    ChangesView,
    ApplicationInsightsView,
    DependencyGraph,
    DownTime,
    SummaryCard,
    SearchComponent,
    AppInsightEnablement,
    KeystoneComponent,
    Notification,
    Tab,
    Section,
    StepViews
}

export enum TimeSeriesType {
    LineGraph = 0,
    BarGraph,
    StackedAreaGraph,
    StackedBarGraph
}

export class DataTableDataType {
    static Boolean: string = 'Boolean';
    static Byte: string = 'Byte';
    static DateTime: string = 'DateTime';
    static Double: string = 'Double';
    static Int16: string = 'Int16';
    static Int32: string = 'Int32';
    static Int64: string = 'Int64';
    static String: string = 'String';

    static NumberTypes: string[] = [DataTableDataType.Double, DataTableDataType.Int64, DataTableDataType.Int32, DataTableDataType.Int16];
}

export interface Rendering {
    type: RenderingType;
    title: string;
    description: string;
    isVisible: boolean;
}

export interface DataTableRendering extends Rendering {
    groupByColumnName: string;
    descriptionColumnName: string;
    displayColumnNames: string[];
    tableOptions: any;
    height: any;
    allowColumnSearch: boolean;
    columnOptions: TableColumnOption[];
    searchPlaceholder: string;
}


export interface TimeSeriesRendering extends Rendering {
    defaultValue: number;
    graphType: TimeSeriesType;
    graphOptions: any;
    timestampColumnName: string;
    counterColumnName: string;
    seriesColumns: string[];
    metricType: MetricType;
}

export interface TimeSeriesPerInstanceRendering extends Rendering {
    defaultValue: number;
    graphType: TimeSeriesType;
    graphOptions: any;
    timestampColumnName: string;
    roleInstanceColumnName: string;
    counterColumnName: string;
    valueColumnName: string;
    instanceFilter: string[];
    counterNameFilter: string[];
    selectedInstance: string;
    metricType: MetricType;
}

export interface InsightsRendering extends Rendering {
    insightColumnName: string;
    statusColumnName: string;
    nameColumnName: string;
    valueColumnName: string;
    typeColumnName: string;
    isBackgroundPainted: boolean;
    solutionButtonOption: SolutionButtonOption;
}

export interface NotificationRendering extends Rendering {
    status: HealthStatus;
    solution: Solution;
    expanded: boolean;
}

export interface DynamicInsightRendering extends Rendering {
    status: HealthStatus;
    innerRendering: Rendering;
    expanded: boolean;
}

export interface DetectorListRendering extends Rendering {
    detectorIds: string[];
    additionalParams?: string;
    resourceUri?: string
}

export interface MarkdownRendering extends Rendering {
    isContainerNeeded: boolean;
}

export interface TabRendering extends Rendering {
    itemCount?: number;
    icon: string;
    needsAttention: boolean;
}

export interface SectionRendering extends Rendering {
    isExpand: boolean;
    diagnosticData: DiagnosticData[]
}

export interface RecommendedUtterance {
    sampleUtterance: SampleUtterance;
    score: number;
}

interface SampleUtterance {
    text: string;
    links: string[];
}

export class DownTime {
    StartTime: momentNs.Moment;
    EndTime: momentNs.Moment;
    downTimeLabel: string;
    isSelected: boolean;
}

export const DowntimeInteractionSource = {
    Graph: 'Graph',
    Dropdown: 'Dropdown',
    DefaultFromDetector: 'DefaultFromDetector',
    DefaultFromQueryParams: 'DefaultFromQueryParams',
    DefaultFromUI: 'DefaultFromUI'
};