import { Injectable, NgZone } from '@angular/core';
import Lenis from 'lenis';

@Injectable({ providedIn: 'root' })
export class SmoothScrollService {
  public lenis!: Lenis;

  constructor(private zone: NgZone) {}

  init() {
    this.zone.runOutsideAngular(() => {

      this.lenis = new Lenis({
        lerp: 0.08,             // Smoothness
        wheelMultiplier: 1.1,   // Faster scroll
        touchMultiplier: 1.2,   // Touch devices
        duration: 1.2,          // Scroll duration
        easing: (t) => t        // Default easing
      });

      console.log("LENIS INIT FIRED");
    });
  }
}
