import * as pdfMake from 'pdfmake/build/pdfmake';
import { Observable } from 'rxjs';
import {
  ResiliencyFeature,
  ResiliencyReportData,
  ResiliencyResource
} from '../models/resiliencyReportData';
import { DataTableResponseObject } from '../models/detector';

export class ResiliencyScoreReportHelper {
  // Creates the ResiliencyResource object from a DataTableResponseObject and calls PDFMake to generate the PDF using the provided file name
  static generateResiliencyReport(
    table: DataTableResponseObject,
    fileName: string,
    generatedOn: string,
    vfsfonts: any
  ) {
    const customerNameRow = 0;
    const resiliencyResourceListRow = 1;
    const resiliencyFeaturesListRow = 2;
    let _fileName: string = fileName;
    let _generatedOn: string = generatedOn;
    let customerName: string;

    customerName = JSON.parse(table.rows[0][customerNameRow]).CustomerName;
    let resiliencyResourceList: ResiliencyResource[] = JSON.parse(
      table.rows[resiliencyResourceListRow][0]
    );

    let i = 0;
    for (
      let j: number = resiliencyFeaturesListRow;
      j < resiliencyFeaturesListRow + resiliencyResourceList.length;
      j++
    ) {
      let resiliencyFeaturesList: ResiliencyFeature[];
      resiliencyFeaturesList = JSON.parse(table.rows[j][0]);
      resiliencyResourceList[i].ResiliencyFeaturesList = resiliencyFeaturesList;
      i++;
    }
    let resiliencyReportData = new ResiliencyReportData(
      customerName,
      resiliencyResourceList
    );
    this.generatePDF(resiliencyReportData, _fileName, _generatedOn, vfsfonts);
  }

  //
  // Calculates the background color for the Score
  // 80 to 100 = Green
  // 60 to 80  = Yellow
  //  0 to 60  = Red
  //
  static ScoreColor(score: number) {
    if (arguments[0] < 60) {
      return '#f50f2f'; //red
    } else if (arguments[0] < 80) {
      return '#f5d00f'; //yellow
    } else if (arguments[0] <= 100) {
      return '#06a11a'; //green
    } else {
      return 'white'; //if undefined or more than 100 set to white
    }
  }

  // Returns an adjective based on the score:
  // 90-100: Excellent
  // 80-89: Very good
  // 70-79: Good
  // 60-69: Fair
  // 0-59: Poor
  static ScoreAdjective(score: number) {
    switch (true) {
      case score >= 90:
        return 'Excellent';
      case score >= 80 && score < 90:
        return 'Very good';
      case score >= 70 && score < 80:
        return 'Good';
      case score >= 60 && score < 70:
        return 'Fair';
      case score >= 0 && score < 60:
        return 'Poor';
      default:
        return 'Poor';
    }
  }

  // Returns X2 coordinates for the Score gauge needle based on the score:
  static NeedleX2(score: number) {
    switch (true) {
      case score == 100:
        return 339;
      case score >= 95 && score < 100:
        return 340;
      case score >= 90 && score < 95:
        return 340;
      case score >= 85 && score < 90:
        return 338;
      case score >= 80 && score < 85:
        return 333;
      case score >= 75 && score < 80:
        return 326;
      case score >= 70 && score < 75:
        return 317;
      case score >= 65 && score < 70:
        return 306;
      case score >= 60 && score < 65:
        return 293;
      case score >= 55 && score < 60:
        return 278;
      case score >= 51 && score < 55:
        return 262;
      case score == 50:
        return 246;
      case score >= 45 && score < 50:
        return 230;
      case score >= 40 && score < 45:
        return 214;
      case score >= 35 && score < 40:
        return 199;
      case score >= 30 && score < 35:
        return 186;
      case score >= 25 && score < 30:
        return 175;
      case score >= 20 && score < 25:
        return 166;
      case score >= 15 && score < 20:
        return 159;
      case score >= 10 && score < 15:
        return 154;
      case score >= 5 && score < 10:
        return 152;
      case score >= 1 && score < 5:
        return 153;
      case score == 0:
        return 153;
      default:
        return 153;
    }
  }

  // Returns Y2 coordinates for the Score gauge needle based on the score:
  static NeedleY2(score: number) {
    switch (true) {
      case score == 100:
        return 125;
      case score >= 95 && score < 100:
        return 115;
      case score >= 90 && score < 100:
        return 102;
      case score >= 85 && score < 90:
        return 88;
      case score >= 80 && score < 85:
        return 74;
      case score >= 75 && score < 80:
        return 60;
      case score >= 70 && score < 75:
        return 48;
      case score >= 65 && score < 70:
        return 37;
      case score >= 60 && score < 65:
        return 48;
      case score >= 55 && score < 60:
        return 21;
      case score >= 51 && score < 55:
        return 17;
      case score == 50:
        return 15;
      case score >= 45 && score < 50:
        return 17;
      case score >= 40 && score < 45:
        return 21;
      case score >= 35 && score < 40:
        return 28;
      case score >= 30 && score < 35:
        return 37;
      case score >= 25 && score < 30:
        return 48;
      case score >= 20 && score < 25:
        return 60;
      case score >= 15 && score < 20:
        return 74;
      case score >= 10 && score < 15:
        return 88;
      case score >= 5 && score < 10:
        return 102;
      case score >= 1 && score < 5:
        return 115;
      case score == 0:
        return 125;
      default:
        return 125;
    }
  }

  //
  // Provides the Fully implemented, Partially implemented and Not implemented icons based on the Feature result
  // 0 = Not Implemented
  // 1 = Partially Implemented
  // 2 or any other = Fully Implemented
  //
  static ImplementedImage(featureScore) {
    if (arguments[0] == 0) {
      return 'data:image/png;base64,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';
    } else if (arguments[0] == 1) {
      return 'data:image/png;base64,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';
    } else {
      return 'data:image/png;base64,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';
    }
  }
  //
  // Provides passing grade per score
  // 0 = Fail
  // 1 = N/A
  // 2 or any other = Pass
  //
  static ScoreGrade(featureScore) {
    if (arguments[0] == 0) {
      return 'Fail';
    } else if (arguments[0] == 1) {
      return 'N/A';
    } else {
      return 'Pass';
    }
  }

  //
  // Calculates the font color for the grade
  // 2 = Green
  // 1  = Yellow
  // 0  = Red
  //
  static GradeColor(score) {
    if (arguments[0] == 0) {
      return '#f50f2f'; //red
    } else if (arguments[0] == 1) {
      return '#f5d00f'; //yellow
    } else return '#538135'; //green
  }

  // Creating Resiliency status per feature table

  static ResiliencyStatusPerFeatureTable(
    resiliencyReportData: ResiliencyReportData
  ) {
    let headers = `[{ text: 'Feature/Site name', style: 'rspfTableheader', margin: [0, 10] }, { text: '${resiliencyReportData.ResiliencyResourceList[0].Name}', style: 'rspfTableheader', margin: [0, 10] }, `;
    //`{ text: ${resiliencyReportData.ResiliencyResourceList[1].Name}, style: 'rspfTableheader', margin: [0, 10] }, { text: ${resiliencyReportData.ResiliencyResourceList[2].Name}, style: 'rspfTableheader', margin: [0, 10] }],`
    let resiliencyStatusPerFeatureTable: string = '';

    //Generating headers
    for (
      let i: number = 1;
      i < resiliencyReportData.ResiliencyResourceList.length;
      i++
    ) {
      headers = `${headers}{ text: '${resiliencyReportData.ResiliencyResourceList[i].Name}', style: 'rspfTableheader', margin: [0, 10] }`;
      if (i + 1 < resiliencyReportData.ResiliencyResourceList.length) {
        headers = `${headers},`;
      } else {
        headers = `${headers}],`;
      }
    }

    //Adding rows for each feature
    let rows = '';
    for (
      let i: number = 0;
      i <
      resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList
        .length;
      i++
    ) {
      rows = `${rows}[{ text: '${resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList[i].Name}', style: 'rspfTableheader', }, `;
      for (
        let j: number = 0;
        j < resiliencyReportData.ResiliencyResourceList.length;
        j++
      ) {
        rows = `${rows}{ margin: [50, 2], image: ${ResiliencyScoreReportHelper.ImplementedImage(
          resiliencyReportData.ResiliencyResourceList[j].ResiliencyFeaturesList[
            i
          ].ImplementationGrade
        )}, fit: [20, 20] }`;
        if (j + 1 < resiliencyReportData.ResiliencyResourceList.length) {
          rows = `${rows},`;
        } else {
          rows = `${rows}],`;
        }
      }
    }
    let finalStr = `${headers}${rows}`;
    return finalStr.replace(/^"|"$/g, '');
  }

  // Prints date and time in which the report was generated
  static generatedOn() {
    let d = new Date();
    return d.toISOString();
  }

