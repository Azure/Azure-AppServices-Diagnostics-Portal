import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { IncidentValidationComponent } from './incidentvalidation.component';

describe('IncidentValidationComponent', () => {
  let component: IncidentValidationComponent;
  let fixture: ComponentFixture<IncidentValidationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ IncidentValidationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IncidentValidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
