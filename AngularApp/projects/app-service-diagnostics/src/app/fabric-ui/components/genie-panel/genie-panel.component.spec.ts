import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GeniePanelComponent } from './genie-panel.component';

describe('GeniePanelComponent', () => {
  let component: GeniePanelComponent;
  let fixture: ComponentFixture<GeniePanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GeniePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GeniePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
