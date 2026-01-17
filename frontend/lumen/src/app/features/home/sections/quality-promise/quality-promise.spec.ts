import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QualityPromise } from './quality-promise';

describe('QualityPromise', () => {
  let component: QualityPromise;
  let fixture: ComponentFixture<QualityPromise>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualityPromise]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QualityPromise);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
