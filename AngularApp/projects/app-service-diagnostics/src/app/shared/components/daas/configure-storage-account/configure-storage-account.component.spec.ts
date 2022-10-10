import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConfigureStorageAccountComponent } from './configure-storage-account.component';

describe('ConfigureStorageAccountComponent', () => {
  let component: ConfigureStorageAccountComponent;
  let fixture: ComponentFixture<ConfigureStorageAccountComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConfigureStorageAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfigureStorageAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
