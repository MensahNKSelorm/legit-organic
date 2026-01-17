import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-featured',
  imports: [
    CommonModule
  ],
  templateUrl: './featured.html',
  styleUrl: './featured.scss',
})
export class Featured {
  featuredProducts = [
  {
    name: "Organic Ghana Rice",
    price: 45,
    description: "Clean, stone-free, chemical-free Ghanaian rice grown by trusted farmers.",
    image: "assets/products/p1.webp",
  },
  {
    name: "Fresh Garden Eggs",
    price: 12,
    description: "Rich in nutrients and harvested from pesticide-free farms.",
    image: "assets/products/p2.webp",
  },
  {
    name: "Local Honey (Pure)",
    price: 35,
    description: "Unheated, unfiltered, 100% organic honey from local beekeepers.",
    image: "assets/products/p3.webp",
  },
];
}
