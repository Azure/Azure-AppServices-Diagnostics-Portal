import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DynamicDataComponent } from './dynamic-data.component';

describe('DynamicDataComponent', () => {
  let component: DynamicDataComponent;
  let fixture: ComponentFixture<DynamicDataComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DynamicDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DynamicDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
