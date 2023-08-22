import * as pako from 'pako';

export interface KustoQuery {
    text: string;
    Url: string;
    KustoDesktopUrl: string;
}

export class KustoUtilities {
    public static readonly KustoDesktopImage:string = `assets/img/KustoDesktop1.png`;
    public static readonly KustoWebImage:string = `assets/img/Kustoweb1.png`;

    public static ExtractQueryTextFromMarkdown(markdown: string): string {
        if(!markdown) {
            return '';
        }
        if(markdown.indexOf('```') > -1) {
            let codeSnippetExtractionRegex = /```(.*?)\n([\s\S]*?)\n```/;
            let matches = markdown.match(codeSnippetExtractionRegex);
            if (matches && matches.length > 2) {
                return `${matches[2]}`.trim();
            }
            else {
                return `${markdown}`.trim();
            }
        }
        else {
            return `${markdown}`.trim();
        }
    }

    public static GetKustoQueryFromMarkdown(markdown: string, cluster:string, database:string): KustoQuery {
        if(!cluster || !database) {
            return {
                text: '',
                Url: '',
                KustoDesktopUrl: ''
            };
        }

        let queryText = KustoUtilities.ExtractQueryTextFromMarkdown(markdown);
        return KustoUtilities.GetKustoQuery(queryText, cluster, database);
    }

    public static GetKustoQuery(queryText: string, cluster:string, database:string): KustoQuery {
        if(queryText && cluster && database) {
            let encodedQueryText = '';
            try {
                //First zip the query text, then base64encode it and then url encode it
                var zip = pako.gzip(queryText, { to: 'string' });
                const base64Data = btoa(String.fromCharCode(...zip));
                encodedQueryText = encodeURIComponent(base64Data);
            }
            catch(error) {
                console.log('Error while encoding query text');
                console.log(error);
            }

            if(encodedQueryText) {
                return {
                    text: queryText,
                    Url: `https://dataexplorer.azure.com/clusters/${cluster}/databases/${database}?query=${encodedQueryText}`,
                    KustoDesktopUrl: `https://${cluster}.windows.net/clusters/${database}?query=${encodedQueryText}&web=0`
                };
            }
        }

        return {
            text: '',
            Url: '',
            KustoDesktopUrl: ''
        };
    }

    public static RunBestPracticeChecks(provider:string, resourceType:string, queryText:string, skipAntaresSpecificChecks:boolean = false):string {
        let findings:string[] = [];
        if(queryText) {
            let queryTextSplit = queryText.split('|');

            if(!queryTextSplit.find(l => l && l.toLowerCase().indexOf('where ') > -1 )) {
                findings.push('Query must contain a where clause to filter necessary data.');
            }

            if(!queryTextSplit.find(l => l && (l.toLowerCase().indexOf('precisetimestamp ') > -1 || l.toLowerCase().indexOf('timestamp ') > -1 || l.toLowerCase().indexOf('pdate ') > -1 
                                                || l.toLowerCase().indexOf('datetime(') > -1  || l.toLowerCase().indexOf('ago(') > -1 
                                            ) )) {
                findings.push('Query must contain a timerange filter.');
            }

            if(!skipAntaresSpecificChecks && `${provider}`.toLowerCase() == 'microsoft.web' && `${resourceType}`.toLowerCase() == 'sites' 
                && !queryTextSplit.find(l => l && l.toLowerCase().indexOf('eventprimarystampname') > -1 )
             ) {
                findings.push('App service related queries must have a filter for EventPrimaryStampName.');
            }

            if(!queryTextSplit.find(l => l && (l.toLowerCase().indexOf('project ') > -1 || l.toLowerCase().indexOf('summarize ') > -1 || l.toLowerCase().indexOf('distinct ') > -1  ) )) {
                findings.push('Query must contain either a project, summarize or a distinct statement.');
            }
        }
        else {
            findings.push('Empty query text.');
        }        
        return findings.join('\r\n');
    }
}
