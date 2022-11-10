import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GistComponent } from './gist.component';

describe('GistComponent', () => {
  let component: GistComponent;
  let fixture: ComponentFixture<GistComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GistComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
