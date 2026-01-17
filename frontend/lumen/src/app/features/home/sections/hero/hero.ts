import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  imports: [CommonModule],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
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
}
