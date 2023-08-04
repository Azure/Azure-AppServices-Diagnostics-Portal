import { Component, Input, OnChanges, OnInit, SimpleChanges, TemplateRef } from '@angular/core';

@Component({
  selector: 'data-container',
  templateUrl: './data-container.component.html',
  styleUrls: ['./data-container.component.scss']
})
export class DataContainerComponent implements OnChanges {

  @Input() headerTemplate: TemplateRef<any>;

  @Input() title: string;
  @Input() description: string;
  @Input() noBodyPadding: boolean = false;
  @Input() hideIfNoTitle: boolean = true;
  @Input() applicationInsightContainerStyle: number = 0;
  @Input() additionalOptionsToShow: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['additionalOptionsToShow'] != undefined && this.additionalOptionsToShow) {
      console.log(this.additionalOptionsToShow);
    }
  }
}
