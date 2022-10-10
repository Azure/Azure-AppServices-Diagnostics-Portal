import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ResourceHomeComponent } from './resource-home.component';

describe('ResourceHomeComponent', () => {
  let component: ResourceHomeComponent;
  let fixture: ComponentFixture<ResourceHomeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ResourceHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
