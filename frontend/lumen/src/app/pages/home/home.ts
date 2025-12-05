import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ViewChildren, ElementRef, QueryList, OnInit } from '@angular/core';
import gsap from "gsap";
import { SmoothScrollService } from '../../services/smooth-scroll';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})


export class Home implements OnInit, AfterViewInit {

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

  // Duplicate arrays for seamless loop
  loop1 = [...this.heroImages, ...this.heroImages];
  loop2 = [...this.heroImages.slice().reverse(), ...this.heroImages.slice().reverse()];

  constructor(private smoothScroll: SmoothScrollService) {}

  ngOnInit(): void {
    // Initialize Lenis smooth scroll
    this.smoothScroll.init();
  }

  ngAfterViewInit() {
    // Fade-in each hero image
    gsap.from(".hero-row img", {
      opacity: 0,
      duration: 1,
      stagger: 0.06,
      ease: "power2.out",
    });

    // HERO TEXT REVEAL ANIMATION
    const tl = gsap.timeline({ delay: 0.2 });

    tl.from(".hero-title", {
      y: 40,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out"
    })
    .from(".hero-subtitle", {
      y: 30,
      opacity: 0,
      duration: 1.1,
      ease: "power3.out"
    }, "-=0.6")
    .from(".hero-btn", {
      y: 20,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.15
    }, "-=0.7");


    // Infinite horizontal scroll loops
    this.tracks.forEach((trackRef, index) => {
      const el = trackRef.nativeElement;
      const width = el.scrollWidth / 2;
      if (!width) return;

      gsap.set(el, { x: 0 });

      gsap.to(el, {
        x: index === 0 ? -width : width,
        duration: 45,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: gsap.utils.unitize(gsap.utils.wrap(-width, 0))
        }
      });
    });

    gsap.to(".hero-underline", {
      width: "100%",
      duration: 1,
      ease: "power3.out",
      delay: 1.4
    });


    const update = () => {
      this.smoothScroll.lenis.raf(performance.now());
      ScrollTrigger.update();
      requestAnimationFrame(update);
    };

    requestAnimationFrame(update);


  }

}
