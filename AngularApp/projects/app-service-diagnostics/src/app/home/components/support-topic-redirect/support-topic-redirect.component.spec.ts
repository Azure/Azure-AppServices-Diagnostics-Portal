import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SupportTopicRedirectComponent } from './support-topic-redirect.component';

describe('SupportTopicRedirectComponent', () => {
  let component: SupportTopicRedirectComponent;
  let fixture: ComponentFixture<SupportTopicRedirectComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SupportTopicRedirectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SupportTopicRedirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
