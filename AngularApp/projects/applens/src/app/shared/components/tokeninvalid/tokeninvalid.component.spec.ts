import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TokenInvalidComponent } from './tokeninvalid.component';

describe('TokenInvalidComponent', () => {
  let component: TokenInvalidComponent;
  let fixture: ComponentFixture<TokenInvalidComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TokenInvalidComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenInvalidComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
