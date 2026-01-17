import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrimaryCta } from './primary-cta';

describe('PrimaryCta', () => {
  let component: PrimaryCta;
  let fixture: ComponentFixture<PrimaryCta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrimaryCta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrimaryCta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
