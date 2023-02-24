import { Component } from '@angular/core';
import { DataTableResponseObject, DiagnosticData, Rendering } from '../../models/detector';
import { DataRenderBaseComponent } from '../data-render-base/data-render-base.component';

@Component({
  selector: 'embed-video',
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss']
})
export class VideoComponent extends DataRenderBaseComponent {
  renderingProperties: Rendering;
  title: string = "";
  videos: Video[] = [];

  protected processData(data: DiagnosticData): void {
    this.title = data.renderingProperties?.title;
    this.parseData(data.table);
  }

  private parseData(table: DataTableResponseObject) {
    const altTextColumn = 0;
    const linkColumn = 1;
    for (const row of table.rows) {
      const altText = row[altTextColumn];
      const link = row[linkColumn];
      const video: Video = { altText, link };
      this.videos.push(video);
    }
  }

}

interface Video {
  link: string;
  altText: string;
}
