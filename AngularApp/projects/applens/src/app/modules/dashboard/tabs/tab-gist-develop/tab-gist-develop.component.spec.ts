import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabGistDevelopComponent } from './tab-gist-develop.component';

describe('TabGistDevelopComponent', () => {
  let component: TabGistDevelopComponent;
  let fixture: ComponentFixture<TabGistDevelopComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TabGistDevelopComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TabGistDevelopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
