import { Component } from '@angular/core';
import { Hero } from '../../sections/hero/hero';
import { WhyUs } from '../../sections/why-us/why-us';
import { QualityPromise } from '../../sections/quality-promise/quality-promise';
import { Recipes } from '../../sections/recipes/recipes';
import { PrimaryCta } from '../../sections/primary-cta/primary-cta';
import { Featured } from '../../sections/featured/featured';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
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
export class Home {}
