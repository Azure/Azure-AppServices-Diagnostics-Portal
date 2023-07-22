import { DataTableResponseObject, DetectorResponse, DiagnosticData, RenderingType } from '../models/detector';
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
            if (componentJson) {
                detectorResponseJson['output'].push(componentJson);
            }
        });

        return detectorResponseJson;
    }

    //#region Components Helpers

    private static GetComponentJsonByRenderingType(diagnosticData: DiagnosticData): any {

        let renderingType = diagnosticData.renderingProperties?.type;
        if (renderingType == undefined)
            return undefined;

        switch (renderingType) {
            case RenderingType.Insights:
                return this.GetInsightJson(diagnosticData.table);
            case RenderingType.Markdown:
                return this.GetMarkdownJson(diagnosticData.table);
            case RenderingType.Table:
                return this.GetTableJson(diagnosticData.table);
            case RenderingType.TimeSeries:
                return this.GetTimeSeriesJson(diagnosticData.table);
            case RenderingType.DataSummary:
                return this.GetDataSummaryJson(diagnosticData.table);
            default:
                return undefined;
        }
    }

    private static GetInsightJson(componentTable: DataTableResponseObject): any {

        if (componentTable == undefined)
            return undefined;

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

    private static GetTableJson(componentTable: DataTableResponseObject): any {
        return undefined;
    }

    private static GetMarkdownJson(componentTable: DataTableResponseObject): any {
        return undefined;
    }

    private static GetTimeSeriesJson(componentTable: DataTableResponseObject): any {
        return undefined;
    }

    private static GetDataSummaryJson(componentTable: DataTableResponseObject): any {
        return undefined;
    }

    //#endregion
}