import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FabTabComponent } from './fab-tab.component';

describe('FabTabComponent', () => {
  let component: FabTabComponent;
  let fixture: ComponentFixture<FabTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FabTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FabTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
