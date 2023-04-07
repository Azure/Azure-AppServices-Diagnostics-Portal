import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadReportComponent } from './download-report.component';

describe('DownloadReportComponent', () => {
  let component: DownloadReportComponent;
  let fixture: ComponentFixture<DownloadReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadReportComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
