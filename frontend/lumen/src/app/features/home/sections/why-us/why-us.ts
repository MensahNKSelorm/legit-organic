import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-why-us',
  imports: [CommonModule],
  templateUrl: './why-us.html',
  styleUrl: './why-us.scss',
})
export class WhyUs {
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
}
