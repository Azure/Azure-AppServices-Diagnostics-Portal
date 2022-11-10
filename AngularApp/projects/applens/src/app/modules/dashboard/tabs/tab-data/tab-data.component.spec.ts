import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabDataComponent } from './tab-data.component';

describe('TabDataComponent', () => {
  let component: TabDataComponent;
  let fixture: ComponentFixture<TabDataComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TabDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
