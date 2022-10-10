import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabDevelopComponent } from './tab-develop.component';

describe('TabDevelopComponent', () => {
  let component: TabDevelopComponent;
  let fixture: ComponentFixture<TabDevelopComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TabDevelopComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabDevelopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
