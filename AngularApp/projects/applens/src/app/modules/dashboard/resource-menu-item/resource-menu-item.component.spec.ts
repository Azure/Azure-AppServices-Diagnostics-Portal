import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ResourceMenuItemComponent } from './resource-menu-item.component';

describe('ResourceMenuItemComponent', () => {
  let component: ResourceMenuItemComponent;
  let fixture: ComponentFixture<ResourceMenuItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ResourceMenuItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceMenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
