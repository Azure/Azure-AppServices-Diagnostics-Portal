import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FabricFeedbackComponent } from './fabric-feedback.component';

describe('FabricFeedbackComponent', () => {
  let component: FabricFeedbackComponent;
  let fixture: ComponentFixture<FabricFeedbackComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FabricFeedbackComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FabricFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
