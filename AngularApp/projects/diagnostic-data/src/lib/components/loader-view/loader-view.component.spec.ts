import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { LoaderViewComponent } from './loader-view.component';

describe('LoaderViewComponent', () => {
  let component: LoaderViewComponent;
  let fixture: ComponentFixture<LoaderViewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LoaderViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LoaderViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
