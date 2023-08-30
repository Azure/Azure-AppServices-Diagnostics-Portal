import { Component, Input, TemplateRef } from '@angular/core';

@Component({
  selector: 'data-container',
  templateUrl: './data-container.component.html',
  styleUrls: ['./data-container.component.scss']
})
export class DataContainerComponent {

  @Input() headerTemplate: TemplateRef<any>;

  @Input() title: string;
  @Input() description: string;
  @Input() noBodyPadding: boolean = false;
  @Input() hideIfNoTitle: boolean = true;
  @Input() applicationInsightContainerStyle: number = 0;
  @Input() additionalOptionsToShow: any[] = [];
}
