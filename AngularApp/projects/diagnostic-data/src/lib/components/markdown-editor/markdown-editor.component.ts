import { ClipboardService } from './../../services/clipboard.service';
import { MarkdownService } from 'ngx-markdown';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TelemetryService } from '../../services/telemetry/telemetry.service';

@Component({
  selector: 'markdown-editor',
  templateUrl: './markdown-editor.component.html',
  styleUrls: ['./markdown-editor.component.scss']
})
export class MarkdownEditorComponent implements OnInit {
  tabs: string[] = ['Edit', 'Preview'];

  selectedTab: string = this.tabs[this.tabs.length - 1];

  markdownHover: boolean = false;
  showCopySuccess: boolean = false;
  copyTimeout: any;

  edited: boolean = false;

  @Input() copy: boolean = false;
  @Input() rawMarkdown: string;
  @Output() rawMarkdownChange: EventEmitter<string> =
    new EventEmitter<string>();

  ngOnInit() {
    if (this.copy) {
      this.copyText('external');
    }
  }

  constructor(
    private _markdownService: MarkdownService,
    private _clipboard: ClipboardService,
    private _logger: TelemetryService
  ) {}

  emitMarkdown() {
    this.rawMarkdownChange.emit(this.rawMarkdown);
    this.edited = true;
  }

  copyText(source: string = 'internal') {
    this._logger.logEvent('markdown-copy', {
      edited: String(this.edited),
      copySource: source
    });
    const markdownHtml = this._markdownService.compile(this.rawMarkdown);
    this._clipboard.copyAsHtml(markdownHtml);

    if (this.copyTimeout) {
      clearTimeout(this.copyTimeout);
    }

    this.showCopySuccess = true;
    this.copyTimeout = setTimeout(() => {
      this.showCopySuccess = false;
      if (this.copyTimeout) {
        clearTimeout(this.copyTimeout);
      }
    }, 2000);
  }
}
