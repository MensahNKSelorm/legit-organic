import { CommonModule, NgClass } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import gsap from 'gsap';
import _ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(_ScrollTrigger)

@Component({
  selector: 'app-why-us',
  imports: [
    CommonModule,
    NgClass
  ],
  templateUrl: './why-us.html',
  styleUrl: './why-us.scss',
})
  

export class WhyUs implements AfterViewInit {
  whyFeatures = [
    {
      icon: 'organic',
      title: 'Organic & lab-verified',
      text: 'We focus on clean, safe, nutrient-rich Ghanaian rice, grains, and vegetables — without harmful pesticide residues.',
    },
    {
      icon: 'farmers',
      title: 'Fair to our farmers',
      text: 'We partner with trusted farmers, paying fair prices and supporting long-term relationships instead of quick, exploitative deals.',
    },
    {
      icon: 'delivery',
      title: 'Reliable delivery to you',
      text: 'From farm to home, we design our supply chain to keep your food fresh, traceable, and on time.',
    },
    {
      icon: 'transparency',
      title: 'Radical transparency',
      text: 'From where it was grown to how it was handled, we aim to show you the full story behind every Legit Organic product.',
    },
  ];

  ngAfterViewInit(): void {
    gsap.context(() => {

      // Header
      gsap.from('.why-header', {
        scrollTrigger: {
          trigger: '.why-section',
          start: 'top 80%',
        },
        y: 24,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        clearProps: 'transform',
      });

      // Cards (animate individually)
      gsap.utils.toArray<HTMLElement>('.why-card').forEach((card, i) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
          },
          y: 24,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          delay: i * 0.05,
          clearProps: 'transform',
        });
      });

    });
  }

}
