import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KustoGPTComponent } from './kustogpt.component';

describe('KustoGPTComponent', () => {
  let component: KustoGPTComponent;
  let fixture: ComponentFixture<KustoGPTComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KustoGPTComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KustoGPTComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
