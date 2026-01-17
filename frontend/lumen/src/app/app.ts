import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header, Footer } from '@app/layout';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    Header,
    Footer
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('lumen');
}
