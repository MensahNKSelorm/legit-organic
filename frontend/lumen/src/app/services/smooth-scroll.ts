import { Injectable, NgZone } from '@angular/core';
import Lenis from 'lenis';

@Injectable({
  providedIn: 'root'
})
export class SmoothScrollService {
  public lenis!: Lenis;

  constructor(private zone: NgZone) {}

  init() {
    this.zone.runOutsideAngular(() => {

      this.lenis = new Lenis({
        lerp: 0.08,             // smoothness
        wheelMultiplier: 1.1,   // scroll speed
        touchMultiplier: 1.2,   // touch scroll (phones)
        duration: 1.2,          // optional — scroll duration
        easing: (t) => t        // default easing
      });

      const raf = (time: number) => {
        this.lenis.raf(time);
        requestAnimationFrame(raf);
      };

      requestAnimationFrame(raf);
    });
  }
}
