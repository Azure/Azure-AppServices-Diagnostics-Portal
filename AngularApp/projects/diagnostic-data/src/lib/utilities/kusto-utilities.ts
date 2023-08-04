export interface KustoQuery {
    text: string;
    Url: string;
    KustoDesktopUrl: string;
}

export class KustoUtilities {

    static GetQueryTextFromMarkdown(markdown: string): string {
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

    static GetKustoQueryFromMarkdown(markdown: string, cluster:string, database:string): KustoQuery {
        if(!cluster || !database) {
            return {
                text: '',
                Url: '',
                KustoDesktopUrl: ''
            };
        }

        let queryText = KustoUtilities.GetQueryTextFromMarkdown(markdown);
        return KustoUtilities.GetKustoQuery(queryText, cluster, database);
    }

    static GetKustoQuery(queryText: string, cluster:string, database:string): KustoQuery {
        if(!queryText || !cluster || !database) {
            return {
                text: '',
                Url: '',
                KustoDesktopUrl: ''
            };
        }

        // First Base64 encode the query text and then URL encode it
        let encodedQueryText = btoa(queryText);
        encodedQueryText = encodeURIComponent(encodedQueryText);

        let url = `https://dataexplorer.azure.com/clusters/${cluster}/databases/${database}?query=${encodedQueryText}`;
        let kustoDesktopUrl = `https://${cluster}.windows.net/clusters/${database}?query=${encodedQueryText}&web=0`;

        return {
            text: queryText,
            Url: url,
            KustoDesktopUrl: kustoDesktopUrl
        };
    }
}
