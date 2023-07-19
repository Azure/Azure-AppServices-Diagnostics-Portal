import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommunicationToolkitComponent } from './communication-toolkit.component';

describe('CommunicationToolkitComponent', () => {
  let component: CommunicationToolkitComponent;
  let fixture: ComponentFixture<CommunicationToolkitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CommunicationToolkitComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommunicationToolkitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
