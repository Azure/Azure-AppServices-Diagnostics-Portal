import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DocumentSearchComponent } from './document-search.component';

describe('DocumentSearchComponent', () => {
  let component: DocumentSearchComponent;
  let fixture: ComponentFixture<DocumentSearchComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
