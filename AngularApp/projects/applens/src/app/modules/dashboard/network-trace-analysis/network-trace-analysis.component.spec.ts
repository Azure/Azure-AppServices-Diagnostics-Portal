import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkTraceAnalysisComponent } from './network-trace-analysis.component';

describe('NetworkTraceAnalysisComponent', () => {
  let component: NetworkTraceAnalysisComponent;
  let fixture: ComponentFixture<NetworkTraceAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NetworkTraceAnalysisComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NetworkTraceAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
