import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ViewChildren, ElementRef, QueryList, OnInit } from '@angular/core';
import gsap from "gsap";
import { SmoothScrollService } from '@app/core';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { Hero } from './hero/hero';
import { WhyUs } from './why-us/why-us';
import { QualityPromise } from './quality-promise/quality-promise';
import { Recipes } from './recipes/recipes';
import { PrimaryCta } from './primary-cta/primary-cta';
import { Featured } from './featured/featured';

gsap.registerPlugin(ScrollTrigger)

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    Hero,
    WhyUs,
    Featured,
    QualityPromise,
    Recipes,
    PrimaryCta
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})


export class Home implements OnInit, AfterViewInit {

  constructor(private smoothScroll: SmoothScrollService) {}

  ngOnInit(): void {
    // Initialize Lenis smooth scroll
    this.smoothScroll.init();
  }

  ngAfterViewInit() {

    

    // FEATURED HEADER REVEAL
gsap.from('.featured-header', {
  scrollTrigger: {
    trigger: '.featured-section',
    start: 'top 85%',
  },
  y: 30,
  opacity: 0,
  duration: 1,
  ease: 'power3.out'
});

// FEATURED CARDS STAGGER ANIMATION
gsap.from('.product-card', {
  scrollTrigger: {
    trigger: '.featured-section',
    start: 'top 70%',
  },
  y: 40,
  opacity: 0,
  duration: 1.2,
  ease: 'power3.out',
  stagger: 0.18
});

// PARALLAX ON PRODUCT IMAGES
gsap.to('.product-image-wrapper img', {
  scrollTrigger: {
    trigger: '.featured-section',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
  },
  scale: 1.15,
  ease: 'none'
});


  }


  


  

}
