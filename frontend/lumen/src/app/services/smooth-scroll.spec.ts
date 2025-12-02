import { TestBed } from '@angular/core/testing';

import { SmoothScroll } from './smooth-scroll';

describe('SmoothScroll', () => {
  let service: SmoothScroll;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SmoothScroll);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
