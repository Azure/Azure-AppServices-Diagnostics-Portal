import { Component, Input} from '@angular/core';
import { KeyValuePair } from '../../models/common-models';
import { ChatMessage } from "../../../public_api";
import { TelemetryService } from '../../services/telemetry/telemetry.service';
import { ChatUIContextService } from '../../services/chatui-context.service';
import { KustoUtilities } from '../../utilities/kusto-utilities';
import { ClipboardService } from '../../services/clipboard.service';

@Component({
    selector: 'chat-ui-markdown-wrapper',
    templateUrl: './chat-ui-markdown-wrapper.component.html',
    styleUrls: ['./chat-ui-markdown-wrapper.component.scss']
})

export class ChatUIMarkdownWrapperComponent {
    public readonly placeHolderStartText:string = '---ChatUIMarkdownWrapperComponentPlaceholderStart---';
    public readonly placeHolderEndText:string = '---ChatUIMarkdownWrapperComponentPlaceholderStart---';
    
    public readonly codeSnippetExtractionRegex = /```(.*?)\n([\s\S]*?)\n```/;

    @Input() onCopyClick: Function;
    @Input() chatMessageId: string = '';
    @Input() chatIdentifier: string = '';

    _data:string = '';
    @Input() set data(val:string) {
        if(val) {
            this._data = val;
            this.parseData(val);
        }
        else {
            this._data = '';
        }
    }
    public get data(): string {
        return this._data;
    }

    public parsedData:any[] = [];

    constructor(private _telemetryService: TelemetryService, private _chatContextService: ChatUIContextService, private _clipboard: ClipboardService) {
    }

    public isMarkdown(element:any):boolean {
        return element?.type === 'markdown';
    }

    public isSnippet(element:any):boolean {
        return element?.type === 'snippet';
    }

    public getSnippetLanguage(element:any):string {
        return element?.type === 'snippet' ? `${element?.lang}` : '';
    }

    public getElementValue(element:any): string {
        if(element?.type === 'snippet' && (`${element?.lang}`.toLowerCase() === 'kusto' || `${element?.lang$}`.toLowerCase() === 'kql')) {            
            return `${element?.value}`.replace(new RegExp(element.lang), 'csharp');
        }
        else {
            return `${element?.value}`;
        }
    }

    parseNormalizedData(input: string): any[] {
        const result: any[] = [];
      
        // Regular expression to match code snippets and markdown
        const placeholderRegex = new RegExp(`${this.placeHolderStartText}([\\s\\S]*?)${this.placeHolderEndText}`, "g");
        
        // Split the input into different parts using the placeholder regex
        const parts = input.split(placeholderRegex);
      
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim();
      
          if (part.indexOf("```") > -1) {
            // Code snippet
            const codeMatch = this.codeSnippetExtractionRegex.exec(part);
            if (codeMatch) {
              const language = codeMatch[1].trim();
              const snippetText = codeMatch[2].trim();
              result.push({ type: "snippet", lang:language, value:`\`\`\`${language}\n${snippetText}\n\`\`\`` });
            }
          } else {
            // Markdown
            result.push({ type: "markdown", lang: "", value: part });
          }
        }

        if(result.length == 0) {
            result.push({ type: "markdown", lang: "", value: input });
        }
        
