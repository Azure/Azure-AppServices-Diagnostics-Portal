import { Component, AfterViewInit, OnDestroy, ViewChild, Renderer2, Input } from '@angular/core';
import { MarkdownComponent } from 'ngx-markdown';
import { LinkInterceptorService } from '../../services/link-interceptor.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TelemetryService } from '../../services/telemetry/telemetry.service';


@Component({
  selector: 'markdown-text',
  templateUrl: './markdown-text.component.html',
  styleUrls: ['./markdown-text.component.scss']
})
export class MarkdownTextComponent implements AfterViewInit, OnDestroy {

  listenObj: any;
  @ViewChild(MarkdownComponent) markdownDiv;
  @Input() detector: string = "";
  @Input() markdownData: string = "";
  
  //Only <markdown-view> don't need to check whether it is markdown format 
  @Input() isMarkdownView:boolean = false;

  constructor(private renderer: Renderer2, private linkInterceptorService: LinkInterceptorService, private router: Router, private telemetryService: TelemetryService,private activatedRoute:ActivatedRoute) { }

  isMarkdown(str: any) {
    return `${str}`.trim().startsWith('<markdown>') && str.endsWith('</markdown>');
  }

  getMarkdown(str: any) {
    return `${str}`.trim().replace('<markdown>', '').replace('</markdown>', '');
  }

  ngAfterViewInit() {
    if (this.markdownDiv) {
      this.listenObj = this.renderer.listen(this.markdownDiv.element.nativeElement, 'click', (evt) => {
        this.linkInterceptorService.interceptLinkClick(evt, this.router, this.detector, this.telemetryService,this.activatedRoute)
      });
    }
  }

  ngOnDestroy() {
    if (this.listenObj) {
      this.listenObj();
    }
  }
}
