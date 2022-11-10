import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DocumentSearchResultsComponent } from './document-search-results.component';

describe('DocumentSearchResultsComponent', () => {
  let component: DocumentSearchResultsComponent;
  let fixture: ComponentFixture<DocumentSearchResultsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentSearchResultsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentSearchResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
