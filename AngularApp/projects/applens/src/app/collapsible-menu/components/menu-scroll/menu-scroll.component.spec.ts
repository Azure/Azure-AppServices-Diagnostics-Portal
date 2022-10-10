import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MenuScrollComponent } from './menu-scroll.component';

describe('MenuScrollComponent', () => {
  let component: MenuScrollComponent;
  let fixture: ComponentFixture<MenuScrollComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MenuScrollComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuScrollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
