import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AseFinderComponent } from './ase-finder.component';

describe('AseFinderComponent', () => {
  let component: AseFinderComponent;
  let fixture: ComponentFixture<AseFinderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AseFinderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AseFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
