import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoCodeDetectorPanelComponent } from './no-code-detector-panel.component';

describe('NoCodeDetectorPanelComponent', () => {
  let component: NoCodeDetectorPanelComponent;
  let fixture: ComponentFixture<NoCodeDetectorPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoCodeDetectorPanelComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoCodeDetectorPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
