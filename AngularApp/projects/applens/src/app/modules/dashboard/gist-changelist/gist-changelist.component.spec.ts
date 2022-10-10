import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GistChangelistComponent } from './gist-changelist.component';

describe('GistChangelistComponent', () => {
  let component: GistChangelistComponent;
  let fixture: ComponentFixture<GistChangelistComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GistChangelistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GistChangelistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
