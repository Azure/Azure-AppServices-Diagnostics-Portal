import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DocumentsSearchComponent } from './documents-search.component';

describe('DocumentsSearchComponent', () => {
  let component: DocumentsSearchComponent;
  let fixture: ComponentFixture<DocumentsSearchComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DocumentsSearchComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DocumentsSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
