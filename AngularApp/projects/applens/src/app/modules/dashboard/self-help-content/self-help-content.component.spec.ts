import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SelfHelpContentComponent } from './self-help-content.component';

describe('SelfHelpContentComponent', () => {
  let component: SelfHelpContentComponent;
  let fixture: ComponentFixture<SelfHelpContentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SelfHelpContentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelfHelpContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
