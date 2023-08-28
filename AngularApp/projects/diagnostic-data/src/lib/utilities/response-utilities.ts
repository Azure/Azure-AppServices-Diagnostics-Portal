import { DetectorResponse, DetectorViewModeWithInsightInfo, DiagnosticData, RenderingType } from '../models/detector';
import { InputType } from '../models/form';
import { DataTableUtilities } from './datatable-utilities';

export class ResponseUtilities {

    public static ConvertResponseTableToWellFormattedJson(detectorResponse: DetectorResponse): any {

        if (detectorResponse == null || detectorResponse == undefined) {
            return {};
        }

        var detectorResponseJson = {};
        detectorResponseJson['metadata'] = detectorResponse.metadata;
        detectorResponseJson['output'] = this.ParseDetectorResponseInternal(detectorResponse);
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
            else if (!diagnosticData) {
                // This can happen if the child detectors has no insights
                // In this case, its better to add the child detector name and description as informational insight

                let temporaryDiagnosticData = {
                    renderingProperties: {
                        type: RenderingType.Insights
                    },
                    table: {
                        columns: [],
                        rows: [
                            [
                                "Info",
                                `${childDetectorResponse.metadata.name}`
                            ]
                        ]
                    }
                };

                childDetectorsInsightDataset.push(temporaryDiagnosticData);
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

    public static UpdateDetectorResponseWithFormsResponse(currentDetectorResponse: any, formId: any, formResponse: DetectorResponse): any {
        var detectorResponseJson = {};
        detectorResponseJson['metadata'] = currentDetectorResponse.metadata;
        detectorResponseJson['output'] = currentDetectorResponse.output;

        let formElement = detectorResponseJson['output'].find(p => p.type === 'input' && p.id == formId);
        if (formElement) {
            formElement['output'] = this.ParseDetectorResponseInternal(formResponse);
        }

        return detectorResponseJson;
    }

    public static MarkdownToText(markdown) {
        const regex = /(?:__|[*#])|\[(.*?)\]\(.*?\)/gm;
        const plainText = markdown.replace(regex, '$1');
        return plainText;
    }

    //#region Components Helpers

    private static ParseDetectorResponseInternal(detectorResponse: DetectorResponse) {

        var output = [];

        detectorResponse.dataset?.forEach((dataEntry: DiagnosticData) => {

            let componentJson = this.GetComponentJsonByRenderingType(dataEntry);
            if (componentJson) {
                output.push(componentJson);
            }
        });

        return output;
    }

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
            case RenderingType.Form:
                return this.GetFormJson(diagnosticData);
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
            diagnosticData.renderingProperties.title : diagnosticData.table.rows[0][0];

        title = title.replace('<markdown>', '').replace('</markdown>', '');
        let moreInfo = diagnosticData.table.rows[0][0].replace('<markdown>', '').replace('</markdown>', '');

        return {
            type: "Additional Information",
            title: title,
            moreInfo: moreInfo
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

    private static GetFormJson(diagnosticData: DiagnosticData): any {

        let dt = diagnosticData.table;
        let id = dt.rows[0][0];
        let title = dt.rows[0][1] != '' ? dt.rows[0][1] : 'user input';
        let formInputs = dt.rows[0][2];
        let inputs = [];

        for (let ip = 0; ip < formInputs.length; ip++) {

            let inputType = formInputs[ip]["inputType"];

            switch (inputType) {
                case InputType.TextBox:
                    inputs.push({
                        'inputType': 'textbox',
                        'label': formInputs[ip]["label"]
                    });
                    break;
                case InputType.RadioButton:
                    inputs.push({
                        'inputType': 'radio options',
                        'label': formInputs[ip]["label"],
                        'options': formInputs[ip]["items"],
                        'tooltip': formInputs[ip]["toolTip"] != undefined ? formInputs[ip]["toolTip"] : ""
                    });
                    break;
                case InputType.DropDown:
                    inputs.push({
                        'inputType': 'dropdown',
                        'label': formInputs[ip]["label"],
                        'options': formInputs[ip]["dropdownOptions"],
                        'toolTip': formInputs[ip]["toolTip"] != undefined ? formInputs[ip]["toolTip"] : ""
                    });
                    break;
                case InputType.DateTimePicker:
                    inputs.push({
                        'inputType': 'datetimepicker',
                        'label': formInputs[ip]["label"]
                    });
                    break;
                case InputType.Button:
                    inputs.push({
                        'inputType': 'button',
                        'label': formInputs[ip]["label"]
                    });
                    break;
            }
        }

        return {
            type: 'input',
            title: title,
            id: id,
            inputs: inputs,
            output: []
        };
    }

    //#endregion
}