  static generatePDF(
    resiliencyReportData: ResiliencyReportData,
    fileName: string,
    generatedOn: string,
    vfsfonts: any
  ) {
    let vfsFonts = vfsfonts;
    var docDefinition = {
      footer: function (currentPage, pageCount, pageSize) {
        return [
          {
            columns: [
              {
                width: 60,
                text: ''
              },
              {
                width: 15,
                height: 15,
                image:
                  'data:image/jpeg;base64,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'
              },
              {
                text: '\n  Powered by Azure App Service',
                alignment: 'left',
                fontSize: 6,
                width: 200
              },
              {
                text: `\n${currentPage.toString()} of ${pageCount}`,
                alignment: 'center',
                fontSize: 6,
                width: pageSize.width - 535
              },
              {
                text: `\nReport generated on: ${generatedOn}`,
                alignment: 'right',
                fontSize: 6,
                width: 200
              },
              {
                width: 60,
                text: ''
              }
            ]
          }
        ];
      },
      pageSize: 'LETTER',
      pageOrientation: 'portrait',
      pageMargins: 60,
      content: [
        // Resiliency Score page
        {
          absolutePosition: { x: 60, y: 15 },
          text: [
            {
              text: 'Azure App Service Resiliency Score report for: ',
              style: 'header3',
              fontSize: 16,
              pageOrientation: 'portrait'
            },
            {
              text: resiliencyReportData.CustomerName,
              bold: true,
              style: 'header3',
              fontSize: 16,
              pageOrientation: 'portrait'
            }
          ]
        },
        {
          absolutePosition: { x: 60, y: 35 },
          text: `\nReport generated on: ${generatedOn}`,
          style: 'header3',
          fontSize: 11
        },
        {
          absolutePosition: { x: 60, y: 63 },
          alignment: 'center',
          text: "Your Web App's Resiliency Score",
          style: 'header3',
          fontSize: 13
        },
        {
          absolutePosition: { x: 60, y: 75 },
          canvas: [
            {
              // Gauge
              type: 'ellipse',
              color: 'black',
              lineColor: 'black',
              x: 246,
              y: 110,
              r1: 100,
              r2: 100,
              linearGradient: [
                'red',
                'red',
                'red',
                'red',
                'red',
                'red',
                'red',
                'red',
                'red',
                'red',
                'red',
                'red',
                'red',
                'yellow',
                'yellow',
                'green',
                'green',
                'green'
              ]
            },
            // 0 Red
            {
              type: 'line',
              color: 'red',
              lineColor: 'red',
              x1: 246,
              y1: 110,
              x2: 295,
              y2: 23,
              lineWidth: 10
            },
            // 60 Yellow color
            {
              type: 'line',
              color: 'yellow',
              lineColor: 'yellow',
              x1: 246,
              y1: 110,
              x2: 298,
              y2: 25,
              lineWidth: 10
            },
            {
              type: 'line',
              color: 'yellow',
              lineColor: 'yellow',
              x1: 246,
              y1: 110,
              x2: 304,
              y2: 30,
              lineWidth: 10
            },
            {
              type: 'line',
              color: 'yellow',
              lineColor: 'yellow',
              x1: 246,
              y1: 110,
              x2: 308,
              y2: 35,
              lineWidth: 10
            },
            {
              type: 'line',
              color: 'yellow',
              lineColor: 'yellow',
              x1: 246,
              y1: 110,
              x2: 316,
              y2: 39,
              lineWidth: 10
            },
            {
              type: 'line',
              color: 'yellow',
              lineColor: 'yellow',
              x1: 246,
              y1: 110,
              x2: 319,
              y2: 42,
              lineWidth: 10
            },
            {
              type: 'line',
              color: 'yellow',
              lineColor: 'yellow',
              x1: 246,
              y1: 110,
              x2: 322,
              y2: 45,
              lineWidth: 10
            },
            {
              type: 'line',
              color: 'yellow',
              lineColor: 'yellow',
              x1: 246,
              y1: 110,
              x2: 326,
              y2: 49,
              lineWidth: 10
            },
            {
              type: 'line',
              color: 'yellow',
              lineColor: 'yellow',
              x1: 246,
              y1: 110,
              x2: 329,
              y2: 54,
              lineWidth: 10
            },
            {
              type: 'line',
              color: 'yellow',
              lineColor: 'yellow',
              x1: 246,
              y1: 110,
              x2: 331,
              y2: 57,
              lineWidth: 10
            },
            {
              type: 'line',
              color: 'yellow',
              lineColor: 'yellow',
              x1: 246,
              y1: 110,
              x2: 335,
              y2: 64,
              lineWidth: 10
            },
            //Green
            {
              type: 'line',
              color: 'green',
              lineColor: 'green',
              x1: 246,
              y1: 110,
              x2: 335,
              y2: 75,
              lineWidth: 7
            },
            {
              type: 'line',
              color: 'green',
              lineColor: 'green',
              x1: 246,
              y1: 110,
              x2: 337,
              y2: 75,
              lineWidth: 5
            },
            {
              //Gauge needle's light
              type: 'line',
              color: 'white',
              lineColor: 'white',
              x1: 246,
              y1: 110,
              x2: ResiliencyScoreReportHelper.NeedleX2(
                resiliencyReportData.ResiliencyResourceList[0].OverallScore
              ),
              y2: ResiliencyScoreReportHelper.NeedleY2(
                resiliencyReportData.ResiliencyResourceList[0].OverallScore
              ),
              lineWidth: 10,
              lineCap: 'round'
            },
            {
              //Gauge needle
              type: 'line',
              color: 'white',
              lineColor: 'black',
              x1: 246,
              y1: 110,
              x2: ResiliencyScoreReportHelper.NeedleX2(
                resiliencyReportData.ResiliencyResourceList[0].OverallScore
              ),
              y2: ResiliencyScoreReportHelper.NeedleY2(
                resiliencyReportData.ResiliencyResourceList[0].OverallScore
              ),
              lineWidth: 6,
              lineCap: 'round'
            },

            // Gauge's outer black border
            {
              type: 'ellipse',
              lineColor: 'black',
              x: 246,
              y: 110,
              r1: 100,
              r2: 100,
              lineWidth: 1
            },
            {
              //Guage's central circle
              type: 'ellipse',
              color: 'white',
              lineColor: 'black',
              x: 246,
              y: 110,
              r1: 80,
              r2: 80
            },
            {
              //Erasing gauge's bottom
              type: 'rect',
              x: 146,
              y: 130,
              w: 200,
              h: 90,
              r: 0,
              lineColor: 'white',
              color: 'white'
            }
          ]
        },
        // 0 in gauge
        {
          absolutePosition: { x: 217, y: 208 },
          text: [{ text: '0', color: 'black', fontSize: 10 }]
        },
        // 100 in gauge
        {
          absolutePosition: { x: 385, y: 208 },
          text: [{ text: '100', color: 'black', fontSize: 10 }]
        },
        // 60 marker in gauge (yellow)
        {
          absolutePosition: { x: 354, y: 86 },
          text: [{ text: '60', color: 'black', fontSize: 10 }]
        },
        // 80 marker in gauge (green)
        {
          absolutePosition: { x: 400, y: 136 },
          text: [{ text: '80', color: 'black', fontSize: 10 }]
        },
        // Site name
        {
          absolutePosition: { x: 60, y: 215 },
          columns: [
            {
              alignment: 'center',
              text: [
                {
                  text: 'Site: ',
                  margin: [5, 2, 5, 2],
                  width: 150,
                  color: 'black',
                  fontSize: 17
                },
                {
                  text: resiliencyReportData.ResiliencyResourceList[0].Name,
                  margin: [5, 2, 5, 2],
                  width: 150,
                  color: 'black',
                  fontSize: 17
                }
              ]
            }
          ]
        },
        {
          // Score adjective
          absolutePosition: { x: 60, y: 130 },
          columns: [
            {
              alignment: 'center',
              text: [
                {
                  text: ResiliencyScoreReportHelper.ScoreAdjective(
                    resiliencyReportData.ResiliencyResourceList[0].OverallScore
                  ),
                  color: 'black',
                  fontSize: 15,
                  margin: [5, 2, 5, 2],
                  width: 160
                }
              ]
            }
          ]
        },
        {
          // Score
          columns: [
            {
              alignment: 'center',
              absolutePosition: { x: 60, y: 150 },
              text: [
                {
                  text: resiliencyReportData.ResiliencyResourceList[0]
                    .OverallScore,
                  color: 'black',
                  fontSize: 50,
                  margin: [5, 2, 5, 2],
                  width: 160
                }
              ]
            }
          ]
        },
        {
          absolutePosition: { x: 60, y: 240 },
          alignment: 'justify',
          style: 'paragraph',
          text: "This is a weighted calculation based on which best practices were followed. A score of 80 or above is considered highly resilient and it will be marked as green. A score of 100% doesn't mean that the Web App will never be down but rather that it has implemented 100% of our resiliency best practices."
          //fontSize: 11,
        },
        // end of Resiliency score page
        // Resiliency status per feature table
        {
          absolutePosition: { x: 60, y: 293 },
          text: 'Contributing factors to your score and how you can improve it',
          style: 'header3'
        },
        {
          text: '\n'
        },
        {
          absolutePosition: { x: 60, y: 327 },
          columns: [
            // Resiliency score table
            {
              text: '\n',
              width: 102
            },
            {
              // Resiliency status per feature table
              table: {
                headerRows: 1,
                widths: [159, 109],
                body: [
                  [
                    {
                      text: 'Feature/Site name',
                      style: 'rspfTableheader',
                      margin: [0, 10]
                    },
                    {
                      text: resiliencyReportData.ResiliencyResourceList[0].Name,
                      style: 'rspfTableheader',
                      margin: [0, 10]
                    }
                  ],
                  [
                    {
                      text: resiliencyReportData.ResiliencyResourceList[0]
                        .ResiliencyFeaturesList[0].Name,
                      style: 'rspfTableheader',
                      linkToDestination: 'useMultipleInstances',
                      decoration: 'underline'
                    },
                    {
                      margin: [50, 2],
                      image: ResiliencyScoreReportHelper.ImplementedImage(
                        resiliencyReportData.ResiliencyResourceList[0]
                          .ResiliencyFeaturesList[0].ImplementationGrade
                      ),
                      fit: [20, 20],
                      linkToDestination: 'statusUseMultipleInstances'
                    }
                  ],
                  [
                    {
                      text: resiliencyReportData.ResiliencyResourceList[0]
                        .ResiliencyFeaturesList[1].Name,
                      style: 'rspfTableheader',
                      linkToDestination: 'healthCheck',
                      decoration: 'underline'
                    },
                    {
                      margin: [50, 2],
                      image: ResiliencyScoreReportHelper.ImplementedImage(
                        resiliencyReportData.ResiliencyResourceList[0]
                          .ResiliencyFeaturesList[1].ImplementationGrade
                      ),
                      fit: [20, 20],
                      linkToDestination: 'statusHealthCheck'
                    }
                  ],
                  [
                    {
                      text: resiliencyReportData.ResiliencyResourceList[0]
                        .ResiliencyFeaturesList[2].Name,
                      style: 'rspfTableheader',
                      linkToDestination: 'autoHeal',
                      decoration: 'underline'
                    },
                    {
                      margin: [50, 2],
                      image: ResiliencyScoreReportHelper.ImplementedImage(
                        resiliencyReportData.ResiliencyResourceList[0]
                          .ResiliencyFeaturesList[2].ImplementationGrade
                      ),
                      fit: [20, 20],
                      linkToDestination: 'statusAutoHeal'
                    }
                  ],
                  [
                    {
                      text: resiliencyReportData.ResiliencyResourceList[0]
                        .ResiliencyFeaturesList[3].Name,
                      style: 'rspfTableheader',
                      linkToDestination: 'deployMultipleRegions',
                      decoration: 'underline'
                    },
                    {
                      margin: [50, 2],
                      image: ResiliencyScoreReportHelper.ImplementedImage(
                        resiliencyReportData.ResiliencyResourceList[0]
                          .ResiliencyFeaturesList[3].ImplementationGrade
                      ),
                      fit: [20, 20],
                      linkToDestination: 'statusDeployMultipleRegions'
                    }
                  ],
                  [
                    {
                      text: resiliencyReportData.ResiliencyResourceList[0]
                        .ResiliencyFeaturesList[4].Name,
                      style: 'rspfTableheader',
                      linkToDestination: 'regionalPairing',
                      decoration: 'underline'
                    },
                    {
                      margin: [50, 2],
                      image: ResiliencyScoreReportHelper.ImplementedImage(
                        resiliencyReportData.ResiliencyResourceList[0]
                          .ResiliencyFeaturesList[4].ImplementationGrade
                      ),
                      fit: [20, 20],
                      linkToDestination: ' statusRegionalPairing'
                    }
                  ],
                  // [
                  //     { text: resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList[5].Name, style: 'rspfTableheader' },
                  //     { margin: [50, 2], image: ResiliencyScoreReportHelper.ImplementedImage(resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList[5].ImplementationGrade), fit: [20, 20] }
                  // ],
                  [
                    {
                      text: resiliencyReportData.ResiliencyResourceList[0]
                        .ResiliencyFeaturesList[6].Name,
                      style: 'rspfTableheader',
                      linkToDestination: 'appDensity',
                      decoration: 'underline'
                    },
                    {
                      margin: [50, 2],
                      image: ResiliencyScoreReportHelper.ImplementedImage(
                        resiliencyReportData.ResiliencyResourceList[0]
                          .ResiliencyFeaturesList[6].ImplementationGrade
                      ),
                      fit: [20, 20],
                      linkToDestination: 'statusAppDensity'
                    }
                  ],
                  // [
                  //     { text: resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList[7].Name, style: 'rspfTableheader' },
                  //     { margin: [50, 2], image: ResiliencyScoreReportHelper.ImplementedImage(resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList[7].ImplementationGrade), fit: [20, 20] }
                  // ],
                  [
                    {
                      text: resiliencyReportData.ResiliencyResourceList[0]
                        .ResiliencyFeaturesList[8].Name,
                      style: 'rspfTableheader',
                      linkToDestination: 'alwaysOn',
                      decoration: 'underline'
                    },
                    {
                      margin: [50, 2],
                      image: ResiliencyScoreReportHelper.ImplementedImage(
                        resiliencyReportData.ResiliencyResourceList[0]
                          .ResiliencyFeaturesList[8].ImplementationGrade
                      ),
                      fit: [20, 20],
                      linkToDestination: 'statusAlwaysOn'
                    }
                  ],
                  [
                    {
                      text: resiliencyReportData.ResiliencyResourceList[0]
                        .ResiliencyFeaturesList[9].Name,
                      style: 'rspfTableheader',
                      linkToDestination: 'appServiceAdvisor',
                      decoration: 'underline'
                    },
                    {
                      margin: [50, 2],
                      image: ResiliencyScoreReportHelper.ImplementedImage(
                        resiliencyReportData.ResiliencyResourceList[0]
                          .ResiliencyFeaturesList[9].ImplementationGrade
                      ),
                      fit: [20, 20],
                      linkToDestination: 'statusAppServiceAdvisor'
                    }
                  ],
                  [
                    {
                      text: resiliencyReportData.ResiliencyResourceList[0]
                        .ResiliencyFeaturesList[10].Name,
                      style: 'rspfTableheader',
                      linkToDestination: '1aRRAffinity',
                      decoration: 'underline'
                    },
                    {
                      margin: [50, 2],
                      image: ResiliencyScoreReportHelper.ImplementedImage(
                        resiliencyReportData.ResiliencyResourceList[0]
                          .ResiliencyFeaturesList[10].ImplementationGrade
                      ),
                      fit: [20, 20],
                      linkToDestination: '1statusARRAffinity'
                    }
                  ],
                  [
                    {
                      text: resiliencyReportData.ResiliencyResourceList[0]
                        .ResiliencyFeaturesList[11].Name,
                      style: 'rspfTableheader',
                      linkToDestination: 'productionSKU',
                      decoration: 'underline'
                    },
                    {
                      margin: [50, 2],
                      image: ResiliencyScoreReportHelper.ImplementedImage(
                        resiliencyReportData.ResiliencyResourceList[0]
                          .ResiliencyFeaturesList[11].ImplementationGrade
                      ),
                      fit: [20, 20],
                      linkToDestination: 'statusProductionSKU'
                    }
                  ]
                ],
                layout: {
                  hLineWidth: function (i, node) {
                    return i === 0 || i === node.table.body.length ? 1 : 1;
                  },
                  vLineWidth: function (i, node) {
                    return i === 0 || i === node.table.widths.length ? 1 : 1;
                  },
                  hLineColor: function (i, node) {
                    return 'black';
                  },
                  vLineColor: function (i, node) {
                    return 'black';
                  }
                }
              }
            }
          ]
        },
        {
          text: '\n\n'
        },
        {
          absolutePosition: { x: 60, y: 680 },
          columns: [
            // Resiliency features table description
            {
              text: '',
              width: 57
            },
            {
              margin: [0, 4, 0, 0],
              image: ResiliencyScoreReportHelper.ImplementedImage(2),
              fit: [15, 15],
              width: 20
            },
            {
              style: 'paragraph',
              alignment: 'left',
              text: 'Fully implemented',
              margin: [0, 5, 0, 5],
              width: 100
            },
            {
              margin: [11, 4, 0, 0],
              image: ResiliencyScoreReportHelper.ImplementedImage(1),
              fit: [15, 15],
              width: 30
            },
            {
              style: 'paragraph',
              text: 'Partially implemented',
              margin: [0, 5, 0, 5],
              width: 120
            },
            {
              margin: [11, 4, 5, 0],
              image: ResiliencyScoreReportHelper.ImplementedImage(0),
              fit: [15, 15],
              width: 30
            },
            {
              style: 'paragraph',
              text: 'Not implemented',
              margin: [0, 5, 0, 5],
              width: 100
            }
          ]
        },
        // Start of Use of multiple instances section
        {
          text: 'Use of multiple instances',
          id: 'useMultipleInstances',
          style: 'header3',
          pageOrientation: 'portrait',
          pageBreak: 'before'
        },
        {
          text: 'Description',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: 'Running your app on only one VM instance is an immediate single point-of-failure. By ensuring that you have multiple instances allocated to your app, if something goes wrong with any instance, your app will still be able to respond to requests going to the other instances. Keep in mind that your app code should be able to handle multiple instances without synchronization issues when reading from or writing to data sources.',
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          text: 'Status of verified Web Apps',
          id: 'statusUseMultipleInstances',
          style: 'header4',
          margin: [0, 10]
        },
        {
          margin: [0, 2],
          alignment: 'center',
          table: {
            headerRows: 1,
            widths: [109, 'auto', 329],
            body: [
              [
                {
                  text: 'Site name',
                  style: 'detectTableheader'
                },
                { text: 'Grade', style: 'detectTableheader' },
                { text: 'Comments', style: 'detectTableheader' }
              ],
              [
                {
                  text: resiliencyReportData.ResiliencyResourceList[0].Name,
                  style: 'detectTableevenrow',
                  bold: true
                },
                {
                  text: ResiliencyScoreReportHelper.ScoreGrade(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[0].ImplementationGrade
                  ),
                  style: 'detectTableevenrow',
                  bold: true,
                  color: ResiliencyScoreReportHelper.GradeColor(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[0].ImplementationGrade
                  )
                },
                {
                  text: resiliencyReportData.ResiliencyResourceList[0]
                    .ResiliencyFeaturesList[0].GradeComments,
                  style: 'detectTableevenrow',
                  alignment: 'justify'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 0 || i === node.table.body.length ? 1 : 1;
            },
            vLineWidth: function (i, node) {
              return i === 0 || i === node.table.widths.length ? 1 : 1;
            },
            hLineColor: function (i, node) {
              return '#306cb8';
            },
            vLineColor: function (i, node) {
              return '#306cb8';
            }
          }
        },
        {
          text: 'Solution',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: resiliencyReportData.ResiliencyResourceList[0]
            .ResiliencyFeaturesList[0].SolutionComments,
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          text: 'To add more instances:\n',
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          style: 'paragraph',
          ul: [
            'Azure Portal:',
            {
              ul: [
                {
                  text: ['Open the ', { text: 'Azure Portal', bold: true }]
                },
                {
                  text: [
                    'Click on ',
                    {
                      text: 'App Service plans',
                      bold: true
                    }
                  ]
                },
                'Click on the App Service Plan hosting the Web App(s) you want to scale out.',
                {
                  text: [
                    'Under ',
                    { text: 'Settings ', bold: true },
                    'click on ',
                    {
                      text: 'Scale out (App Service plan)',
                      bold: true
                    }
                  ]
                },
                {
                  text: ['Click ', { text: 'Manual scale', bold: true }]
                },
                'Increase the number of instances to the desired value (at least 2)\n'
              ]
            },
            'PowerShell:',
            {
              ul: [
                {
                  text: [
                    'Use the ',
                    {
                      text: 'Set-AzAppServicePlan ',
                      bold: true
                    },
                    {
                      text: 'command.\nFor more information see: '
                    },
                    {
                      text: 'https://docs.microsoft.com/en-us/azure/app-service/scripts/powershell-scale-manual\n',
                      color: 'blue',
                      link: 'https://docs.microsoft.com/en-us/azure/app-service/scripts/powershell-scale-manual',
                      alignment: 'left',
                      decoration: 'underline'
                    }
                  ]
                }
              ]
            },
            'Azure CLI:',
            {
              ul: [
                {
                  text: [
                    'Use the ',
                    {
                      text: 'az appservice plan update ',
                      bold: true
                    },
                    {
                      text: 'command.\nFor more information see: '
                    },
                    {
                      text: 'https://docs.microsoft.com/en-us/azure/app-service/scripts/cli-scale-manual\n',
                      color: 'blue',
                      link: 'https://docs.microsoft.com/en-us/azure/app-service/scripts/cli-scale-manual',
                      alignment: 'left',
                      decoration: 'underline'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          text: 'More information',
          style: 'header4',
          margin: [0, 10]
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: [
                'The Ultimate Guide to Running Healthy Apps in the Cloud - Use Multiple Instances\n',
                {
                  text: 'https://azure.github.io/AppService/2020/05/15/Robust-Apps-for-the-cloud.html#use-multiple-instances',
                  color: 'blue',
                  link: 'https://azure.github.io/AppService/2020/05/15/Robust-Apps-for-the-cloud.html#use-multiple-instances',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            }
          ]
        },
        // End of Use of multiple instances section
        // ------------------------------------------
        //start of Heal check section
        {
          text: 'Health Check',
          id: 'healthCheck',
          style: 'header3',
          pageOrientation: 'portrait',
          pageBreak: 'before'
        },
        {
          text: 'Description',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: 'App Service makes it easy to automatically scale your apps to multiple instances when traffic increases. This increases your app’s throughput, but what if there is an uncaught exception on one of the instances? App Service allows you to specify a health check path on your apps. The platform pings this path to determine if your application is healthy and responding to requests. If an instance fails to respond to the ping, the system determines it is unhealthy and removes it from the load balancer rotation. This increases your application’s average availability and resiliency. When your site is scaled out to multiple instances, App Service will exclude any unhealthy instance(s) from serving requests, improving your overall availability. Your app’s health check path should poll the critical components of your application, such as your database, cache, or messaging service and return a 5xx error if any of them fail. This ensures that the status returned by the health check path is an accurate picture of the overall health of your application.',
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          text: 'Status of verified Web Apps',
          id: 'statusHealthCheck',
          style: 'header4',
          margin: [0, 10]
        },
        {
          margin: [0, 2],
          alignment: 'center',
          table: {
            headerRows: 1,
            widths: [109, 'auto', 329],
            body: [
              [
                {
                  text: 'Site name',
                  style: 'detectTableheader'
                },
                { text: 'Grade', style: 'detectTableheader' },
                { text: 'Comments', style: 'detectTableheader' }
              ],
              [
                {
                  text: resiliencyReportData.ResiliencyResourceList[0].Name,
                  style: 'detectTableevenrow',
                  bold: true
                },
                {
                  text: ResiliencyScoreReportHelper.ScoreGrade(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[1].ImplementationGrade
                  ),
                  style: 'detectTableevenrow',
                  bold: true,
                  color: ResiliencyScoreReportHelper.GradeColor(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[1].ImplementationGrade
                  )
                },
                {
                  text: resiliencyReportData.ResiliencyResourceList[0]
                    .ResiliencyFeaturesList[1].GradeComments,
                  style: 'detectTableevenrow',
                  alignment: 'justify'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 0 || i === node.table.body.length ? 1 : 1;
            },
            vLineWidth: function (i, node) {
              return i === 0 || i === node.table.widths.length ? 1 : 1;
            },
            hLineColor: function (i, node) {
              return '#306cb8';
            },
            vLineColor: function (i, node) {
              return '#306cb8';
            }
          }
        },
        {
          text: 'Solution',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: resiliencyReportData.ResiliencyResourceList[0]
            .ResiliencyFeaturesList[1].SolutionComments,
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: ['Using the ', { text: 'Azure Portal', bold: true }, ':']
            },
            {
              ul: [
                {
                  text: ['Open the ', { text: 'Azure Portal', bold: true }]
                },
                {
                  text: ['Click on an ', { text: 'App Services', bold: true }]
                },
                'Click on the Web App for which you want to enable Health Check.',
                {
                  text: [
                    'Under ',
                    { text: 'Monitoring ', bold: true },
                    'click in ',
                    { text: 'Health check', bold: true },
                    '.'
                  ]
                },
                {
                  text: ['Click ', { text: 'Enable', bold: true }, '.']
                },
                {
                  text: [
                    'Under ',
                    { text: 'Path ', bold: true },
                    'add the path to a page that will only return 200 once your app and its dependencies are responsive.'
                  ]
                },
                {
                  text: [
                    'Configure the time in ',
                    { text: 'Load Balancing ', bold: true },
                    'and click ',
                    { text: 'Save', bold: true },
                    '.'
                  ]
                }
              ]
            }
          ]
        },
        {
          text: 'More information',
          style: 'header4',
          margin: [0, 10]
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: [
                'Health Check is now Generally Available\n',
                {
                  text: 'https://azure.github.io/AppService/2020/08/24/healthcheck-on-app-service.html',
                  color: 'blue',
                  link: 'https://azure.github.io/AppService/2020/08/24/healthcheck-on-app-service.html',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            },
            {
              text: [
                'The Ultimate Guide to Running Healthy Apps in the Cloud – Set your Health Check path\n',
                {
                  text: 'https://azure.github.io/AppService/2020/05/15/Robust-Apps-for-the-cloud.html#set-your-health-check-path',
                  color: 'blue',
                  link: 'https://azure.github.io/AppService/2020/05/15/Robust-Apps-for-the-cloud.html#set-your-health-check-path',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            }
          ]
        },
        //
        // End of Health check section
        // ------------------------------------------
        // Start of Auto-Heal section
        {
          text: 'Auto-Heal',
          id: 'autoHeal',
          style: 'header3',
          pageOrientation: 'portrait',
          pageBreak: 'before'
        },
        {
          text: 'Description',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: 'Sometimes your app may run into issues, resulting in downtimes, slowness, or other unexpected behaviors. We’ve built App Service Diagnostics to help you diagnose and solve issues with your web app with recommended troubleshooting and next steps. However, these unexpected behaviors may be temporarily resolved with some simple mitigation steps, such as restarting the process or starting another executable, or require additional data collection, so that you can better troubleshoot the ongoing issue later. With Auto Healing, you can set up custom mitigation actions to run when certain conditions (that you define as unexpected or a sign of unhealthy behavior) are met:',
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          style: 'paragraph',
          margin: 15,
          ul: [
            'Request Duration: examines slow requests',
            'Memory Limit: examines process memory in private bytes',
            'Request Count: examines number of requests',
            'Status Codes: examines number of requests and their HTTP status code'
          ]
        },
        {
          text: 'Status of verified Web Apps',
          id: 'statusAutoHeal',
          style: 'header4',
          margin: [0, 10]
        },
        {
          margin: [0, 2],
          alignment: 'center',
          table: {
            headerRows: 1,
            widths: [109, 'auto', 329],
            body: [
              [
                {
                  text: 'Site name',
                  style: 'detectTableheader'
                },
                { text: 'Grade', style: 'detectTableheader' },
                { text: 'Comments', style: 'detectTableheader' }
              ],
              [
                {
                  text: resiliencyReportData.ResiliencyResourceList[0].Name,
                  style: 'detectTableevenrow',
                  bold: true
                },
                {
                  text: ResiliencyScoreReportHelper.ScoreGrade(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[2].ImplementationGrade
                  ),
                  style: 'detectTableevenrow',
                  bold: true,
                  color: ResiliencyScoreReportHelper.GradeColor(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[2].ImplementationGrade
                  )
                },
                {
                  text: resiliencyReportData.ResiliencyResourceList[0]
                    .ResiliencyFeaturesList[2].GradeComments,
                  style: 'detectTableevenrow',
                  alignment: 'justify'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 0 || i === node.table.body.length ? 1 : 1;
            },
            vLineWidth: function (i, node) {
              return i === 0 || i === node.table.widths.length ? 1 : 1;
            },
            hLineColor: function (i, node) {
              return '#306cb8';
            },
            vLineColor: function (i, node) {
              return '#306cb8';
            }
          }
        },
        {
          text: 'Solution',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: resiliencyReportData.ResiliencyResourceList[0]
            .ResiliencyFeaturesList[2].SolutionComments,
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: ['To enable ', { text: 'Auto-Heal', bold: true }, ':']
            },
            {
              ul: [
                {
                  text: ['Open the ', { text: 'Azure Portal', bold: true }]
                },
                {
                  text: ['Click on an ', { text: 'App Services', bold: true }]
                },
                'Click on the Web App where for which you want to enable Auto-Heal',
                {
                  text: [
                    'Click ',
                    {
                      text: 'Diagnose and solve problems ',
                      bold: true
                    }
                  ]
                },
                {
                  text: [
                    'Type ',
                    { text: 'Auto-Heal ', bold: true },
                    'in the “Search for common problems or tools.” box and click in ',
                    { text: 'Auto-Heal ', bold: true },
                    'under the results'
                  ]
                },
                'For custom rules:',
                {
                  ul: [
                    {
                      text: [
                        'Under the ',
                        {
                          text: 'Custom Auto-Heal Rules ',
                          bold: true
                        },
                        'tab set ',
                        {
                          text: 'Custom Auto-Heal Rules ',
                          bold: true
                        },
                        'to ',
                        { text: 'Enabled', bold: true }
                      ]
                    }
                  ]
                },
                'For Proactive  Auto-Heal',
                {
                  ul: [
                    {
                      text: [
                        'Under the ',
                        {
                          text: 'Proactive Auto-Heal ',
                          bold: true
                        },
                        'tab set ',
                        {
                          text: 'Proactive Auto-Heal ',
                          bold: true
                        },
                        'to ',
                        { text: 'Enabled', bold: true }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          text: 'More information',
          style: 'header4',
          margin: [0, 10]
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: [
                'Announcing the New Auto Healing Experience in App Service Diagnostics\n',
                {
                  text: 'https://azure.github.io/AppService/2018/09/10/Announcing-the-New-Auto-Healing-Experience-in-App-Service-Diagnostics.html',
                  color: 'blue',
                  link: 'https://azure.github.io/AppService/2018/09/10/Announcing-the-New-Auto-Healing-Experience-in-App-Service-Diagnostics.html',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            }
          ]
        },
        // End of Auto-Heal section
        // ------------------------------------------
        // Start of Deploy in Multiple Regions/Zones section
        {
          text: 'Deploy in Multiple Regions/Zones',
          id: 'deployMultipleRegions',
          style: 'header3',
          pageOrientation: 'portrait',
          pageBreak: 'before'
        },
        {
          text: 'Description',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: "You can deploy Azure Front Door or Azure Traffic Manager to intercept traffic before they hit your site. They help in routing & distributing traffic between your instances/regions. If a catastrophic incident happens in one of the Azure Datacenters, you can still guarantee that your app will run and serve requests by investing in one of them.\n There are additional benefits to using Front Door or Traffic Manager, such as routing incoming requests based the customers' geography to provide the shortest respond time to customers and distribute the load among your instances in order not to overload one of them with requests.",
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          text: 'Status of verified Web Apps',
          id: 'statusDeployMultipleRegions',
          style: 'header4',
          margin: [0, 10]
        },
        {
          margin: [0, 2],
          alignment: 'center',
          table: {
            headerRows: 1,
            widths: [109, 'auto', 329],
            body: [
              [
                {
                  text: 'Site name',
                  style: 'detectTableheader'
                },
                { text: 'Grade', style: 'detectTableheader' },
                { text: 'Comments', style: 'detectTableheader' }
              ],
              [
                {
                  text: resiliencyReportData.ResiliencyResourceList[0].Name,
                  style: 'detectTableevenrow',
                  bold: true
                },
                {
                  text: ResiliencyScoreReportHelper.ScoreGrade(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[3].ImplementationGrade
                  ),
                  style: 'detectTableevenrow',
                  bold: true,
                  color: ResiliencyScoreReportHelper.GradeColor(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[3].ImplementationGrade
                  )
                },
                {
                  text: resiliencyReportData.ResiliencyResourceList[0]
                    .ResiliencyFeaturesList[3].GradeComments,
                  style: 'detectTableevenrow',
                  alignment: 'justify'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 0 || i === node.table.body.length ? 1 : 1;
            },
            vLineWidth: function (i, node) {
              return i === 0 || i === node.table.widths.length ? 1 : 1;
            },
            hLineColor: function (i, node) {
              return '#306cb8';
            },
            vLineColor: function (i, node) {
              return '#306cb8';
            }
          }
        },
        {
          text: 'Solution',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: resiliencyReportData.ResiliencyResourceList[0]
            .ResiliencyFeaturesList[3].SolutionComments,
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          text: 'More information',
          style: 'header4',
          margin: [0, 10]
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: [
                'The Ultimate Guide to Running Healthy Apps in the Cloud - Deploy in Multiple Regions\n',
                {
                  text: 'https://azure.github.io/AppService/2020/05/15/Robust-Apps-for-the-cloud.html#deploy-in-multiple-regions',
                  color: 'blue',
                  link: 'https://azure.github.io/AppService/2020/05/15/Robust-Apps-for-the-cloud.html#deploy-in-multiple-regions',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            },
            {
              text: [
                'Controlling Azure App Service traffic with Azure Traffic Manager\n',
                {
                  text: 'https://docs.microsoft.com/en-us/azure/app-service/web-sites-traffic-manager',
                  color: 'blue',
                  link: 'https://docs.microsoft.com/en-us/azure/app-service/web-sites-traffic-manager',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            },
            {
              text: [
                'Quickstart: Create a Front Door for a highly available global web application\n',
                {
                  text: 'https://docs.microsoft.com/en-us/azure/frontdoor/quickstart-create-front-door',
                  color: 'blue',
                  link: 'https://docs.microsoft.com/en-us/azure/frontdoor/quickstart-create-front-door',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            }
          ]
        },
        // End of Deploy in Multiple Regions/Zones section
        // ------------------------------------------
        // Start of Regional Pairing section
        {
          text: 'Regional Pairing',
          id: 'regionalPairing',
          style: 'header3',
          pageOrientation: 'portrait',
          pageBreak: 'before'
        },
        {
          text: 'Description',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: [
            {
              text: 'An Azure region consists of a set of data centers deployed within a latency-defined perimeter and connected through a dedicated low-latency network. This ensures that Azure services within an Azure region offer the best possible performance and security.\nAn Azure geography defines an area of the world containing at least one Azure region. Geographies define a discrete market, typically containing two or more regions, that preserve data residency and compliance boundaries.\nA regional pair consists of two regions within the same geography. Azure serializes platform updates (planned maintenance) across regional pairs, ensuring that only one region in each pair updates at a time. If an outage affects multiple regions, at least one region in each pair will be prioritized for recovery.\nIn addition, if your Web Apps are running on an App Service Environment (ASE), you can take advantage of the a feature for ',
              style: 'paragraph',
              alignment: 'justify'
            },
            {
              text: 'Automatically Redirecting Traffic During Platform Upgrades',
              linkToDestination: 'redirectPlatUpgrade',
              decoration: 'underline',
              style: 'paragraph'
            },
            '.'
          ]
        },
        {
          text: 'Status of verified Web Apps',
          id: 'statusRegionalPairing',
          style: 'header4',
          margin: [0, 10]
        },
        {
          margin: [0, 2],
          alignment: 'center',
          table: {
            headerRows: 1,
            widths: [109, 'auto', 329],
            body: [
              [
                {
                  text: 'Site name',
                  style: 'detectTableheader'
                },
                { text: 'Grade', style: 'detectTableheader' },
                { text: 'Comments', style: 'detectTableheader' }
              ],
              [
                {
                  text: resiliencyReportData.ResiliencyResourceList[0].Name,
                  style: 'detectTableevenrow',
                  bold: true
                },
                {
                  text: ResiliencyScoreReportHelper.ScoreGrade(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[4].ImplementationGrade
                  ),
                  style: 'detectTableevenrow',
                  bold: true,
                  color: ResiliencyScoreReportHelper.GradeColor(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[4].ImplementationGrade
                  )
                },
                {
                  text: resiliencyReportData.ResiliencyResourceList[0]
                    .ResiliencyFeaturesList[4].GradeComments,
                  style: 'detectTableevenrow',
                  alignment: 'justify'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 0 || i === node.table.body.length ? 1 : 1;
            },
            vLineWidth: function (i, node) {
              return i === 0 || i === node.table.widths.length ? 1 : 1;
            },
            hLineColor: function (i, node) {
              return '#306cb8';
            },
            vLineColor: function (i, node) {
              return '#306cb8';
            }
          }
        },
        {
          text: 'Solution',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: resiliencyReportData.ResiliencyResourceList[0]
            .ResiliencyFeaturesList[4].SolutionComments,
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          text: 'More information',
          style: 'header4',
          margin: [0, 10]
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: [
                'Business continuity and disaster recovery (BCDR): Azure Paired Regions\n',
                {
                  text: 'https://docs.microsoft.com/en-us/azure/best-practices-availability-paired-regions',
                  color: 'blue',
                  link: 'https://docs.microsoft.com/en-us/azure/best-practices-availability-paired-regions',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            }
          ]
        },
        // End of Regional Pairing section
        // ------------------------------------------
        // Start of Platform Upgrades Resiliency section
        // {
        //     text: 'Platform Upgrades Resiliency',
        //     style: 'header3',
        //     pageOrientation: 'portrait',
        //     pageBreak: 'before'
        // },
        // {
        //     text: 'Description',
        //     style: 'header4',
        //     margin: [0, 10]
        // },
        // {
        //     text: 'Azure App Service platform upgrades take place regularly. When Azure App Service upgrades the instances that your application(s) are using, it will cause a restart of your Web App once the instance(s) hosting your application are upgraded.\nWe reviewed your Web App during the time of the most recent Platform upgrade while doing this report to see how it affected availability.',
        //     style: 'paragraph',
        //     alignment: 'justify'
        // },
        // {
        //     text: 'Status of verified Web Apps',
        //     style: 'header4',
        //     margin: [0, 10]
        // },
        // {
        //     margin: [0, 2],
        //     alignment: 'center',
        //     table: {
        //         headerRows: 1,
        //         widths: [109, 'auto', 329],
        //         body: [
        //             [
        //                 { text: 'Site name', style: 'detectTableheader' },
        //                 { text: 'Grade', style: 'detectTableheader' },
        //                 { text: 'Comments', style: 'detectTableheader' }
        //             ],
        //             [
        //                 { text: resiliencyReportData.ResiliencyResourceList[0].Name, style: 'detectTableevenrow', bold: true },
        //                 { text: ResiliencyScoreReportHelper.ScoreGrade(resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList[5].ImplementationGrade), style: 'detectTableevenrow', bold:true, color: ResiliencyScoreReportHelper.GradeColor(resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList[5].ImplementationGrade) },
        //                 { text: resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList[5].GradeComments, style: 'detectTableevenrow', alignment: 'justify' }
        //             ]
        //         ]
        //     },
        //     layout: {
        //         hLineWidth: function (i, node) {
        //             return (i === 0 || i === node.table.body.length) ? 1 : 1;
        //         },
        //         vLineWidth: function (i, node) {
        //             return (i === 0 || i === node.table.widths.length) ? 1 : 1;
        //         },
        //         hLineColor: function (i, node) {
        //             return '#306cb8';
        //         },
        //         vLineColor: function (i, node) {
        //             return '#306cb8';
        //         },
        //     }
        // },
        // {
        //     text: 'Solution',
        //     style: 'header4',
        //     margin: [0, 10]
        // },
        // {
        //     text: resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList[5].SolutionComments,
        //     style: 'paragraph',
        //     alignment: 'justify'
        // },
        // {
        //     text: 'More information',
        //     style: 'header4',
        //     margin: [0, 10]
        // },
        // {
        //     style: 'paragraph',
        //     ul: [
        //         { text: [ 'Demystifying the magic behind App Service OS updates\n', { text: "https://azure.github.io/AppService/2018/01/18/Demystifying-the-magic-behind-App-Service-OS-updates.html", color: 'blue', link: "https://azure.github.io/AppService/2018/01/18/Demystifying-the-magic-behind-App-Service-OS-updates.html", alignment: 'left' , decoration: 'underline'}] }
        //     ],
        // },
        // End of Platform Upgrades Resiliency section
        // ------------------------------------------
        // Start of Automatically Redirecting Traffic During Platform Upgrades section
        {
          text: 'Automatically Redirecting Traffic During Platform Upgrades',
          id: 'redirectPlatUpgrade',
          style: 'header3',
          pageOrientation: 'portrait',
          pageBreak: 'before'
        },
        {
          text: 'Description',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: [
            {
              text: [
                'You can register to receive notifications from the platform before the instances hosting your Azure App Service Web App running on App Service Environment (ASE) will be restarted due to a platform upgrade and again once the upgrade has finished.\nWith a combination of Azure Front Door and a Logic App, you can configure your environment so that traffic is automatically redirected to your Web App on another region while your Web App is going through a Platform Upgrade by following the steps in the following link:\n',
                {
                  text: 'https://github.com/Azure-Samples/azure-logic-app-traffic-update-samples',
                  color: 'blue',
                  link: 'https://github.com/Azure-Samples/azure-logic-app-traffic-update-samples',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            }
          ],
          style: 'paragraph',
          alignment: 'justify'
        },
        //End of Automatically Redirecting Traffic During Platform Upgrades section
        //------------------------------------------
        //Start of App density section
        {
          text: 'App density',
          id: 'appDensity',
          style: 'header3',
          pageOrientation: 'portrait',
          pageBreak: 'before'
        },
        {
          text: 'Description',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: 'For production applications, it is recommended that an App Service Plan does not host more than a certain number of sites. The number may be lower depending on how resource intensive the hosted applications are, however as a general guidance, you may refer to the table below:',
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          margin: [170, 2],
          alignment: 'center',
          table: {
            headerRows: 1,
            widths: ['auto', 'auto'],
            body: [
              [
                {
                  text: 'Worker Size',
                  style: 'maxSiteperWorkerSizeheader'
                },
                {
                  text: 'Max sites',
                  style: 'maxSiteperWorkerSizeheader'
                }
              ],
              [
                {
                  text: 'Small',
                  style: 'maxSiteperWorkerSizeevenrow'
                },
                {
                  text: '8',
                  style: 'maxSiteperWorkerSizeevenrow'
                }
              ],
              [
                {
                  text: 'Medium',
                  style: 'maxSiteperWorkerSizeoddrow'
                },
                {
                  text: '16',
                  style: 'maxSiteperWorkerSizeoddrow'
                }
              ],
              [
                {
                  text: 'Large',
                  style: 'maxSiteperWorkerSizeevenrow'
                },
                {
                  text: '32',
                  style: 'maxSiteperWorkerSizeevenrow'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 0 || i === node.table.body.length ? 1 : 1;
            },
            vLineWidth: function (i, node) {
              return i === 0 || i === node.table.widths.length ? 1 : 1;
            },
            hLineColor: function (i, node) {
              return 'black';
            },
            vLineColor: function (i, node) {
              return 'black';
            }
          }
        },
        {
          text: 'Status of verified Web Apps',
          id: 'statusAppDensity',
          style: 'header4',
          margin: [0, 10]
        },
        {
          margin: [0, 2],
          alignment: 'center',
          table: {
            headerRows: 1,
            widths: [109, 'auto', 329],
            body: [
              [
                {
                  text: 'Site name',
                  style: 'detectTableheader'
                },
                { text: 'Grade', style: 'detectTableheader' },
                { text: 'Comments', style: 'detectTableheader' }
              ],
              [
                {
                  text: resiliencyReportData.ResiliencyResourceList[0].Name,
                  style: 'detectTableevenrow',
                  bold: true
                },
                {
                  text: ResiliencyScoreReportHelper.ScoreGrade(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[6].ImplementationGrade
                  ),
                  style: 'detectTableevenrow',
                  bold: true,
                  color: ResiliencyScoreReportHelper.GradeColor(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[6].ImplementationGrade
                  )
                },
                {
                  text: resiliencyReportData.ResiliencyResourceList[0]
                    .ResiliencyFeaturesList[6].GradeComments,
                  style: 'detectTableevenrow',
                  alignment: 'justify'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 0 || i === node.table.body.length ? 1 : 1;
            },
            vLineWidth: function (i, node) {
              return i === 0 || i === node.table.widths.length ? 1 : 1;
            },
            hLineColor: function (i, node) {
              return '#306cb8';
            },
            vLineColor: function (i, node) {
              return '#306cb8';
            }
          }
        },
        {
          text: 'Solution',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: resiliencyReportData.ResiliencyResourceList[0]
            .ResiliencyFeaturesList[6].SolutionComments,
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          style: 'paragraph',
          text: '\nStop non production apps to avoid exhausting system resources.'
        },
        {
          style: 'paragraph',
          text: '\nTo stop inactive Web Apps:\n',
          bold: true
        },
        {
          style: 'paragraph',
          ol: [
            {
              text: [
                'Navigate to the ',
                { text: 'App Service Plan ', bold: true },
                { text: 'in the ' },
                { text: 'Azure Portal', bold: true }
              ]
            },
            {
              text: [
                'While on the ',
                { text: 'Overview ', bold: true },
                {
                  text: 'blade, click on the link next to Apps(s) / Slots.'
                }
              ]
            },
            {
              text: 'Review the apps and slots listed there and stop the ones that are not critical'
            }
          ]
        },
        {
          text: 'More information',
          style: 'header4',
          margin: [0, 10]
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: [
                'Azure App Service plan overview\n',
                {
                  text: 'https://docs.microsoft.com/en-us/azure/app-service/azure-web-sites-web-hosting-plans-in-depth-overview',
                  color: 'blue',
                  link: 'https://docs.microsoft.com/en-us/azure/app-service/azure-web-sites-web-hosting-plans-in-depth-overview',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            }
          ]
        },
        // End of App density section
        // ------------------------------------------
        // Start of SNAT port exhaustion section
        // {
        //     text: 'SNAT port exhaustion',
        //     style: 'header3',
        //     pageOrientation: 'portrait',
        //     pageBreak: 'before'
        // },
        // {
        //     text: 'Description',
        //     style: 'header4',
        //     margin: [0, 10]
        // },
        // {
        //     text: 'Azure uses source network address translation (SNAT) and Load Balancers (not exposed to customers) to communicate with public IP addresses. Each instance on Azure App service is initially given a pre-allocated number of 128 SNAT ports. The SNAT port limit affects opening connections to the same address and port combination. If your app creates connections to a mix of address and port combinations, you will not use up your SNAT ports. The SNAT ports are used up when you have repeated calls to the same address and port combination. Once a port has been released, the port is available for reuse as needed. The Azure Network load balancer reclaims SNAT port from closed connections only after waiting for 4 minutes.',
        //     style: 'paragraph',
        //     alignment: 'justify'

        // },
        // {
        //     text: 'Status of verified Web Apps',
        //     style: 'header4',
        //     margin: [0, 10]
        // },
        // {
        //     margin: [0, 2],
        //     alignment: 'center',
        //     table: {
        //         headerRows: 1,
        //         widths: [109, 'auto', 329],
        //         body: [
        //             [
        //                 { text: 'Site name', style: 'detectTableheader' },
        //                 { text: 'Grade', style: 'detectTableheader' },
        //                 { text: 'Comments', style: 'detectTableheader' }
        //             ],
        //             [
        //                 { text: resiliencyReportData.ResiliencyResourceList[0].Name, style: 'detectTableevenrow', bold: true },
        //                 { text: ResiliencyScoreReportHelper.ScoreGrade(resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList[7].ImplementationGrade), style: 'detectTableevenrow', bold:true, color: ResiliencyScoreReportHelper.GradeColor(resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList[7].ImplementationGrade) },
        //                 { text: resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList[7].GradeComments, style: 'detectTableevenrow', alignment: 'justify' }
        //             ]
        //         ]
        //     },
        //     layout: {
        //         hLineWidth: function (i, node) {
        //             return (i === 0 || i === node.table.body.length) ? 1 : 1;
        //         },
        //         vLineWidth: function (i, node) {
        //             return (i === 0 || i === node.table.widths.length) ? 1 : 1;
        //         },
        //         hLineColor: function (i, node) {
        //             return '#306cb8';
        //         },
        //         vLineColor: function (i, node) {
        //             return '#306cb8';
        //         },
        //     }
        // },
        // {
        //     text: 'Solution',
        //     style: 'header4',
        //     margin: [0, 10]
        // },
        // {
        //     text: resiliencyReportData.ResiliencyResourceList[0].ResiliencyFeaturesList[7].SolutionComments,
        //     style: 'paragraph',
        //     alignment: 'justify'
        // },
        // {
        //     text: 'If you have other Web Apps with SNAT issues, consider the following:\nYou should limit the number of outbound connections to the same URL/IP address/Port combination to 100 or less by using the following recommendations:\n',
        //     style: 'paragraph',
        //     alignment: 'justify'
        // },
        // {
        //     style: 'paragraph',
        //     ul: [
        //         { text: ['Using the ', { text: 'Azure Portal', bold: true }, ':'] },
        //         {
        //             ul: [
        //                 'Modify the application to reuse connections',
        //                 'Modify the application to use connection pooling',
        //                 'Modify the application to use less aggressive retry logic',
        //                 'Use keepalives to reset the outbound idle timeout',
        //                 'Ensure the backend services can return response quickly',
        //                 'Scale out the App Service plan to more instances',
        //                 'Use App Service Environment, whose worker instance can have more SNAT ports, due to its smaller instances pool size',
        //                 'A load test should simulate real world data in a steady feeding speed',
        //             ]
        //         },
        //     ]
        // },
        // {
        //     text: 'More information',
        //     style: 'header4',
        //     margin: [0, 10]
        // },
        // {
        //     style: 'paragraph',
        //     ul: [
        //         { text: [ 'Improper Instantiation antipattern (Code sample included)\n', { text: "https://docs.microsoft.com/en-us/azure/architecture/antipatterns/improper-instantiation/#how-to-fix-the-problem", color: 'blue', link: "https://docs.microsoft.com/en-us/azure/architecture/antipatterns/improper-instantiation/#how-to-fix-the-problem", alignment: 'left' , decoration: 'underline'}] } ,
        //         { text: [ 'Troubleshooting intermittent outbound connection errors in Azure App Service\n', { text: "https://docs.microsoft.com/en-us/azure/architecture/antipatterns/improper-instantiation/#how-to-fix-the-problem", color: 'blue', link: "https://docs.microsoft.com/en-us/azure/architecture/antipatterns/improper-instantiation/#how-to-fix-the-problem", alignment: 'left' , decoration: 'underline'}] },
        //         { text: [ 'Understanding SNAT with App Service\n', { text: "https://4lowtherabbit.github.io/blogs/2019/10/SNAT/", color: 'blue', link: "https://4lowtherabbit.github.io/blogs/2019/10/SNAT/", alignment: 'left' , decoration: 'underline'}] }
        //     ],
        // },
        // End of SNAT port exhaustion section
        // ------------------------------------------
        // Start of Other Best Practices for Availability & Performance section
        {
          text: 'Other Best Practices for Availability & Performance',
          style: 'header2',
          pageOrientation: 'portrait',
          pageBreak: 'before'
        },
        // End of Other Best Practices for Availability & Performance section
        // ------------------------------------------
        // Start of AlwaysOn Check section
        {
          text: 'Always on Check',
          id: 'alwaysOn',
          style: 'header3',
          pageOrientation: 'portrait'
        },
        {
          text: 'Description',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: "Websites unload if they sit idle for too long, which helps the system conserve resources. Always On setting (available for Standard tier and above), keeps your site up and running, which translates to higher availability and faster response times across the board.\nKeeps the app loaded even when there's no traffic. It's required for continuous WebJobs or for WebJobs that are triggered using a CRON expression.\nIf Always On is enabled but there’s something preventing it from reaching the actual root of the Web App (like redirects due authentication/authorization/HTTPS Only, etc.), it might not be able to keep your application from going idle",
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          text: 'Status of verified Web Apps',
          id: 'statusAlwaysOn',
          style: 'header4',
          margin: [0, 10]
        },
        {
          margin: [0, 2],
          alignment: 'center',
          table: {
            headerRows: 1,
            widths: [109, 'auto', 329],
            body: [
              [
                {
                  text: 'Site name',
                  style: 'detectTableheader'
                },
                { text: 'Grade', style: 'detectTableheader' },
                { text: 'Comments', style: 'detectTableheader' }
              ],
              [
                {
                  text: resiliencyReportData.ResiliencyResourceList[0].Name,
                  style: 'detectTableevenrow',
                  bold: true
                },
                {
                  text: ResiliencyScoreReportHelper.ScoreGrade(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[8].ImplementationGrade
                  ),
                  style: 'detectTableevenrow',
                  bold: true,
                  color: ResiliencyScoreReportHelper.GradeColor(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[8].ImplementationGrade
                  )
                },
                {
                  text: resiliencyReportData.ResiliencyResourceList[0]
                    .ResiliencyFeaturesList[8].GradeComments,
                  style: 'detectTableevenrow',
                  alignment: 'justify'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 0 || i === node.table.body.length ? 1 : 1;
            },
            vLineWidth: function (i, node) {
              return i === 0 || i === node.table.widths.length ? 1 : 1;
            },
            hLineColor: function (i, node) {
              return '#306cb8';
            },
            vLineColor: function (i, node) {
              return '#306cb8';
            }
          }
        },
        {
          text: 'Solution',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: resiliencyReportData.ResiliencyResourceList[0]
            .ResiliencyFeaturesList[8].SolutionComments,
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          style: 'paragraph',
          text: ['Enable ', { text: 'Always on', bold: true }, ':\n']
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: ['Using the ', { text: 'Azure Portal', bold: true }, ':\n']
            },
            {
              ol: [
                'Browse to the Azure Portal (https://portal.azure.com) ',
                'Click on the Portal menu on the top left corner',
                {
                  text: ['Click on ', { text: 'App Services', bold: true }]
                },
                {
                  text: [
                    'Select the App Service for which you want to enable ',
                    { text: 'Always on ', bold: true }
                  ]
                },
                {
                  text: ['Click on ', { text: 'Configuration', bold: true }]
                },
                {
                  text: ['Click on ', { text: 'General settings', bold: true }]
                },
                {
                  text: [
                    'Change ',
                    { text: 'Always on ', bold: true },
                    'from Off to ',
                    { text: 'On', bold: true },
                    '.'
                  ]
                },
                {
                  text: ['Click on ', { text: 'Save', bold: true }]
                }
              ]
            },
            {
              text: [
                'Using the ',
                { text: 'Azure AzPowerShell', bold: true },
                ':'
              ]
            },
            {
              ol: [
                {
                  text: [
                    'Use the ',
                    { text: 'Set-AzWebApp ', bold: true },
                    'cmdlet with the ',
                    { text: '-AlwaysOn', bold: true },
                    'set to true\nFor example:\n',
                    '\n $app = Get-AzWebApp -ResourceGroupName $ResourceGroupName -Name $ApplicationName',
                    '\n $app.SiteConfig.AlwaysOn = $false',
                    '\n $app | Set-AzWebApp '
                  ]
                }
              ]
            },
            {
              text: ['Using ', { text: 'Azure CLI', bold: true }, ':']
            },
            {
              ol: [
                {
                  text: [
                    'Use ',
                    {
                      text: 'az web app config set',
                      bold: true
                    },
                    ':\nFor example:\n',
                    ' az webapp config set -g MyResourceGroup -n MyUniqueApp --always-on true\n'
                  ]
                }
              ]
            }
          ]
        },
        {
          text: 'More information',
          style: 'header4',
          margin: [0, 10]
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: [
                'Configure an App Service app in the Azure portal\n',
                {
                  text: 'https://docs.microsoft.com/en-us/azure/app-service/configure-common#configure-general-settings',
                  color: 'blue',
                  link: 'https://docs.microsoft.com/en-us/azure/app-service/configure-common#configure-general-settings',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            },
            {
              text: [
                'Set-AzWebApp\n',
                {
                  text: 'https://docs.microsoft.com/en-us/powershell/module/az.websites/set-azwebapp?view=azps-5.7.0#parameters',
                  color: 'blue',
                  link: 'https://docs.microsoft.com/en-us/powershell/module/az.websites/set-azwebapp?view=azps-5.7.0#parameters',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            },
            {
              text: [
                'az webapp config\n',
                {
                  text: 'https://docs.microsoft.com/en-us/cli/azure/webapp/config?view=azure-cli-latest#az-webapp-config-set',
                  color: 'blue',
                  link: 'https://docs.microsoft.com/en-us/cli/azure/webapp/config?view=azure-cli-latest#az-webapp-config-set',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            }
          ]
        },
        // End of AlwaysOn Check section
        // ------------------------------------------
        // Start of App Service Advisor Recommendations section
        {
          text: 'App Service Advisor Recommendations',
          id: 'appServiceAdvisor',
          style: 'header3',
          pageOrientation: 'portrait',
          pageBreak: 'before'
        },
        {
          text: 'Description',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: 'Azure Advisor integrates recommendations for improving your App Service experience and discovering relevant platform capabilities. Examples of App Service recommendations are:',
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          style: 'paragraph',
          ul: [
            'Detection of instances where memory or CPU resources are exhausted by app runtimes, with mitigation options.',
            'Detection of instances where co-locating resources like web apps and databases can improve performance and reduce cost'
          ]
        },
        {
          text: 'Status of verified Web Apps',
          id: 'statusAppServiceAdvisor',
          style: 'header4',
          margin: [0, 10]
        },
        {
          margin: [0, 2],
          alignment: 'center',
          table: {
            headerRows: 1,
            widths: [109, 'auto', 329],
            body: [
              [
                {
                  text: 'Site name',
                  style: 'detectTableheader'
                },
                { text: 'Grade', style: 'detectTableheader' },
                { text: 'Comments', style: 'detectTableheader' }
              ],
              [
                {
                  text: resiliencyReportData.ResiliencyResourceList[0].Name,
                  style: 'detectTableevenrow',
                  bold: true
                },
                {
                  text: ResiliencyScoreReportHelper.ScoreGrade(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[9].ImplementationGrade
                  ),
                  style: 'detectTableevenrow',
                  bold: true,
                  color: ResiliencyScoreReportHelper.GradeColor(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[9].ImplementationGrade
                  )
                },
                {
                  text: resiliencyReportData.ResiliencyResourceList[0]
                    .ResiliencyFeaturesList[9].GradeComments,
                  style: 'detectTableevenrow',
                  alignment: 'justify'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 0 || i === node.table.body.length ? 1 : 1;
            },
            vLineWidth: function (i, node) {
              return i === 0 || i === node.table.widths.length ? 1 : 1;
            },
            hLineColor: function (i, node) {
              return '#306cb8';
            },
            vLineColor: function (i, node) {
              return '#306cb8';
            }
          }
        },
        {
          text: 'Solution',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: resiliencyReportData.ResiliencyResourceList[0]
            .ResiliencyFeaturesList[9].SolutionComments,
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          text: [
            'Just keep reviewing periodically ',
            { text: 'App Service Advisory ', bold: true },
            'recommendations:'
          ],
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: ['Using the ', { text: 'Azure Portal', bold: true }, ':']
            },
            {
              ul: [
                {
                  text: ['Open the ', { text: 'Azure Portal', bold: true }]
                },
                {
                  text: ['Click on an ', { text: 'App Services', bold: true }]
                },
                'Click on the Web App for which you want to review App Service Advisory recommendations',
                {
                  text: [
                    'Under ',
                    {
                      text: 'Support + troubleshooting',
                      bold: true
                    },
                    ', click on ',
                    {
                      text: 'App Service Advisor',
                      bold: true
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          text: 'More information',
          style: 'header4',
          margin: [0, 10]
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: [
                'Improve the performance of Azure applications by using Azure Advisor - Improve App Service performance and reliability\n',
                {
                  text: 'https://docs.microsoft.com/en-us/azure/advisor/advisor-performance-recommendations#improve-app-service-performance-and-reliability',
                  color: 'blue',
                  link: 'https://docs.microsoft.com/en-us/azure/advisor/advisor-performance-recommendations#improve-app-service-performance-and-reliability',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            },
            {
              text: [
                'Best Practices for Azure App Service\n',
                {
                  text: 'https://docs.microsoft.com/en-us/azure/app-service/app-service-best-practices',
                  color: 'blue',
                  link: 'https://docs.microsoft.com/en-us/azure/app-service/app-service-best-practices',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            }
          ]
        },
        // End of App Service Advisor Recommendations section
        // ------------------------------------------
        // Start of ARR Affinity Check (Recommendation. Not counted against the score) section
        {
          text: 'ARR Affinity Disabled Check (Recommendation. Not counted against the score)',
          id: '1aRRAffinity',
          style: 'header3',
          pageOrientation: 'portrait',
          pageBreak: 'before'
        },
        {
          text: 'Description',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: 'ARR Affinity creates sticky sessions so that clients will connect to the same app instance on subsequent requests. However, ARR Affinity can cause unequal distribution of requests between your instances and possibly overload an instance. For production apps that are aiming to be robust, it is recommended to set Always on to On and ARR Affinity to Off. Disabling ARR Affinity assumes that your application is either stateless, or the session state is stored on a remote service such as a cache or database.\nUsing ARR Affinity for a stateful application is not very reliable as instances could be restarted/replaced at any given time and that will make the client lose its session state.\nWe are not counting this against the score to account for those customers whose applications rely on ARR Affinity.',
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          text: 'Status of verified Web Apps',
          id: '1statusARRAffinity',
          style: 'header4',
          margin: [0, 10]
        },
        {
          margin: [0, 2],
          alignment: 'center',
          table: {
            headerRows: 1,
            widths: [109, 'auto', 329],
            body: [
              [
                {
                  text: 'Site name',
                  style: 'detectTableheader'
                },
                { text: 'Grade', style: 'detectTableheader' },
                { text: 'Comments', style: 'detectTableheader' }
              ],
              [
                {
                  text: resiliencyReportData.ResiliencyResourceList[0].Name,
                  style: 'detectTableevenrow',
                  bold: true
                },
                {
                  text: ResiliencyScoreReportHelper.ScoreGrade(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[10].ImplementationGrade
                  ),
                  style: 'detectTableevenrow',
                  bold: true,
                  color: ResiliencyScoreReportHelper.GradeColor(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[10].ImplementationGrade
                  )
                },
                {
                  text: resiliencyReportData.ResiliencyResourceList[0]
                    .ResiliencyFeaturesList[10].GradeComments,
                  style: 'detectTableevenrow',
                  alignment: 'justify'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 0 || i === node.table.body.length ? 1 : 1;
            },
            vLineWidth: function (i, node) {
              return i === 0 || i === node.table.widths.length ? 1 : 1;
            },
            hLineColor: function (i, node) {
              return '#306cb8';
            },
            vLineColor: function (i, node) {
              return '#306cb8';
            }
          }
        },
        {
          text: 'Solution',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: resiliencyReportData.ResiliencyResourceList[0]
            .ResiliencyFeaturesList[10].SolutionComments,
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          style: 'paragraph',
          ul: [
            'To disable ARR Affinity:',
            {
              ol: [
                {
                  text: ['Open the ', { text: 'Azure Portal', bold: true }]
                },
                {
                  text: ['Click on ', { text: 'App Services', bold: true }]
                },
                'Click on the Web App for which you want to disable ARR Affinity',
                {
                  text: [
                    'Under ',
                    { text: 'Settings ', bold: true },
                    'click on ',
                    { text: 'Configuration', bold: true },
                    { text: ' then ' },
                    {
                      text: 'General settings',
                      bold: true
                    },
                    '.'
                  ]
                },
                {
                  text: [
                    'Set ',
                    { text: 'ARR affinity ', bold: true },
                    'to ',
                    { text: 'Off', bold: true }
                  ]
                }
              ]
            }
          ]
        },
        {
          text: 'More information',
          style: 'header4',
          margin: [0, 10]
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: [
                'The Ultimate Guide to Running Healthy Apps in the Cloud - Set your Health Check path\n',
                {
                  text: 'https://azure.github.io/AppService/2020/05/15/Robust-Apps-for-the-cloud.html#set-your-health-check-path',
                  color: 'blue',
                  link: 'https://azure.github.io/AppService/2020/05/15/Robust-Apps-for-the-cloud.html#set-your-health-check-path',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            }
          ]
        },
        // End of ARR Affinity Disabled Check (Recommendation. Not counted against the score) section
        // ------------------------------------------
        // Start of Production SKU used section
        {
          text: 'Production SKU used',
          id: 'productionSKU',
          style: 'header3',
          pageOrientation: 'portrait',
          pageBreak: 'before'
        },
        {
          text: 'Description',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: 'Azure App Service brings together everything you need to create websites, mobile backends, and web APIs for any platform or device. Free and Shared (preview) plans provide different options to test your apps within your budget. Basic, Standard and Premium plans are for production workloads and run on dedicated Virtual Machine instances. Each instance can support multiple application and domains. The Isolated plan hosts your apps in a private, dedicated Azure environment and is ideal for apps that require secure connections with your on-premises network, or additional performance and scale. App Service plans are billed on a per second basis.',
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          text: 'Status of verified Web Apps',
          id: 'statusProductionSKU',
          style: 'header4',
          margin: [0, 10]
        },
        {
          margin: [0, 2],
          alignment: 'center',
          table: {
            headerRows: 1,
            widths: [109, 'auto', 329],
            body: [
              [
                {
                  text: 'Site name',
                  style: 'detectTableheader'
                },
                { text: 'Grade', style: 'detectTableheader' },
                { text: 'Comments', style: 'detectTableheader' }
              ],
              [
                {
                  text: resiliencyReportData.ResiliencyResourceList[0].Name,
                  style: 'detectTableevenrow',
                  bold: true
                },
                {
                  text: ResiliencyScoreReportHelper.ScoreGrade(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[11].ImplementationGrade
                  ),
                  style: 'detectTableevenrow',
                  bold: true,
                  color: ResiliencyScoreReportHelper.GradeColor(
                    resiliencyReportData.ResiliencyResourceList[0]
                      .ResiliencyFeaturesList[11].ImplementationGrade
                  )
                },
                {
                  text: resiliencyReportData.ResiliencyResourceList[0]
                    .ResiliencyFeaturesList[11].GradeComments,
                  style: 'detectTableevenrow',
                  alignment: 'justify'
                }
              ]
            ]
          },
          layout: {
            hLineWidth: function (i, node) {
              return i === 0 || i === node.table.body.length ? 1 : 1;
            },
            vLineWidth: function (i, node) {
              return i === 0 || i === node.table.widths.length ? 1 : 1;
            },
            hLineColor: function (i, node) {
              return '#306cb8';
            },
            vLineColor: function (i, node) {
              return '#306cb8';
            }
          }
        },
        {
          text: 'Solution',
          style: 'header4',
          margin: [0, 10]
        },
        {
          text: resiliencyReportData.ResiliencyResourceList[0]
            .ResiliencyFeaturesList[11].SolutionComments,
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          text: 'For Web Apps that are not under a Production SKU, to scale up the App Service Plan using the Azure Portal:',
          style: 'paragraph',
          alignment: 'justify'
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: ['Using the ', { text: 'Azure Portal', bold: true }, ':']
            },
            {
              ul: [
                {
                  text: ['Open the ', { text: 'Azure Portal', bold: true }]
                },
                {
                  text: [
                    'Click on ',
                    {
                      text: 'App Service Plans',
                      bold: true
                    }
                  ]
                },
                'Click on the App Service Plan hosting the Web App(s) you want to scale out',
                {
                  text: [
                    'Under ',
                    { text: 'Settings ', bold: true },
                    'click on ',
                    {
                      text: 'Scale up (App Service Plan)',
                      bold: true
                    }
                  ]
                },
                {
                  text: [
                    'Select any plan under the ',
                    { text: 'Production ', bold: true },
                    'tab'
                  ]
                }
              ]
            }
          ]
        },
        {
          text: 'More information',
          style: 'header4',
          margin: [0, 10]
        },
        {
          style: 'paragraph',
          ul: [
            {
              text: [
                'App Service pricing\n',
                {
                  text: 'https://azure.microsoft.com/en-us/pricing/details/app-service/windows',
                  color: 'blue',
                  link: 'https://azure.microsoft.com/en-us/pricing/details/app-service/windows',
                  alignment: 'left',
                  decoration: 'underline'
                }
              ]
            }
          ]
        }
        // End of Production SKU used section
      ],
      defaultStyle: {
        font: 'Calibri'
      },
      styles: {
        header: {
          font: 'Calibri',
          fontSize: 28,
          bold: false
        },
        header2: {
          font: 'Calibri',
          fontSize: 16,
          color: '#10438e',
          lineHeight: 2
        },
        header3: {
          font: 'Calibri',
          fontSize: 16,
          color: '#10438e'
        },
        header4: {
          font: 'Calibri',
          fontSize: 13,
          color: '#10438e'
        },
        title2: {
          alignment: 'center',
          font: 'Calibri',
          fontSize: 28,
          light: true
        },
        paragraph: {
          font: 'Calibri',
          fontSize: 11,
          lineHeight: 1.2,
          alignment: 'justify'
        },
        apsrcTableevenrow: {
          font: 'Calibri',
          bold: true,
          fontSize: 18,
          fillColor: '#dde9f7'
        },
        apsrcTableoddrow: {
          font: 'Calibri',
          bold: true,
          fontSize: 18,
          fillColor: 'white'
        },
        apsrcTableheader: {
          font: 'Calibri',
          color: 'white',
          bold: true,
          fontSize: 18,
          fillColor: '#5B9BD5'
        },
        rspfTableheader: {
          font: 'Calibri',
          color: 'white',
          bold: true,
          fontSize: 11,
          fillColor: '#5B9BD5',
          alignment: 'center'
        },
        detectTableheader: {
          font: 'Calibri',
          color: 'white',
          bold: true,
          fontSize: 11,
          fillColor: '#5B9BD5'
        },
        detectTableevenrow: {
          font: 'Calibri',
          fontSize: 11,
          fillColor: '#dde9f7'
        },
        detectTableoddrow: {
          font: 'Calibri',
          fontSize: 11,
          fillColor: 'white'
        },
        maxSiteperWorkerSizeheader: {
          font: 'Calibri',
          color: 'white',
          bold: true,
          fontSize: 11,
          fillColor: 'black'
        },
        maxSiteperWorkerSizeevenrow: {
          font: 'Calibri',
          color: 'black',
          fontSize: 11,
          fillColor: 'gray'
        },
        maxSiteperWorkerSizeoddrow: {
          font: 'Calibri',
          color: 'black',
          fontSize: 11,
          fillColor: 'white'
        }
      }
    };
    pdfMake
      .createPdf(docDefinition, null, vfsfonts.fonts, vfsfonts.vfs)
      .download(
        `ResiliencyReport-${fileName.replace(':', '-').replace('.', '_')}.pdf`
      );
  }
}
