import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DiagnosticToolsComponent } from './diagnostic-tools.component';

describe('DiagnosticToolsComponent', () => {
  let component: DiagnosticToolsComponent;
  let fixture: ComponentFixture<DiagnosticToolsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DiagnosticToolsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagnosticToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
