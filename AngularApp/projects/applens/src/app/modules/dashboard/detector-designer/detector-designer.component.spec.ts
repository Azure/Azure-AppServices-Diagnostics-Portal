import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectorDesigner } from './detector-designer.component';

describe('CreateWorkflowComponent', () => {
  let component: DetectorDesigner;
  let fixture: ComponentFixture<DetectorDesigner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetectorDesigner ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorDesigner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
