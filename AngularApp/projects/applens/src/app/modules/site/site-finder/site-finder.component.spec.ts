import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SiteFinderComponent } from './site-finder.component';

describe('SiteFinderComponent', () => {
  let component: SiteFinderComponent;
  let fixture: ComponentFixture<SiteFinderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SiteFinderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SiteFinderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
