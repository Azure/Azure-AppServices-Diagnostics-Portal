import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KustoQueryDialogComponent } from './kusto-query-dialog.component';

describe('KustoQueryDialogComponent', () => {
  let component: KustoQueryDialogComponent;
  let fixture: ComponentFixture<KustoQueryDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KustoQueryDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KustoQueryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
