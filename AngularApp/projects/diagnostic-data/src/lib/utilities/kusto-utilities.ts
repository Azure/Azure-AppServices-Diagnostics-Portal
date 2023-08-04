import * as pako from 'pako';

export interface KustoQuery {
    text: string;
    Url: string;
    KustoDesktopUrl: string;
}

export class KustoUtilities {
    public static readonly KustoDesktopImage:string = `https://applensimgs.blob.core.windows.net/images/KustoDesktop1.png`;
    public static readonly KustoWebImage:string = `https://applensimgs.blob.core.windows.net/images/Kustoweb1.png`;

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
}
