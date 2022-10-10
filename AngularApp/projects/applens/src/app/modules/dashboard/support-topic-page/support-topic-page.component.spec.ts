import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SupportTopicPageComponent } from './support-topic-page.component';

describe('SupportTopicPageComponent', () => {
  let component: SupportTopicPageComponent;
  let fixture: ComponentFixture<SupportTopicPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SupportTopicPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SupportTopicPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
