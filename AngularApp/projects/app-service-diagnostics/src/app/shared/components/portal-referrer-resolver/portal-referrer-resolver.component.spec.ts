import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PortalReferrerResolverComponent } from './portal-referrer-resolver.component';

describe('PortalReferrerResolverComponent', () => {
  let component: PortalReferrerResolverComponent;
  let fixture: ComponentFixture<PortalReferrerResolverComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PortalReferrerResolverComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PortalReferrerResolverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
