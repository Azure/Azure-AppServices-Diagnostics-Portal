import { DetectorResponse, DetectorViewModeWithInsightInfo, DiagnosticData, RenderingType } from '../models/detector';
import { DataTableUtilities } from './datatable-utilities';

export class ResponseUtilities {

    public static ConvertResponseTableToWellFormattedJson(detectorResponse: DetectorResponse): any {

        if (detectorResponse == null || detectorResponse == undefined) {
            return {};
        }

        var detectorResponseJson = {};
        detectorResponseJson['metadata'] = detectorResponse.metadata;
        detectorResponseJson['output'] = [];

        detectorResponse.dataset?.forEach((dataEntry: DiagnosticData) => {

            let componentJson = this.GetComponentJsonByRenderingType(dataEntry);
            if (componentJson && componentJson.title && componentJson.title != '') {
                detectorResponseJson['output'].push(componentJson);
            }
        });

        return detectorResponseJson;
    }

    public static UpdateDetectorResponseWithAsyncChildDetectorsOutput(currentDetectorResponse: any, childDetectorsViewModels: DetectorViewModeWithInsightInfo[]): any {

        var detectorResponseJson = {};
        detectorResponseJson['metadata'] = currentDetectorResponse.metadata;
        detectorResponseJson['output'] = currentDetectorResponse.output;

        var childDetectorsInsightDataset = [];

        childDetectorsViewModels.forEach(viewModel => {

            let childDetectorResponse: DetectorResponse = viewModel.model.response;
            let diagnosticData = childDetectorResponse.dataset.find(ds => (ds.renderingProperties.type == RenderingType.Insights &&
                ds.table.rows &&
                ds.table.rows[0] && ds.table.rows[0][1] &&
                ds.table.rows[0][1].toLowerCase() == viewModel.insightTitle.toLowerCase()));

            if (diagnosticData &&
                !detectorResponseJson['output'].some(element => element.type.toLowerCase() == 'insight' && element.title.toLowerCase() == viewModel.insightTitle.toLowerCase())) {
                childDetectorsInsightDataset.push(diagnosticData);
            }
        });


        childDetectorsInsightDataset.forEach((dataEntry: DiagnosticData) => {

            let componentJson = this.GetComponentJsonByRenderingType(dataEntry);
            if (componentJson && componentJson.title && componentJson.title != '') {
                detectorResponseJson['output'].push(componentJson);
            }
        });

        return detectorResponseJson;
    }

    //#region Components Helpers

    private static GetComponentJsonByRenderingType(diagnosticData: DiagnosticData): any {

        let renderingType = diagnosticData.renderingProperties?.type;
        if (renderingType == undefined || diagnosticData == undefined || diagnosticData.table == undefined)
            return undefined;

        switch (renderingType) {
            case RenderingType.Insights:
                return this.GetInsightJson(diagnosticData);
            case RenderingType.Markdown:
                return this.GetMarkdownJson(diagnosticData);
            case RenderingType.Table:
                return this.GetTableJson(diagnosticData);
            case RenderingType.TimeSeries:
                return this.GetTimeSeriesJson(diagnosticData);
            case RenderingType.DataSummary:
                return this.GetDataSummaryJson(diagnosticData);
            default:
                return undefined;
        }
    }

    private static GetInsightJson(diagnosticData: DiagnosticData): any {

        let componentTable = diagnosticData.table;

        const moreInfo = [];
        let solutions = [];

        let dataNameColumnIndex = DataTableUtilities.getColumnIndexByName(componentTable, 'Data.Name', true);
        let dataValueColumnIndex = DataTableUtilities.getColumnIndexByName(componentTable, 'Data.Value', true);
        let solutionColumnIndex = DataTableUtilities.getColumnIndexByName(componentTable, 'Solutions', true);

        componentTable.rows.forEach(row => {

            if (row[dataNameColumnIndex] != undefined && row[dataNameColumnIndex] != '') {
                moreInfo.push({
                    name: row[dataNameColumnIndex],
                    value: row[dataValueColumnIndex]
                });
            }
        });

        let solutionsString = componentTable.rows[0][solutionColumnIndex];
        if (solutionsString != undefined && solutionsString != '') {

            try {
                const parsedInput = JSON.parse(solutionsString);
                solutions = parsedInput.map((obj: any) => ({
                    Name: obj.Name || "",
                    Description: obj.DescriptionMarkdown || "",
                    InternalInstructions: obj.InternalMarkdown || "",
                }));
            } catch (error) {
                solutions = [];
            }
        }

        return {
            type: "insight",
            status: componentTable.rows[0][0],
            title: componentTable.rows[0][1],
            moreInfo: moreInfo,
            possibleSolutions: solutions
        };
    }

    private static GetTableJson(diagnosticData: DiagnosticData): any {

        let title = diagnosticData.renderingProperties.title;
        let columns = diagnosticData.table.columns.map(column => column.columnName).filter(columnName => columnName);
        if (title == undefined || title == '') {
            title = `Columns - ${columns.join(',')}`;
        }

        return {
            type: "Table",
            title: title,
            description: diagnosticData.renderingProperties.description,
            columns: columns,
            rows: diagnosticData.table.rows
        };
    }

    private static GetMarkdownJson(diagnosticData: DiagnosticData): any {

        let title = diagnosticData.renderingProperties.title && diagnosticData.renderingProperties.title != '' ?
            diagnosticData.renderingProperties.title : diagnosticData.table.rows[0][0]

        return {
            type: "Additional Information",
            title: title,
            moreInfo: diagnosticData.table.rows[0][0]
        };
    }

    private static GetTimeSeriesJson(diagnosticData: DiagnosticData): any {
        return {
            type: "Graph",
            title: '',
            moreInfo: ''
        };
    }

    private static GetDataSummaryJson(diagnosticData: DiagnosticData): any {

        let title = diagnosticData.renderingProperties.title;
        let data = [];
        diagnosticData.table.rows.forEach(row => {
            data.push({ name: row[0], value: row[1] });
        });

        return {
            type: "Data Summary",
            title: title,
            data: data
        };
    }

    //#endregion
}