        // Remove empty elements
        return result.filter(e=>{return e.value});
      }

    parseData(data:string) {
        this.parsedData = [];
        if(data) {
            if(data.indexOf('```') > -1) {
                const codeSnippetRegexToInsertHeaders = /```(.*?)\n([\s\S]*?)\n```/g;
                let normalizedData = data.replace(codeSnippetRegexToInsertHeaders, (match, language, code) => {
                    const headerStart = `${this.placeHolderStartText}${language.trim()}\n\`\`\`${language.trim()}\n`;
                    const headerEnd = `\n\`\`\`\n${this.placeHolderEndText}`
                    return `${headerStart}${code}${headerEnd}`;
                });
                
                this.parsedData = this.parseNormalizedData(normalizedData);
            }
            else {
                this.parsedData = [{
                    type: 'markdown',
                    lang: '',
                    value: data
                }];
            }
        }
    }

    copyDataToClipboard(element:any) {        
        let textToCopy = `${element.value}`;
        if(this.isSnippet(element) && `${element?.value}`.indexOf('```') > -1) {
            const codeMatch = this.codeSnippetExtractionRegex.exec(`${element?.value}`);
            if (codeMatch && codeMatch.length > 1) {
                textToCopy = `${codeMatch[2]?.trim()}`;
            }
        }

        let currMessage = this._chatContextService.messageStore[this.chatIdentifier].find((msg:ChatMessage) => msg.id == this.chatMessageId);
        if(this.onCopyClick){
            this._telemetryService.logEvent("OpenAICodeSnippetCopyClickEventRaised", { chatIdentifier: this.chatIdentifier, chatMessageId:this.chatMessageId, messageText:currMessage.displayMessage, textCopied:textToCopy, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });
            this.onCopyClick(textToCopy);
        }
        //default handling 
        else {
            try
            {
                if( this.isSnippet(element) && (`${element?.lang}`.toLowerCase() === 'kusto' || `${element?.lang$}`.toLowerCase() === 'kql') && textToCopy
                    && this.chatIdentifier && this.chatMessageId && this._chatContextService.messageStore[this.chatIdentifier] 
                    && this._chatContextService.messageStore[this.chatIdentifier].some((msg:ChatMessage) => 
                                msg.id == this.chatMessageId && msg.data && msg.data instanceof Array  && msg.data.length > 0 
                                && msg.data.some((entry:KeyValuePair)=> `${entry.key }`.trim().toLowerCase() === 'clustername' )
                                && msg.data.some((entry:KeyValuePair)=> `${entry.key }`.trim().toLowerCase() === 'databasename' )
                                )
                        )
                    {
                        // Get the element matching chatMessageId
                        let clusterName = currMessage.data.find((entry:KeyValuePair)=> `${entry.key }`.trim().toLowerCase() === 'clustername' ).value;
                        let databaseName = currMessage.data.find((entry:KeyValuePair)=> `${entry.key }`.trim().toLowerCase() === 'databasename' ).value;
                        let kustoQuery = KustoUtilities.GetKustoQuery(textToCopy, clusterName, databaseName);

                        let htmlText = `Execute: <a target='_blank' href = '${kustoQuery.Url}'>[Web]</a> <a target='_blank' href = '${kustoQuery.KustoDesktopUrl}'>[Desktop]</a> <a target='_blank' href = 'https://${clusterName}.kusto.windows.net/${databaseName}'>https://${clusterName}.kusto.windows.net/${databaseName}</a><br>${textToCopy.replace(/\n/g, '<br>')}`;                        
                        this._clipboard.copyAsHtml(htmlText);
                        this._telemetryService.logEvent("OpenAICodeSnippetCopyClickKustoQueryCopied", { chatIdentifier: this.chatIdentifier, chatMessageId:this.chatMessageId, messageText:currMessage.displayMessage, textCopied:htmlText, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });
                }
                else {                    
                    navigator.clipboard.writeText(textToCopy);
                    this._telemetryService.logEvent("OpenAICodeSnippetCopyClickSnippetCopied", { chatIdentifier: this.chatIdentifier, chatMessageId:this.chatMessageId, messageText:currMessage.displayMessage, textCopied:textToCopy, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });
                }
            }
            catch(e) {
                console.error('Error copying to clipboard. Reverting to default behavior.');
                console.error(e);
                navigator.clipboard.writeText(textToCopy);
                this._telemetryService.logEvent("OpenAICodeSnippetCopyClickError", { ...e, chatIdentifier: this.chatIdentifier, chatMessageId:this.chatMessageId, messageText:currMessage.displayMessage, textCopied:textToCopy, userId: this._chatContextService.userId, ts: new Date().getTime().toString() });
            }
        }
    }
}