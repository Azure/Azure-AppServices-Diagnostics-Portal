import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ResourceRedirectComponent } from './resource-redirect.component';

describe('ResourceRedirectComponent', () => {
  let component: ResourceRedirectComponent;
  let fixture: ComponentFixture<ResourceRedirectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ResourceRedirectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
