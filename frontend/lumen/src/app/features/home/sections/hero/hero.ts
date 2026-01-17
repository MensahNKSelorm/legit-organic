import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'app-hero',
  imports: [
    CommonModule
  ],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})

export class Hero implements AfterViewInit {
  @ViewChildren('track') tracks!: QueryList<ElementRef<HTMLElement>>;

  heroImages: string[] = [
    'assets/hero/1.webp',
    'assets/hero/2.webp',
    'assets/hero/3.webp',
    'assets/hero/4.webp',
    'assets/hero/5.webp',
    'assets/hero/6.webp',
    'assets/hero/7.webp',
    'assets/hero/8.webp',
    'assets/hero/9.webp',
    'assets/hero/10.webp',
  ];

  loop1 = [...this.heroImages, ...this.heroImages];
  loop2 = [...this.heroImages.slice().reverse(), ...this.heroImages.slice().reverse()];

  ngAfterViewInit(): void {
    gsap.context(() => {

      // TEXT TIMELINE (hero content only)
      const tl = gsap.timeline({ delay: 0.15 });

      tl.fromTo(
        '.hero-title',
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }
      )
        .fromTo(
          '.hero-subtitle',
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.5'
        )
        .fromTo(
          '.hero-btn',
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.12 },
          '-=0.4'
        );

      // UNDERLINE DRAW (after text settles)
      tl.to(
        '.underline-wave path',
        {
          strokeDashoffset: 0,
          duration: 1.4,
          ease: 'power3.out',
        },
        '-=0.3'
      );

      // BACKGROUND MOTION — START AFTER TEXT
      tl.eventCallback('onComplete', () => {
        this.startBackgroundLoops();
      });

    });

  }

  startBackgroundLoops() {
  this.tracks.forEach((trackRef, index) => {
    const el = trackRef.nativeElement;
    const width = el.scrollWidth / 2;

    if (!width) return;

    gsap.set(el, { x: 0 });

    gsap.to(el, {
      x: index === 0 ? -width : width,
      duration: 110, // 🔑 MUCH slower
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize(gsap.utils.wrap(-width, 0)),
      },
    });
  });

  // Pause background motion when tab is inactive
  document.addEventListener('visibilitychange', () => {
    gsap.globalTimeline.paused(document.hidden);
  });
}

}
