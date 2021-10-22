import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContainerAppFinderComponent } from './containerapp-finder.component';

describe('ContainerAppFinderComponent', () => {
  let component: ContainerAppFinderComponent;
  let fixture: ComponentFixture<ContainerAppFinderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContainerAppFinderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContainerAppFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
