import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DataRenderBaseComponent } from './data-render-base.component';

describe('DataRenderBaseComponent', () => {
  let component: DataRenderBaseComponent;
  let fixture: ComponentFixture<DataRenderBaseComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DataRenderBaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DataRenderBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
