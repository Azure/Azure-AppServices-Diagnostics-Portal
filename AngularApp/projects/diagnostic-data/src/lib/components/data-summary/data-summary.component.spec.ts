import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DataSummaryComponent } from './data-summary.component';

describe('DataSummaryComponent', () => {
  let component: DataSummaryComponent;
  let fixture: ComponentFixture<DataSummaryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DataSummaryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
