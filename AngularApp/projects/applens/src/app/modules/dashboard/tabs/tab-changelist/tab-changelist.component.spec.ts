import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabChangelistComponent } from './tab-changelist.component';

describe('TabDetectorChangelistComponent', () => {
  let component: TabChangelistComponent;
  let fixture: ComponentFixture<TabChangelistComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TabChangelistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabChangelistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
