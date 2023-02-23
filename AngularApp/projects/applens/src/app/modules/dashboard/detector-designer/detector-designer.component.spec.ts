import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetectorDesignerComponent } from './detector-designer.component';

describe('DetectorDesignerComponent', () => {
  let component: DetectorDesignerComponent;
  let fixture: ComponentFixture<DetectorDesignerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetectorDesignerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetectorDesignerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
